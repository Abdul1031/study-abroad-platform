import { prisma } from '../../../config/prisma';
import { logger } from '../../../utils/logger';
import { assessProgramName } from '../../../services/scraper/name-quality';
import type { ScrapedCourse } from '../../../services/scraper/scraper.types';
import type { ValidationResult, MatchValidationResult } from '../models/program.types';

const MIN_COMPLETENESS_TO_MATCH = 75;
const HIGH_QUALITY_THRESHOLD = 85;
const MIN_MODULES_WARNING = 8;
const MIN_CAREER_PROSPECTS_WARN = 3;
const STALE_MONTHS = 6;

/**
 * ProgramValidator
 *
 * Two-stage validation guard:
 *   1. validateBeforeScrape  — rejects bad incoming data before it reaches the DB
 *   2. validateForMatching   — enforces quality gates before a program is shown to students
 *
 * validateForMatching also persists isMatchEligible, matchingBlockers,
 * and matchingWarnings on the Course record.
 */
export class ProgramValidator {
  // ── Stage 1: Validate scraped data before writing to DB ───────────────────

  validateBeforeScrape(incoming: ScrapedCourse): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ── Hard blocking rules ────────────────────────────────────────────────

    if (!incoming.name || incoming.name.trim().length < 2) {
      errors.push('Program name is missing or too short');
    } else {
      // Reject navigation-menu junk (nav keywords, concatenated menu text,
      // over-long strings) before it reaches the DB
      for (const issue of assessProgramName(incoming.name)) {
        errors.push(`Suspect program name: ${issue}`);
      }
    }

    if (!incoming.degree) {
      errors.push('Degree type is required (BACHELOR | MASTER | PHD)');
    }

    if (!incoming.field) {
      errors.push('Field of study is required');
    }

    // Must support at least one intake
    const hasWinterIntake = !!incoming.applicationDeadlineWinter;
    const hasSummerIntake = !!incoming.applicationDeadlineSummer;

    if (!hasWinterIntake && !hasSummerIntake) {
      errors.push('Program must have at least one intake with an application deadline');
    }

    // ── Soft warnings ──────────────────────────────────────────────────────

    if (!incoming.ieltsMinimum) {
      warnings.push('IELTS minimum not provided — completeness score will be lower');
    }

    if (!incoming.tuitionFeeEuros && incoming.tuitionFeeEuros !== 0) {
      warnings.push('Tuition fee not provided');
    }

    if (!incoming.curriculum || incoming.curriculum.length === 0) {
      warnings.push('No curriculum modules provided');
    }

    if (!incoming.careerProspects || incoming.careerProspects.length === 0) {
      warnings.push('No career prospects provided');
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      logger.warn(`[Validator] Rejecting scraped course "${incoming.name}": ${errors.join('; ')}`);
    } else if (warnings.length > 0) {
      logger.debug(
        `[Validator] Course "${incoming.name}" passed with ${warnings.length} warning(s)`
      );
    }

