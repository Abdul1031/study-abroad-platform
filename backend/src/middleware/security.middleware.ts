import crypto from 'node:crypto';
import type { CookieOptions, NextFunction, Request, RequestHandler, Response } from 'express';
import type { CorsOptions } from 'cors';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  TOKEN_ALGORITHM,
} from '../domain/auth/auth.constants';
import type { TokenPayload } from '../domain/auth/auth.types';

// ═══════════════════════════════════════════════════════════════════════════
// Enterprise security middleware
//   1. Fail-fast secret handling
//   2. Tightened CORS (origin allowlist)
//   3. Hardened response headers (CSP, HSTS, frame/sniff protection)
//   4. Rate limiting (sliding window; swap store for Redis when clustering)
//   5. CSRF protection via double-submit cookie
//   6. JWT access-token guard + role-based access control
//   7. Refresh Token Rotation (RTR) with reuse detection & session revocation
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Secrets ───────────────────────────────────────────────────────────────

/**
 * Resolve the JWT secret once at module load. In production a missing secret
 * is a hard failure — silently falling back to a known string would let anyone
 * forge tokens.
 */
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (env.isProduction) {
      throw new Error('JWT_SECRET must be set to a random string of at least 32 characters');
    }
    logger.warn('[security] JWT_SECRET missing/short — using an insecure dev-only fallback');
    return 'dev-only-insecure-secret-do-not-use-in-production!!';
  }
  return secret;
})();

/** Error subtype the global errorHandler maps to an HTTP status. */
export class SecurityError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'SecurityError';
    this.statusCode = statusCode;
  }
}

// ── 2. Tightened CORS ────────────────────────────────────────────────────────

/**
 * Strict allowlist CORS. Origins come from FRONTEND_URL plus the optional
 * comma-separated CORS_ALLOWED_ORIGINS env var. Requests from any other
 * browser origin are rejected; non-browser requests (no Origin header, e.g.
 * curl or server-to-server) pass through and are guarded by auth instead.
 *
 * Usage in app.ts:  app.use(cors(buildCorsOptions()));
 */
export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = new Set<string>(
    [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      ...(process.env.CORS_ALLOWED_ORIGINS ?? '').split(','),
    ]
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter((origin) => origin.length > 0)
  );

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }
      logger.warn(`[security] Blocked CORS request from disallowed origin: ${origin}`);
      callback(new SecurityError('Origin not allowed by CORS policy', 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', CSRF_HEADER],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
    maxAge: 86_400, // cache preflight for 24h
  };
}

// ── 3. Hardened response headers ─────────────────────────────────────────────

/**
 * Security headers for a JSON API (equivalent to a tuned helmet() setup,
 * without the extra dependency). Mount before all routes.
 */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  // An API should never be interpreted as a document by browsers.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.removeHeader('X-Powered-By');
  if (env.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
};

// ── 4. Rate limiting ─────────────────────────────────────────────────────────

interface RateLimitOptions {
  /** Window length in milliseconds */
  windowMs: number;
  /** Max requests per key per window */
  max: number;
  /** Namespace so different limiters don't share buckets */
  name: string;
}

interface RateBucket {
  /** Timestamps (ms) of requests inside the current window */
  hits: number[];
}

/**
 * Sliding-window rate limiter keyed by IP.
 *
 * The store is in-memory, which is correct for a single node. When scaling to
 * multiple instances, replace the Map with a Redis sorted-set implementation
 * (same keying scheme: `${name}:${ip}`) — the middleware contract stays
 * identical.
 */
