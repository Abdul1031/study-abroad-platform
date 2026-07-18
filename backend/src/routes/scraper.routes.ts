import { Router, Request, Response } from 'express';
import { getScraperScheduler, getScraperQueue, FULL_RUN_KEY } from '../services/scraper';
import { logger } from '../utils/logger';
import { requireAuth, requireRole, heavyOpRateLimiter } from '../middleware/security.middleware';

const router = Router();

// Scraper controls are admin-only, and a full run is expensive — throttle it.
router.use(requireAuth, requireRole('ADMIN'));
router.use('/run', heavyOpRateLimiter);

/**
 * POST /api/scraper/run
 * Enqueues a full scrape run and returns immediately (202). The queue
 * deduplicates: if a run is already queued or active, this merges into it.
 * Failures retry with exponential backoff, then land in the dead-letter queue.
 */
router.post('/run', (req: Request, res: Response) => {
  const queue = getScraperQueue();
  if (!queue) {
    return res.status(503).json({
      success: false,
      message: 'Scraper queue has not been initialised',
    });
  }

  const requestedBy = req.authUser?.email;
  logger.info(`[ScraperRoute] Manual scrape requested by ${requestedBy ?? 'unknown admin'}`);

  const { jobId, deduplicated } = queue.enqueue({ trigger: 'MANUAL', requestedBy }, FULL_RUN_KEY);

  return res.status(202).json({
    success: true,
    message: deduplicated
      ? 'A scrape run is already queued or in progress — your request merged into it'
      : 'Scrape run queued',
    jobId,
    deduplicated,
    queue: queue.getMetrics(),
  });
});

/**
 * GET /api/scraper/status
 * Scheduler liveness + live queue metrics.
 */
router.get('/status', (_req: Request, res: Response) => {
  const scheduler = getScraperScheduler();
  const queue = getScraperQueue();
  return res.status(200).json({
    success: true,
    schedulerInitialised: scheduler !== null,
    queue: queue ? queue.getMetrics() : null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/scraper/queue/dead-letters
 * Jobs that exhausted their retries, for admin inspection.
 */
router.get('/queue/dead-letters', (_req: Request, res: Response) => {
  const queue = getScraperQueue();
  if (!queue) {
    return res.status(503).json({ success: false, message: 'Scraper queue not initialised' });
  }
  return res.status(200).json({ success: true, data: queue.getDeadLetters() });
});

/**
 * POST /api/scraper/queue/dead-letters/:jobId/retry
 * Replay a dead-lettered run with a fresh attempt budget.
 */
router.post('/queue/dead-letters/:jobId/retry', (req: Request, res: Response) => {
  const queue = getScraperQueue();
  if (!queue) {
    return res.status(503).json({ success: false, message: 'Scraper queue not initialised' });
  }

  const requeued = queue.retryDeadLetter(req.params.jobId);
  if (!requeued) {
    return res.status(404).json({ success: false, message: 'Dead-lettered job not found' });
  }
  return res.status(202).json({ success: true, message: 'Job re-queued' });
});

export default router;