    return { isValid, errors, warnings };
  }

  // ── Stage 2: Validate a DB course before matching to students ─────────────

  async validateForMatching(courseId: string): Promise<MatchValidationResult> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        intakes: true,
        requirements: true,
        modules: true,
      },
    });

    if (!course) {
      return {
        isEligible: false,
        blockers: ['COURSE_NOT_FOUND'],
        warnings: [],
      };
    }

    const blockers: string[] = [];
    const warnings: string[] = [];

    // ── BLOCKING RULES (any fail = not eligible) ───────────────────────────

    // 1. Minimum completeness score
    if (course.completenessScore < MIN_COMPLETENESS_TO_MATCH) {
      blockers.push(
        `LOW_COMPLETENESS: score is ${course.completenessScore}/100 (minimum ${MIN_COMPLETENESS_TO_MATCH})`
      );
    }

    // 2. Must have at least one confirmed intake in ProgramIntake table
    if (course.intakes.length === 0) {
      // Fall back to legacy boolean flags
      if (!course.intakeWinter && !course.intakeSummer) {
        blockers.push('MISSING_INTAKE: no winter or summer intake defined');
      }
    }

    // 3. Each supported intake must have an application deadline
    if (course.intakeWinter && !course.applicationDeadlineWinter) {
      const hasIntakeRecord = course.intakes.some((i) => i.intakeSeason === 'WINTER');
      if (!hasIntakeRecord) {
        blockers.push('MISSING_WINTER_DEADLINE: winter intake enabled but no deadline set');
      }
    }
    if (course.intakeSummer && !course.applicationDeadlineSummer) {
      const hasIntakeRecord = course.intakes.some((i) => i.intakeSeason === 'SUMMER');
      if (!hasIntakeRecord) {
        blockers.push('MISSING_SUMMER_DEADLINE: summer intake enabled but no deadline set');
      }
    }

    // 4. Must have IELTS or an alternative test requirement
    const hasLanguageRequirement =
      course.ieltsMinimum != null ||
      course.requirements?.ieltsMinimum != null ||
      course.requirements?.toeflMinimum != null ||
      course.requirements?.duolingoMinimum != null ||
      (course.requirements?.languageRequirements ?? []).length > 0;

    if (!hasLanguageRequirement) {
      blockers.push('MISSING_LANGUAGE_REQUIREMENT: no IELTS, TOEFL, or Duolingo minimum set');
    }

    // 5. Must have degree and field
    if (!course.degree) blockers.push('MISSING_DEGREE');
    if (!course.field) blockers.push('MISSING_FIELD');

    // 5b. Name must not look like scraped navigation junk — protects against
    // records that entered the DB before extraction filters were tightened
    const nameIssues = assessProgramName(course.name);
    if (nameIssues.length > 0) {
      blockers.push(`SUSPECT_NAME: ${nameIssues.join('; ')}`);
    }

    // 6. Stale data is a blocker for high-stakes matching
    const staleThreshold = new Date();
    staleThreshold.setMonth(staleThreshold.getMonth() - STALE_MONTHS);
    if (course.lastVerifiedAt < staleThreshold) {
      blockers.push(
        `STALE_DATA: last verified ${course.lastVerifiedAt.toISOString().slice(0, 10)}, ` +
          `threshold is ${STALE_MONTHS} months`
      );
    }

    // ── WARNING RULES (flagged but still matchable) ────────────────────────

    // Quality below high-quality threshold
    if (course.completenessScore < HIGH_QUALITY_THRESHOLD) {
      warnings.push(
        `LOW_QUALITY_WARNING: completeness ${course.completenessScore}/100 (ideal ≥ ${HIGH_QUALITY_THRESHOLD})`
      );
    }

    // Curriculum details incomplete
    if (course.modules.length < MIN_MODULES_WARNING) {
      warnings.push(
        `FEW_MODULES: ${course.modules.length} modules (recommended ≥ ${MIN_MODULES_WARNING})`
      );
    }

    // Career prospects incomplete
    if (course.careerProspects.length < MIN_CAREER_PROSPECTS_WARN) {
      warnings.push(
        `FEW_CAREER_PROSPECTS: ${course.careerProspects.length} (recommended ≥ ${MIN_CAREER_PROSPECTS_WARN})`
      );
    }

    const isEligible = blockers.length === 0;

    // ── Persist result back to Course ─────────────────────────────────────
    await prisma.course.update({
      where: { id: courseId },
      data: {
        isMatchEligible: isEligible,
        matchingBlockers: blockers,
        matchingWarnings: warnings,
      },
    });

    logger.debug(
      `[Validator] ${course.name} → eligible: ${isEligible} ` +
        `(${blockers.length} blockers, ${warnings.length} warnings)`
    );

    return { isEligible, blockers, warnings };
  }

  /**
   * Batch-validate all active courses for matching eligibility.
   * Returns summary stats.
   */
  async validateAll(): Promise<{ processed: number; eligible: number; ineligible: number }> {
    const courses = await prisma.course.findMany({
      select: { id: true },
      where: { isActive: true },
    });

    let eligible = 0;
    let ineligible = 0;

    for (const course of courses) {
      try {
        const result = await this.validateForMatching(course.id);
        result.isEligible ? eligible++ : ineligible++;
      } catch (err) {
        logger.warn(`[Validator] Failed for course ${course.id}: ${String(err)}`);
        ineligible++;
      }
    }

    logger.info(`[Validator] Batch complete. Eligible: ${eligible}, Ineligible: ${ineligible}`);

    return { processed: courses.length, eligible, ineligible };
  }
}
