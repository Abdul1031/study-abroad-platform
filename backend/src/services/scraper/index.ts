import type { PrismaClient } from '@prisma/client';
import { ScraperScheduler } from './scraper.scheduler';
import { initScraperQueue, getScraperQueue, FULL_RUN_KEY } from './scraper.queue';
import { DEFAULT_SCRAPER_CONFIG } from './scraper.types';
import type { ScraperConfig, ScraperResult, ScrapedCourse } from './scraper.types';
import type { FullScrapeJobData } from './scraper.queue';

// ── Singleton instance ────────────────────────────────────────────────────────
let schedulerInstance: ScraperScheduler | null = null;

/**
 * Initialise (or return existing) scraper scheduler singleton and its
 * backing job queue. Call this once during app startup.
 */
export function initScraperScheduler(
  prisma: PrismaClient,
  config: Partial<ScraperConfig> = {}
): ScraperScheduler {
  if (!schedulerInstance) {
    const mergedConfig: ScraperConfig = { ...DEFAULT_SCRAPER_CONFIG, ...config };
    schedulerInstance = new ScraperScheduler(prisma, mergedConfig);
    initScraperQueue(schedulerInstance);
  }
  return schedulerInstance;
}

/**
 * Return the existing scheduler instance without creating a new one.
 * Returns null if `initScraperScheduler` has not been called yet.
 */
export function getScraperScheduler(): ScraperScheduler | null {
  return schedulerInstance;
}

// ── Re-export types for consumers ─────────────────────────────────────────────
export type { ScraperConfig, ScraperResult, ScrapedCourse, FullScrapeJobData };
export { ScraperScheduler, getScraperQueue, FULL_RUN_KEY };
