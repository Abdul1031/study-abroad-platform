import { ScraperQueueService } from '../../features/program-quality/services/ScraperQueue.service';
import { appCache } from '../cache/cache.service';
import { logger } from '../../utils/logger';
import type { ScraperResult } from './scraper.types';
import type { FullScrapeTrigger, ScraperScheduler } from './scraper.scheduler';

// ── Full-run scrape queue (singleton) ────────────────────────────────────────
// Every scrape run — cron tick, admin "sync now", dead-letter replay — flows
// through this queue. The shared dedup key guarantees at most one full run is
// pending/active at any time, and failed runs retry with exponential backoff
// before landing in the dead-letter queue for admin inspection.

export interface FullScrapeJobData {
  trigger: FullScrapeTrigger;
  /** Admin email for MANUAL runs — shows up in the DLQ for accountability */
  requestedBy?: string;
}

/** Dedup key: only one full-catalog run may ever be queued at once. */
export const FULL_RUN_KEY = 'scrape:full-run';

let queueInstance: ScraperQueueService<FullScrapeJobData, ScraperResult[]> | null = null;

export function initScraperQueue(
  scheduler: ScraperScheduler
): ScraperQueueService<FullScrapeJobData, ScraperResult[]> {
  if (!queueInstance) {
    queueInstance = new ScraperQueueService<FullScrapeJobData, ScraperResult[]>(
      async (data, { attempt, jobId }) => {
        logger.info(
          `[ScraperQueue] Full scrape starting (job=${jobId}, trigger=${data.trigger}, attempt=${attempt})`
        );
        return scheduler.executeRun(data.trigger);
      },
      {
        concurrency: 1, // full runs are catalog-wide — never overlap them
        maxAttempts: 3,
        baseBackoffMs: 30_000,
        maxBackoffMs: 15 * 60_000,
      }
    );

    // A completed run may have changed any course — drop the read caches so
    // students see fresh data immediately.
    queueInstance.on('completed', () => {
      appCache.invalidatePrefix('courses:');
      appCache.invalidatePrefix('universities:');
    });
  }
  return queueInstance;
}

export function getScraperQueue(): ScraperQueueService<FullScrapeJobData, ScraperResult[]> | null {
  return queueInstance;
}
