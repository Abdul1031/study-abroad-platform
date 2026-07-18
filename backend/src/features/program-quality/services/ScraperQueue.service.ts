import crypto from 'node:crypto';
import PQueue from 'p-queue';
import { logger } from '../../../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// ScraperQueueService — elastic background job queue for scraping work.
//
// Replaces "fire p-queue promises and hope" with a real job lifecycle:
//   • Deduplication  — a job key (e.g. universityId) can only be queued once
//   • Retry policy   — exponential backoff with full jitter, capped
//   • Dead-letter    — jobs that exhaust retries are parked, inspectable,
//                      and manually replayable (mirrors BullMQ's failed set)
//   • Concurrency    — bounded worker pool via p-queue
//   • Backpressure   — pause/resume + graceful drain for clean shutdowns
//
// The public API (enqueue / on / getMetrics / shutdown) is deliberately shaped
// like BullMQ's Queue+Worker pair. Scaling beyond one node means swapping this
// in-process implementation for a thin BullMQ adapter with the same surface —
// callers don't change.
// ═══════════════════════════════════════════════════════════════════════════

// ── Job model ────────────────────────────────────────────────────────────────

export type JobStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTERED';

/** Payload for a university scrape job (default TData). */
export interface ScrapeJobData {
  universityId: string;
  universityName: string;
  universityUrl: string;
  /** What caused this job — useful when reading the dead-letter queue */
  trigger: 'SCHEDULED' | 'MANUAL' | 'RETRY_DEAD_LETTER';
}

export interface QueueJob<TData> {
  readonly id: string;
  /** Dedup key — while a job with this key is pending/active, enqueues merge into it */
  readonly key: string;
  readonly data: TData;
  status: JobStatus;
  /** Attempts consumed so far (1 = first run) */
  attempts: number;
  readonly maxAttempts: number;
  readonly createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  /** Message of the most recent failure */
  lastError?: string;
}

export interface ScraperQueueOptions {
  /** Max jobs processed simultaneously (default 3) */
  concurrency?: number;
  /** Total attempts per job including the first (default 4) */
  maxAttempts?: number;
  /** Base delay before the first retry, doubles each attempt (default 5s) */
  baseBackoffMs?: number;
  /** Ceiling for any single backoff delay (default 5min) */
  maxBackoffMs?: number;
  /** Max jobs kept in the dead-letter queue before oldest are evicted (default 200) */
  deadLetterLimit?: number;
  /** Optional minimum spacing between job starts, for politeness (default 0) */
  minJobIntervalMs?: number;
}

export interface QueueMetrics {
  pending: number;
  active: number;
  completed: number;
  failedAttempts: number;
  deadLettered: number;
  averageJobDurationMs: number;
}

type QueueEvent = 'completed' | 'retrying' | 'deadLettered';

type QueueListener<TData, TResult> = (
  job: Readonly<QueueJob<TData>>,
  detail: { result?: TResult; error?: string; nextRetryInMs?: number }
) => void;

export type JobProcessor<TData, TResult> = (
  data: TData,
  context: { attempt: number; jobId: string }
) => Promise<TResult>;

// ── Service ──────────────────────────────────────────────────────────────────

export class ScraperQueueService<TData = ScrapeJobData, TResult = unknown> {
  private readonly processor: JobProcessor<TData, TResult>;
  private readonly concurrency: number;
  private readonly maxAttempts: number;
  private readonly baseBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly deadLetterLimit: number;

  private readonly pool: PQueue;
  /** Live jobs indexed by dedup key (PENDING or ACTIVE only) */
  private readonly liveJobs = new Map<string, QueueJob<TData>>();
  private readonly deadLetters: QueueJob<TData>[] = [];
  private readonly retryTimers = new Map<string, NodeJS.Timeout>();
  private readonly listeners = new Map<QueueEvent, Set<QueueListener<TData, TResult>>>();

  private shuttingDown = false;
  private completedCount = 0;
  private failedAttemptCount = 0;
  private totalDurationMs = 0;

