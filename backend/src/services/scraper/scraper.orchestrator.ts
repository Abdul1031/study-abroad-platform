import PQueue from 'p-queue';
import type { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { ScrapedCourseSchema } from './scraper.types';
import type { ScraperConfig, ScraperResult } from './scraper.types';
import { BaseScraper } from './base.scraper';
import { GenericScraper } from './adapters/generic.scraper';
import { TUMunichScraper } from './adapters/tum.scraper';
import { LMUMunichScraper } from './adapters/lmu.scraper';
import { ProgramValidator } from '../../features/program-quality/services/validator.service';
import { ProgramAuditService } from '../../features/program-quality/services/audit.service';

/**
 * ScraperOrchestrator coordinates all university scrapers.
 * Uses p-queue for concurrency control and rate limiting.
 * Failures for individual universities are isolated — they don't stop other scrapers.
 */
export class ScraperOrchestrator {
  private readonly prisma: PrismaClient;
  private readonly config: ScraperConfig;
  private readonly queue: PQueue;
  private readonly validator = new ProgramValidator();
  private readonly audit = new ProgramAuditService();

  constructor(prisma: PrismaClient, config: ScraperConfig) {
    this.prisma = prisma;
    this.config = config;

    // Rate-limited queue: max N concurrent + minimum interval between tasks
    this.queue = new PQueue({
      concurrency: config.maxConcurrentRequests,
      interval: config.rateLimitMs * 2,
      intervalCap: config.maxConcurrentRequests,
    });
  }

  // ── Scrape all universities in the database ────────────────────────────────
  async scrapeAll(): Promise<ScraperResult[]> {
    logger.info('[Orchestrator] Starting scrape run for all universities…');

    const universities = await this.prisma.university.findMany({
      select: { id: true, name: true, websiteUrl: true },
    });

    logger.info(`[Orchestrator] Found ${universities.length} universities to scrape`);

    const resultPromises = universities.map((uni) =>
      this.queue.add(() => this.scrapeUniversity(uni.id, uni.name, uni.websiteUrl ?? uni.name))
    );

    const results = (await Promise.all(resultPromises)).filter(
      (r): r is ScraperResult => r !== undefined
    );

    const successCount = results.filter((r) => r.success).length;
    const totalCourses = results.reduce((sum, r) => sum + r.coursesFound, 0);

    logger.info(
      `[Orchestrator] ✅ Run complete. ${successCount}/${results.length} succeeded. ` +
        `${totalCourses} courses found total.`
    );

    // After full run: asynchronously trigger review scan to flag incomplete programs
    this.triggerReviewScanAsync();

    return results;
  }

  /** Fire-and-forget post-scrape quality scan — recalculates scores and eligibility */
  private async triggerReviewScanAsync(): Promise<void> {
    try {
      const { ProgramCompletenessService } =
        await import('../../features/program-quality/services/completeness.service');
      const completenessService = new ProgramCompletenessService();
      await completenessService.calculateAll();
      await this.validator.validateAll();
      logger.info('[Orchestrator] Post-scrape quality scan complete');
    } catch (err) {
      logger.warn(`[Orchestrator] Post-scrape quality scan failed: ${String(err)}`);
    }
  }

  // ── Scrape a single university (wrapped to never throw) ────────────────────
  private async scrapeUniversity(
    universityId: string,
    universityName: string,
    universityUrl: string
  ): Promise<ScraperResult> {
    const startedAt = Date.now();

    try {
      const scraper = this.createScraper(universityId, universityName, universityUrl);
      const rawCourses = await scraper.run();

      // ── Validate each course with Zod + ProgramValidator before writing to DB ──
      let coursesUpserted = 0;
      for (const raw of rawCourses) {
        // Stage 1: Zod schema validation
        const parsed = ScrapedCourseSchema.safeParse(raw);
        if (!parsed.success) {
          logger.warn(
            `[${universityName}] Skipping invalid course "${raw.name}": ` +
              parsed.error.issues.map((i) => i.message).join(', ')
          );
          continue;
        }

        const course = parsed.data;

        // Stage 2: Business rules validation (ProgramValidator)
        const validation = this.validator.validateBeforeScrape(course);
        if (!validation.isValid) {
          logger.warn(
            `[${universityName}] ProgramValidator rejected "${course.name}": ` +
              validation.errors.join('; ')
          );
          continue;
        }
        if (validation.warnings.length > 0) {
          logger.debug(
            `[${universityName}] "${course.name}" has ${validation.warnings.length} warning(s): ` +
              validation.warnings.join('; ')
          );
        }

        try {
          // Fetch existing course for diff-based audit logging
          const existing = await this.prisma.course.findUnique({
            where: { universityId_name: { universityId, name: course.name } },
          });

          const upserted = await this.prisma.course.upsert({
            where: {
              universityId_name: {
                universityId,
                name: course.name,
              },
            },
            update: {
              language: course.language,
              durationSemesters: course.durationSemesters ?? undefined,
              tuitionFeeEuros: course.tuitionFeeEuros ?? undefined,
              ieltsMinimum: course.ieltsMinimum ?? undefined,
              applicationDeadlineWinter: course.applicationDeadlineWinter ?? undefined,
              applicationDeadlineSummer: course.applicationDeadlineSummer ?? undefined,
              lastScrapedAt: new Date(),
            },
            create: {
              universityId,
              name: course.name,
              degree: course.degree,
              field: course.field,
              language: course.language,
              durationSemesters: course.durationSemesters ?? 4,
              creditPoints: 120,
              tuitionFeeEuros: course.tuitionFeeEuros ?? undefined,
              ieltsMinimum: course.ieltsMinimum ?? undefined,
              applicationDeadlineWinter: course.applicationDeadlineWinter ?? undefined,
              applicationDeadlineSummer: course.applicationDeadlineSummer ?? undefined,
              lastScrapedAt: new Date(),
            },
          });

          // Audit: log only fields that actually changed
          if (existing) {
            const TRACKED_FIELDS = [
              'language',
              'durationSemesters',
              'tuitionFeeEuros',
              'ieltsMinimum',
              'applicationDeadlineWinter',
              'applicationDeadlineSummer',
            ];
            const changes = this.audit.diffCourse(
              existing as unknown as Record<string, unknown>,
              upserted as unknown as Record<string, unknown>,
              TRACKED_FIELDS
            );
            if (changes.length > 0) {
              await this.audit.logChanges(
                upserted.id,
                changes,
                'SCRAPER',
                `Scraped from university website (${universityName})`
              );
            }
          } else {
            // New course — log creation
            await this.audit.logChange(
              upserted.id,
              'courseCreated',
              null,
              course.name,
              'SCRAPER',
              `New course discovered on ${universityName} website`
            );
          }

          coursesUpserted++;
        } catch (dbErr) {
          logger.warn(
            `[${universityName}] DB upsert failed for course "${course.name}": ${String(dbErr)}`
          );
        }
      }

      // Update university lastScrapedAt
      await this.prisma.university.update({
        where: { id: universityId },
        data: { lastScrapedAt: new Date() },
      });

      return {
        universityId,
        universityName,
        success: true,
        coursesFound: rawCourses.length,
        coursesUpserted,
        scrapedAt: new Date(),
        durationMs: Date.now() - startedAt,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[${universityName}] ❌ Scrape failed: ${message}`);
      return {
        universityId,
        universityName,
        success: false,
        coursesFound: 0,
        coursesUpserted: 0,
        error: message,
        scrapedAt: new Date(),
        durationMs: Date.now() - startedAt,
      };
    }
  }

  // ── Factory: pick the right scraper adapter ────────────────────────────────
  private createScraper(
    universityId: string,
    universityName: string,
    universityUrl: string
  ): BaseScraper {
    const normalised = universityName.toLowerCase();

    if (
      normalised.includes('technical university of munich') ||
      normalised.includes('tum') ||
      normalised.includes('tu münchen')
    ) {
      return new TUMunichScraper(universityId, universityName, universityUrl, this.config);
    }

    if (
      normalised.includes('lmu') ||
      normalised.includes('ludwig') ||
      normalised.includes('maximilian')
    ) {
      return new LMUMunichScraper(universityId, universityName, universityUrl, this.config);
    }

    return new GenericScraper(universityId, universityName, universityUrl, this.config);
  }
}
