import cron, { ScheduledTask } from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { ScraperOrchestrator } from './scraper.orchestrator';
import { getScraperQueue, FULL_RUN_KEY } from './scraper.queue';
import type { ScraperConfig, ScraperResult } from './scraper.types';

export type FullScrapeTrigger = 'SCHEDULED' | 'MANUAL' | 'RETRY_DEAD_LETTER';

/**
 * ScraperScheduler wraps the orchestrator in a cron job.
 * - Runs automatically every Sunday at 2:00 AM UTC.
 * - Cron ticks and manual runs both flow through the ScraperQueue when it is
 *   initialised, so deduplication/retries/DLQ apply uniformly.
 * - Exposes `runNow()` for on-demand / admin-triggered runs.
 * - Exposes `stop()` for graceful shutdown.
 */
export class ScraperScheduler {
  private readonly orchestrator: ScraperOrchestrator;
  private readonly config: ScraperConfig;
  private task: ScheduledTask | null = null;
  private isRunning = false;

  // Sunday 2 AM UTC: "0 2 * * 0"
  private static readonly CRON_EXPRESSION = '0 2 * * 0';

  constructor(prisma: PrismaClient, config: ScraperConfig) {
    this.config = config;
    this.orchestrator = new ScraperOrchestrator(prisma, config);
  }

  // ── Start the weekly cron job ──────────────────────────────────────────────
  start(): void {
    if (!this.config.enabled) {
      logger.warn('[ScraperScheduler] Scraper is disabled via config — cron not started');
      return;
    }

    if (this.task) {
      logger.warn('[ScraperScheduler] Scheduler already running — ignoring duplicate start()');
      return;
    }

    this.task = cron.schedule(
      ScraperScheduler.CRON_EXPRESSION,
      async () => {
        const queue = getScraperQueue();
        if (queue) {
          // Dedup key means a tick that lands while a manual run is queued or
          // active simply merges into it.
          const { deduplicated } = queue.enqueue({ trigger: 'SCHEDULED' }, FULL_RUN_KEY);
          if (deduplicated) {
            logger.warn(
              '[ScraperScheduler] A full run is already queued/active — cron tick merged'
            );
          }
          return;
        }
        if (this.isRunning) {
          logger.warn('[ScraperScheduler] Previous scrape still running — skipping this tick');
          return;
        }
        await this.executeRun('SCHEDULED').catch((err) => {
          logger.error('[ScraperScheduler] Scheduled run failed', err);
        });
      },
      {
        timezone: 'UTC',
      }
    );

    logger.info('✅ Scraper scheduler started — will run every Sunday at 02:00 UTC');
  }

  // ── Stop the cron job (called on graceful shutdown) ────────────────────────
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('[ScraperScheduler] Scheduler stopped');
    }
  }

  // ── Manually trigger a full scrape run immediately ─────────────────────────
  async runNow(): Promise<ScraperResult[]> {
    if (this.isRunning) {
      logger.warn('[ScraperScheduler] Scrape already in progress — skipping runNow()');
      return [];
    }
    try {
      return await this.executeRun('MANUAL');
    } catch (err) {
      logger.error('[ScraperScheduler] ❌ Manual run failed', err);
      return [];
    }
  }

  /**
   * Execute a full scrape run. Called by the ScraperQueue's processor —
   * throws on overlap or catastrophic failure so the queue's retry/backoff
   * and dead-letter handling take over.
   */
  async executeRun(trigger: FullScrapeTrigger): Promise<ScraperResult[]> {
    if (this.isRunning) {
      throw new Error('A scrape run is already in progress');
    }

    this.isRunning = true;
    const startedAt = new Date();
    logger.info(
      `[ScraperScheduler] 🚀 Starting ${trigger} scrape run at ${startedAt.toISOString()}`
    );

    try {
      const results = await this.orchestrator.scrapeAll();

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;
      const totalCourses = results.reduce((s, r) => s + r.coursesFound, 0);
      const durationSec = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);

      logger.info(
        `[ScraperScheduler] ✅ ${trigger} run complete in ${durationSec}s — ` +
          `${successCount} succeeded, ${failCount} failed, ${totalCourses} courses found`
      );

      return results;
    } finally {
      this.isRunning = false;
    }
  }
}