  constructor(processor: JobProcessor<TData, TResult>, options: ScraperQueueOptions = {}) {
    this.processor = processor;
    this.concurrency = options.concurrency ?? 3;
    this.maxAttempts = options.maxAttempts ?? 4;
    this.baseBackoffMs = options.baseBackoffMs ?? 5_000;
    this.maxBackoffMs = options.maxBackoffMs ?? 5 * 60_000;
    this.deadLetterLimit = options.deadLetterLimit ?? 200;

    this.pool = new PQueue({
      concurrency: this.concurrency,
      ...(options.minJobIntervalMs ? { interval: options.minJobIntervalMs, intervalCap: 1 } : {}),
    });
  }

  // ── Enqueue with deduplication ─────────────────────────────────────────────

  /**
   * Queue a job. If a job with the same key is already pending or active the
   * call is a no-op merge (`deduplicated: true`) — exactly how BullMQ jobId
   * dedup behaves, and what stops a manual "sync now" from doubling up with
   * the weekly cron run.
   */
  enqueue(data: TData, key: string): { jobId: string; deduplicated: boolean } {
    if (this.shuttingDown) {
      throw new Error('ScraperQueueService is shutting down — no new jobs accepted');
    }

    const existing = this.liveJobs.get(key);
    if (existing) {
      logger.debug(`[ScraperQueue] Dedup hit for key "${key}" (job ${existing.id})`);
      return { jobId: existing.id, deduplicated: true };
    }

    const job: QueueJob<TData> = {
      id: crypto.randomUUID(),
      key,
      data,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: this.maxAttempts,
      createdAt: new Date(),
    };
    this.liveJobs.set(key, job);
    this.schedule(job, 0);

    logger.info(`[ScraperQueue] Enqueued job ${job.id} (key="${key}")`);
    return { jobId: job.id, deduplicated: false };
  }

  /** Enqueue many at once; returns how many were new vs merged. */
  enqueueBulk(items: ReadonlyArray<{ data: TData; key: string }>): {
    enqueued: number;
    deduplicated: number;
  } {
    let enqueued = 0;
    let deduplicated = 0;
    for (const item of items) {
      if (this.enqueue(item.data, item.key).deduplicated) deduplicated++;
      else enqueued++;
    }
    return { enqueued, deduplicated };
  }

  // ── Execution with retry + backoff ─────────────────────────────────────────

  private schedule(job: QueueJob<TData>, delayMs: number): void {
    const run = (): void => {
      this.retryTimers.delete(job.id);
      void this.pool.add(() => this.execute(job));
    };

    if (delayMs <= 0) {
      run();
      return;
    }
    const timer = setTimeout(run, delayMs);
    timer.unref();
    this.retryTimers.set(job.id, timer);
  }

