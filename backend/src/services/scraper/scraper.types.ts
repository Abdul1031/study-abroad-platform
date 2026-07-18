import { z } from 'zod';

// ── Scraped Course Schema ────────────────────────────────────────────────────
export const ScrapedCourseSchema = z.object({
  name: z.string().min(2).max(300),
  degree: z.enum(['BACHELOR', 'MASTER', 'PHD', 'DIPLOMA', 'CERTIFICATE']),
  field: z.string().min(2).max(100),
  language: z.enum(['ENGLISH', 'GERMAN', 'BILINGUAL']).default('ENGLISH'),
  durationSemesters: z.number().int().min(1).max(20).optional(),
  credits: z.number().int().min(1).max(500).optional(),
  tuitionFeeEuros: z.number().min(0).optional(),
  applicationDeadlineWinter: z.string().optional(), // e.g., "May 31"
  applicationDeadlineSummer: z.string().optional(), // e.g., "November 30"
  ieltsMinimum: z.number().min(0).max(9).optional(),
  gpaMinimum: z.number().min(0).max(4).optional(),
  curriculum: z.array(z.string()).optional(),
  careerProspects: z.array(z.string()).optional(),
  courseUrl: z.string().url().optional(),
});

export type ScrapedCourse = z.infer<typeof ScrapedCourseSchema>;

// ── Scraped University Data ──────────────────────────────────────────────────
export const ScrapedUniversityDataSchema = z.object({
  universityId: z.string().cuid(),
  courses: z.array(ScrapedCourseSchema),
  scrapedAt: z.date(),
  success: z.boolean(),
  error: z.string().optional(),
});

export type ScrapedUniversityData = z.infer<typeof ScrapedUniversityDataSchema>;

// ── Scraper Configuration ────────────────────────────────────────────────────
export interface ScraperConfig {
  /** HTTP request timeout in milliseconds */
  requestTimeoutMs: number;
  /** Minimum delay between requests to same domain in milliseconds */
  rateLimitMs: number;
  /** Max number of retry attempts on failure */
  maxRetries: number;
  /** Base delay before first retry in milliseconds (doubles each attempt) */
  retryDelayMs: number;
  /** Max number of university scrapers to run concurrently */
  maxConcurrentRequests: number;
  /** Whether the scraper is enabled at all */
  enabled: boolean;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  requestTimeoutMs: 15_000,
  rateLimitMs: 2_000,
  maxRetries: 3,
  retryDelayMs: 1_000,
  maxConcurrentRequests: 5,
  enabled: true,
};

// ── Scraper Result ───────────────────────────────────────────────────────────
export interface ScraperResult {
  universityId: string;
  universityName: string;
  success: boolean;
  coursesFound: number;
  coursesUpserted: number;
  error?: string;
  scrapedAt: Date;
  durationMs: number;
}

// ── Scraper Run Summary ──────────────────────────────────────────────────────
export interface ScraperRunSummary {
  startedAt: Date;
  completedAt: Date;
  totalUniversities: number;
  successCount: number;
  failureCount: number;
  totalCoursesFound: number;
  results: ScraperResult[];
}
