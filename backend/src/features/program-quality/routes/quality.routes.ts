import { Router } from 'express';
import {
  getReviewQueue,
  getReviewById,
  approveReview,
  rejectReview,
  triggerReviewScan,
} from '../controllers/review-queue.controller';
import {
  getQualityMetrics,
  getProgramCompleteness,
  getProgramAuditTrail,
} from '../controllers/quality.controller';
import {
  requireAuth,
  requireRole,
  heavyOpRateLimiter,
} from '../../../middleware/security.middleware';

const router = Router();

// The entire quality surface is an admin-reviewer tool.
router.use(requireAuth, requireRole('ADMIN'));

// ── Quality Metrics ───────────────────────────────────────────────────────────
// GET  /api/quality/metrics
router.get('/metrics', getQualityMetrics);

// GET  /api/quality/program/:courseId/completeness
router.get('/program/:courseId/completeness', getProgramCompleteness);

// GET  /api/quality/program/:courseId/audit-trail
router.get('/program/:courseId/audit-trail', getProgramAuditTrail);

// ── Review Queue ──────────────────────────────────────────────────────────────
// GET  /api/quality/review-queue
router.get('/review-queue', getReviewQueue);

// GET  /api/quality/review-queue/:programReviewId
router.get('/review-queue/:programReviewId', getReviewById);

// PATCH /api/quality/review-queue/:programReviewId/approve
router.patch('/review-queue/:programReviewId/approve', approveReview);

// PATCH /api/quality/review-queue/:programReviewId/reject
router.patch('/review-queue/:programReviewId/reject', rejectReview);

// POST /api/quality/trigger-review-scan (full-table recalculation — throttled)
router.post('/trigger-review-scan', heavyOpRateLimiter, triggerReviewScan);

export default router;