export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, RateBucket>();

  // Periodic sweep so idle IPs don't leak memory. unref() keeps the timer
  // from holding the process open during shutdown/tests.
  const sweep = setInterval(() => {
    const cutoff = Date.now() - options.windowMs;
    for (const [key, bucket] of buckets) {
      bucket.hits = bucket.hits.filter((ts) => ts > cutoff);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  }, options.windowMs);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${options.name}:${req.ip ?? 'unknown'}`;
    const now = Date.now();
    const cutoff = now - options.windowMs;

    const bucket = buckets.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter((ts) => ts > cutoff);

    if (bucket.hits.length >= options.max) {
      const oldest = bucket.hits[0] ?? now;
      const retryAfterSec = Math.ceil((oldest + options.windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      res.setHeader('X-RateLimit-Limit', String(options.max));
      res.setHeader('X-RateLimit-Remaining', '0');
      logger.warn(`[security] Rate limit exceeded for ${key}`);
      res.status(429).json({ success: false, message: 'Too many requests, slow down' });
      return;
    }

    bucket.hits.push(now);
    buckets.set(key, bucket);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(options.max - bucket.hits.length));
    next();
  };
}

/** Broad API limiter — mount on /api */
export const apiRateLimiter = createRateLimiter({ name: 'api', windowMs: 60_000, max: 120 });
/** Strict limiter for credential endpoints (login/signup/refresh) */
export const authRateLimiter = createRateLimiter({ name: 'auth', windowMs: 15 * 60_000, max: 10 });
/** Very strict limiter for expensive admin triggers (scraper run, review scan) */
export const heavyOpRateLimiter = createRateLimiter({
  name: 'heavy',
  windowMs: 10 * 60_000,
  max: 3,
});

// ── 5. CSRF protection (double-submit cookie) ────────────────────────────────

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Issues the CSRF cookie on any response that doesn't have one yet.
 * Deliberately NOT httpOnly: the double-submit pattern requires the SPA to
 * read the cookie and echo it back in the x-csrf-token header. SameSite=strict
 * plus the origin allowlist means a cross-site attacker can neither read nor
 * send it.
 */
export const issueCsrfToken: RequestHandler = (req, res, next) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  if (!cookies?.[CSRF_COOKIE]) {
    res.cookie(CSRF_COOKIE, crypto.randomBytes(32).toString('hex'), {
      httpOnly: false,
      secure: env.isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 12 * 60 * 60 * 1000, // 12h — rotates naturally with sessions
    });
  }
  next();
};

/**
 * Verifies the double-submit pair on every state-changing request.
 * `ignorePaths` lets pre-session endpoints (or webhook receivers authenticated
 * by other means) opt out.
 */
export function csrfProtection(ignorePaths: readonly string[] = []): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method) || ignorePaths.some((p) => req.path.startsWith(p))) {
      next();
      return;
    }

    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const cookieToken = cookies?.[CSRF_COOKIE];
    const headerToken = req.header(CSRF_HEADER);

    if (!cookieToken || !headerToken || !timingSafeEquals(cookieToken, headerToken)) {
      logger.warn(`[security] CSRF check failed for ${req.method} ${req.path}`);
      res.status(403).json({ success: false, message: 'CSRF token missing or invalid' });
      return;
    }
    next();
  };
}

function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ── 6. JWT guard + RBAC ──────────────────────────────────────────────────────

export type AppRole = 'STUDENT' | 'ADMIN';

export interface AuthenticatedUser extends TokenPayload {
  role: AppRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

/**
 * Bridge until a `role` column lands on the Student model: emails listed in
 * ADMIN_EMAILS (comma-separated) are treated as admins. Once the column
 * exists, embed `role` in the access token at login and this set goes away.
 */
const adminEmailAllowlist = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
);

/** Role for a bare email — used by auth responses so the SPA can gate admin UI. */
export function resolveRoleForEmail(email: string): AppRole {
  return adminEmailAllowlist.has(email.toLowerCase()) ? 'ADMIN' : 'STUDENT';
}

function resolveRole(payload: TokenPayload & { role?: string }): AppRole {
  if (payload.role === 'ADMIN') return 'ADMIN';
  return resolveRoleForEmail(payload.email);
}

/** Verifies the Bearer access token and attaches `req.authUser`. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
    }) as TokenPayload & { role?: string };
    req.authUser = { ...payload, role: resolveRole(payload) };
    next();
  } catch (err: unknown) {
    const expired = err instanceof Error && err.name === 'TokenExpiredError';
    res.status(401).json({
      success: false,
      message: expired ? 'Token expired' : 'Invalid token',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
    });
  }
};

/**
 * Context-aware RBAC guard. Compose after requireAuth:
 *   router.patch('/review-queue/:id/approve', requireAuth, requireRole('ADMIN'), handler)
 */
export function requireRole(...roles: readonly AppRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.authUser) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      logger.warn(
        `[security] RBAC denied ${req.authUser.email} (${req.authUser.role}) on ${req.method} ${req.path}`
      );
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/**
 * Guard for resources owned by a student: admins pass, students only when the
 * route param matches their own id. Prevents horizontal privilege escalation
 * on routes like GET /api/recommendations/:studentId.
 */
export function requireSelfOrAdmin(paramName = 'studentId'): RequestHandler {
  return (req, res, next) => {
    if (!req.authUser) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (req.authUser.role === 'ADMIN' || req.params[paramName] === req.authUser.studentId) {
      next();
      return;
    }
    res.status(403).json({ success: false, message: 'You may only access your own resources' });
  };
}

// ── 7. Refresh Token Rotation (RTR) with reuse detection ────────────────────

const REFRESH_TOKEN_TTL_DAYS = 7; // keep in sync with JWT_REFRESH_EXPIRY ('7d')
export const REFRESH_COOKIE = 'refresh_token';

/** Cookie options for the refresh token — scoped to the auth routes only. */
export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

export interface RotatedSession {
  studentId: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Rotate a refresh token: every use consumes the presented token and issues a
 * fresh access/refresh pair.
 *
 * Reuse detection: a token that passes signature verification but is absent
 * from the RefreshToken table was already rotated once — meaning it was
 * replayed (stolen, or an out-of-sync client). The only safe response is to
 * revoke EVERY session for that student and force re-login.
 */
export async function rotateRefreshToken(presentedToken: string): Promise<RotatedSession> {
  let studentId: string;
  try {
    const decoded = jwt.verify(presentedToken, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
    }) as { studentId?: string };
    if (typeof decoded.studentId !== 'string') {
      throw new SecurityError('Malformed refresh token');
    }
    studentId = decoded.studentId;
  } catch (err) {
    if (err instanceof SecurityError) throw err;
    throw new SecurityError('Invalid or expired refresh token');
  }

  const record = await prisma.refreshToken.findUnique({ where: { token: presentedToken } });

  if (!record) {
    // Signature valid but token unknown → it was already rotated → REUSE.
    const revoked = await prisma.refreshToken.deleteMany({ where: { studentId } });
    logger.error(
      `[security] Refresh token REUSE detected for student ${studentId} — revoked ${revoked.count} session(s)`
    );
    throw new SecurityError('Session compromised — please sign in again');
  }

  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: record.id } });
    throw new SecurityError('Refresh token expired');
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, email: true },
  });
  if (!student) {
    await prisma.refreshToken.deleteMany({ where: { studentId } });
    throw new SecurityError('Account no longer exists');
  }

  const accessToken = jwt.sign({ studentId: student.id, email: student.email }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    algorithm: TOKEN_ALGORITHM,
  });
  // jti makes every refresh token unique — without it, two tokens signed for
  // the same student within the same second are byte-identical, which breaks
  // rotation (the "new" DB row would equal the consumed one).
  const refreshToken = jwt.sign({ studentId: student.id }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    algorithm: TOKEN_ALGORITHM,
    jwtid: crypto.randomUUID(),
  });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Atomic swap: the old token dies in the same transaction the new one is
  // born, so a crash can't leave two live tokens for one session.
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: record.id } }),
    prisma.refreshToken.create({ data: { studentId, token: refreshToken, expiresAt } }),
  ]);

  return { studentId, accessToken, refreshToken };
}

/** Instantly invalidate every session for a student (password change, admin ban, reuse alarm). */
export async function revokeAllSessions(studentId: string): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({ where: { studentId } });
  logger.info(`[security] Revoked ${result.count} session(s) for student ${studentId}`);
  return result.count;
}

/**
 * Drop-in Express handler for POST /api/auth/refresh — reads the httpOnly
 * cookie, rotates, and re-sets the cookie:
 *
 *   router.post('/refresh', authRateLimiter, refreshSessionHandler);
 */
export const refreshSessionHandler: RequestHandler = async (req, res) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const presented = cookies?.[REFRESH_COOKIE];

  if (!presented) {
    res.status(401).json({ success: false, message: 'No refresh token' });
    return;
  }

  try {
    const session = await rotateRefreshToken(presented);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions);
    res.json({ success: true, data: { accessToken: session.accessToken } });
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, { path: refreshCookieOptions.path });
    const status = err instanceof SecurityError ? err.statusCode : 401;
    const message = err instanceof Error ? err.message : 'Could not refresh session';
    res.status(status).json({ success: false, message });
  }
};
