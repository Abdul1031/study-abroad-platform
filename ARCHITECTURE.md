# Architecture

Quick orientation doc. For the full phase-by-phase build history see [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md); for the security/scaling/caching design see [`docs/ARCHITECTURE_V2.md`](./docs/ARCHITECTURE_V2.md).

## Monorepo layout

npm workspaces + Turborepo, two packages: `backend/` (Express API) and `frontend/` (React SPA). No shared package yet — types are duplicated at the API boundary by design (Zod schemas on the backend, hand-written interfaces on the frontend), since the two evolve independently and a shared-types package would couple their release cadence.

## Request flow

```
React SPA (Vite)
   │ Axios: attaches Bearer token + CSRF header, auto-retries once on 401
   │ via silent refresh-token rotation
   ▼
Express app.ts
   │ securityHeaders → CORS (origin allowlist) → body limits → CSRF cookie
   │ → rate limiter → CSRF verification (state-changing routes)
   ▼
Route → requireAuth [→ requireRole('ADMIN')] → Controller
   ▼
Service layer (business logic, e.g. UniversityRecommendationService)
   │ reads through appCache (in-memory LRU, cache-aside, stampede-safe)
   ▼
Repository layer → Prisma Client → PostgreSQL
```

## Backend layers

- **`routes/`** — thin Express routers; auth/RBAC/rate-limit middleware composed per-route.
- **`controllers/`** — request/response shaping, Zod validation, error mapping.
- **`services/`** — business logic. Notable ones:
  - `university-recommendation.service.ts` — the scoring engine (academic fit, language, affordability, program alignment, preferences), cached per student.
  - `cache/cache.service.ts` — generic cache-aside LRU with in-flight-loader dedup (prevents stampedes on hot keys).
  - `scraper/scraper.queue.ts` — job queue wrapping the scraper orchestrator: per-key dedup, exponential backoff, dead-letter queue.
- **`repositories/`** — Prisma query builders; the only layer that talks to the DB directly.
- **`middleware/security.middleware.ts`** — CORS, CSP/security headers, rate limiting, CSRF double-submit, JWT verification + RBAC, and Refresh Token Rotation with reuse detection.
- **`features/program-quality/`** — self-contained module: completeness scoring, validator (gates what becomes `isMatchEligible`), audit trail, admin review queue.

## Data model (Prisma)

Key models: `Student`, `University`, `Course`, `Application` (tracker), `RecommendationCache`, `SavedUniversity`, `RefreshToken`, plus the Phase-5 quality models `ProgramRequirement`/`ProgramModule`/`ProgramIntake`/`ProgramFee`/`ProgramHistory`/`ProgramReview`. Full schema: [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).

`University.type` is one of `UNIVERSITY` | `TECHNICAL_UNIVERSITY` | `APPLIED_SCIENCES` (all public institutions — no private universities in the catalog by design). `University.state` holds the English Bundesland name, grouped into regions on the frontend for the region filter.

## Frontend

Feature-folder structure under `src/features/` (auth, profile, universities, recommendations, tracker, admin, dashboard). Server state lives in TanStack Query; the only client state is UI-local (wizard step, filter drafts). Route-level code splitting via `React.lazy` keeps the initial bundle small. Framer Motion drives the fluid card/modal interactions (`layoutId` morphing, scroll-triggered stagger reveals, magnetic hover).

## Security model

- **Refresh Token Rotation**: every `/auth/refresh` call consumes the presented token and issues a new one atomically. A token reused after rotation (replay) revokes every session for that student — see `rotateRefreshToken()` in `security.middleware.ts`.
- **CSRF**: double-submit cookie, verified on every non-GET request.
- **RBAC**: `requireRole('ADMIN')` gates the `/quality` and `/scraper` route trees; `requireSelfOrAdmin` prevents students from reading each other's data.
- **Rate limiting**: tiered — broad `/api` limiter, strict limiter on auth endpoints, very strict on expensive admin triggers (scraper run, review scan).

## Caching & invalidation

Two hot read paths (`GET /universities`, `GET /courses`) sit behind a cache-aside LRU (60s TTL). Invalidated on: a completed scraper run (`courses:*`, `universities:*` prefixes dropped) and a profile save (that student's recommendation cache only). No manual cache-busting needed elsewhere.