  private async execute(job: QueueJob<TData>): Promise<void> {
    if (this.shuttingDown && job.attempts === 0) {
      // Drop never-started jobs during drain; active ones finish naturally.
      this.liveJobs.delete(job.key);
      return;
    }

    job.attempts += 1;
    job.status = 'ACTIVE';
    job.startedAt = new Date();
    const startedMs = Date.now();

    try {
      const result = await this.processor(job.data, { attempt: job.attempts, jobId: job.id });

      job.status = 'COMPLETED';
      job.finishedAt = new Date();
      this.liveJobs.delete(job.key);
      this.completedCount += 1;
      this.totalDurationMs += Date.now() - startedMs;

      logger.info(
        `[ScraperQueue] Job ${job.id} completed on attempt ${job.attempts}/${job.maxAttempts} ` +
          `in ${Date.now() - startedMs}ms`
      );
      this.emit('completed', job, { result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      job.lastError = message;
      this.failedAttemptCount += 1;

      if (job.attempts >= job.maxAttempts || this.shuttingDown) {
        this.moveToDeadLetter(job);
        return;
      }

      const backoff = this.computeBackoff(job.attempts);
      job.status = 'PENDING';
      logger.warn(
        `[ScraperQueue] Job ${job.id} failed attempt ${job.attempts}/${job.maxAttempts} ` +
          `("${message}") — retrying in ${Math.round(backoff / 1000)}s`
      );
      this.emit('retrying', job, { error: message, nextRetryInMs: backoff });
      this.schedule(job, backoff);
    }
  }

  /**
   * Exponential backoff with full jitter: delay ∈ [0, min(cap, base·2^(n-1))].
   * Jitter prevents a burst of simultaneous failures (e.g. a university site
   * going down) from retrying in lockstep and hammering it again.
   */
  private computeBackoff(attempt: number): number {
    const exponential = this.baseBackoffMs * 2 ** (attempt - 1);
    const capped = Math.min(this.maxBackoffMs, exponential);
    return Math.floor(Math.random() * capped);
  }

  // ── Dead-letter queue ──────────────────────────────────────────────────────

  private moveToDeadLetter(job: QueueJob<TData>): void {
    job.status = 'DEAD_LETTERED';
    job.finishedAt = new Date();
    this.liveJobs.delete(job.key);

    this.deadLetters.push(job);
    if (this.deadLetters.length > this.deadLetterLimit) {
      this.deadLetters.shift(); // evict oldest
    }

    logger.error(
      `[ScraperQueue] Job ${job.id} (key="${job.key}") dead-lettered after ` +
        `${job.attempts} attempts. Last error: ${job.lastError ?? 'unknown'}`
    );
    this.emit('deadLettered', job, { error: job.lastError });
  }

  /** Snapshot of parked jobs for the admin quality dashboard. */
  getDeadLetters(): ReadonlyArray<Readonly<QueueJob<TData>>> {
    return [...this.deadLetters];
  }

  /** Replay a dead-lettered job with a fresh attempt budget. */
  retryDeadLetter(jobId: string): boolean {
    const index = this.deadLetters.findIndex((job) => job.id === jobId);
    if (index === -1) return false;

    const [dead] = this.deadLetters.splice(index, 1);
    this.enqueue(dead.data, dead.key);
    logger.info(`[ScraperQueue] Dead-lettered job ${jobId} re-queued`);
    return true;
  }

  // ── Lifecycle & observability ──────────────────────────────────────────────

  on(event: QueueEvent, listener: QueueListener<TData, TResult>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener);
    this.listeners.set(event, set);
    return () => set.delete(listener);
  }

  private emit(
    event: QueueEvent,
    job: QueueJob<TData>,
    detail: { result?: TResult; error?: string; nextRetryInMs?: number }
  ): void {
    for (const listener of this.listeners.get(event) ?? []) {
      try {
        listener(job, detail);
      } catch (err) {
        logger.warn(`[ScraperQueue] Listener for "${event}" threw: ${String(err)}`);
      }
    }
  }

  getMetrics(): QueueMetrics {
    let pending = 0;
    let active = 0;
    for (const job of this.liveJobs.values()) {
      if (job.status === 'ACTIVE') active++;
      else pending++;
    }
    return {
      pending,
      active,
      completed: this.completedCount,
      failedAttempts: this.failedAttemptCount,
      deadLettered: this.deadLetters.length,
      averageJobDurationMs:
        this.completedCount === 0 ? 0 : Math.round(this.totalDurationMs / this.completedCount),
    };
  }

  /** Temporarily stop starting new jobs (active ones keep running). */
  pause(): void {
    this.pool.pause();
  }

  resume(): void {
    this.pool.start();
  }

  /** Resolves when everything queued has settled — handy in tests. */
  async onIdle(): Promise<void> {
    await this.pool.onIdle();
  }

  /**
   * Graceful drain for shutdown hooks: refuse new work, cancel scheduled
   * retries, and wait (bounded) for in-flight jobs to finish.
   */
  async shutdown(timeoutMs = 30_000): Promise<void> {
    this.shuttingDown = true;
    this.pool.pause();

    for (const timer of this.retryTimers.values()) clearTimeout(timer);
    this.retryTimers.clear();

    this.pool.start(); // let already-started work run to completion
    await Promise.race([
      this.pool.onIdle(),
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, timeoutMs);
        t.unref();
      }),
    ]);

    logger.info('[ScraperQueue] Shutdown complete', this.getMetrics());
  }
}
