import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health';
import universityRoutes from './routes/university.routes';
import courseRoutes from './routes/course.routes';
import recommendationRoutes from './routes/recommendation.routes';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import applicationRoutes from './routes/application.routes';
import scraperRoutes from './routes/scraper.routes';
import { qualityRoutes } from './features/program-quality';
import { errorHandler } from './middleware/errorHandler';
import {
  buildCorsOptions,
  securityHeaders,
  apiRateLimiter,
  issueCsrfToken,
} from './middleware/security.middleware';

const app = express();

// Trust the first reverse proxy (nginx/ALB) so req.ip is the real client IP
// for rate limiting, not the proxy's address.
app.set('trust proxy', 1);

// Middleware
app.use(securityHeaders);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(issueCsrfToken);
app.use('/api', apiRateLimiter);
// CSRF: not enforced here — the frontend (Vercel) and this API (Render) are
// on unrelated domains, so the double-submit cookie pattern can't function
// (see the comment on csrfProtection() in security.middleware.ts for why,
// and why the CORS allowlist + Bearer-token auth already cover it).

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/quality', qualityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
