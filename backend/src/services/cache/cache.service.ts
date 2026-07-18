import { logger } from '../../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// CacheService — cache-aside layer for hot read endpoints.
//
// Level 1 (this file): in-process LRU with per-entry TTL. Zero dependencies,
// correct for a single node, absorbs request stampedes on hot keys via
// in-flight loader deduplication.
//
// Level 2 (when clustering): implement CacheDriver against Redis (GET/SET EX/
// SCAN+DEL for prefix invalidation) and pass it to the CacheService
// constructor — call sites don't change.
// ═══════════════════════════════════════════════════════════════════════════

export interface CacheDriver {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  delete(key: string): void;
  deleteByPrefix(prefix: string): number;
  size(): number;
}

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * LRU + TTL memory cache. Map iteration order doubles as recency order:
 * reads re-insert the key, so the first key is always the least recently used.
 */
class MemoryLruDriver implements CacheDriver {
  private readonly entries = new Map<string, MemoryEntry>();

  constructor(private readonly maxEntries: number) {}

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    // Refresh recency
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.entries.has(key)) this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });

    // Evict least-recently-used overflow
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  deleteByPrefix(prefix: string): number {
    let removed = 0;
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
        removed++;
      }
    }
    return removed;
  }

  size(): number {
    return this.entries.size;
  }
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  entries: number;
}

export class CacheService {
  private hits = 0;
  private misses = 0;
  /** In-flight loaders keyed by cache key — stampede protection */
  private readonly pending = new Map<string, Promise<unknown>>();

  constructor(private readonly driver: CacheDriver) {}

  /**
   * Cache-aside read: return the cached value, or run `loader` exactly once
   * (even under concurrent misses for the same key) and cache its result.
   */
  async getOrSet<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = this.driver.get<T>(key);
    if (cached !== undefined) {
      this.hits++;
      return cached;
    }
    this.misses++;

    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight as Promise<T>;

    const promise = loader()
      .then((value) => {
        this.driver.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.driver.delete(key);
  }

  /** Invalidate a whole namespace, e.g. everything under "courses". */
  invalidatePrefix(prefix: string): void {
    const removed = this.driver.deleteByPrefix(prefix);
    if (removed > 0) {
      logger.info(`[Cache] Invalidated ${removed} entries under "${prefix}"`);
    }
  }

  getStats(): CacheStats {
    const lookups = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: lookups === 0 ? 0 : Math.round((this.hits / lookups) * 100),
      entries: this.driver.size(),
    };
  }
}

/** Process-wide cache instance for API read paths. */
export const appCache = new CacheService(new MemoryLruDriver(500));

/** TTL presets — short enough that admins see edits promptly. */
export const CacheTtl = {
  courseList: 60_000, // hot listing endpoint
  courseDetail: 5 * 60_000,
} as const;
