import { prisma } from '../../../config/prisma';
import { logger } from '../../../utils/logger';
import type { CompletenessScore, CompletenessBreakdown } from '../models/program.types';

const STALE_MONTHS = 6;

/**
 * ProgramCompletenessService
 *
 * Calculates a 0-100 data quality score for a program across 4 weighted
 * dimensions:
 *   1. Required Fields (40%) — IELTS, GPA, deadlines, degree, field.
 *      The admission-critical data; weighted highest because it is what
 *      actually distinguishes a documented program from scraped noise.
 *   2. Eligibility     (20%) — curriculum modules, career prospects, requirements
 *   3. Intake          (20%) — confirmed intakes core; enrollment dates and
 *      capacity are nice-to-haves most catalogs never publish
 *   4. Fees            (20%) — semester fee; German public universities charge
 *      no tuition, so a semester-fee-only record counts as fully documented
 *
 * The score is persisted to Course.completenessScore and the full breakdown
 * returned for transparency.
 */
const WEIGHT_REQUIRED = 0.4;
const WEIGHT_ELIGIBILITY = 0.2;
const WEIGHT_INTAKE = 0.2;
const WEIGHT_FEES = 0.2;
export class ProgramCompletenessService {
  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Calculate completeness for a single course and persist the score.
   * @returns Full CompletenessScore object with breakdown
   */
  async calculate(courseId: string): Promise<CompletenessScore> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        requirements: true,
        modules: true,
        intakes: true,
        fees: true,
      },
    });

    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    // ── Dimension 1: Required Fields (40%) ──────────────────────────────────
    const requiredFieldsMissing: string[] = [];

    const hasIelts = course.ieltsMinimum != null || course.requirements?.ieltsMinimum != null;
    const hasGpa = course.gpaMinimum != null || course.requirements?.gpaMinimum != null;
    // A ProgramIntake record satisfies the deadline requirement — its
    // applicationDeadline column is non-nullable
    const hasWinterIntakeRecord = course.intakes.some((i) => i.intakeSeason === 'WINTER');
    const hasSummerIntakeRecord = course.intakes.some((i) => i.intakeSeason === 'SUMMER');
    const hasWinterDL = course.intakeWinter
      ? course.applicationDeadlineWinter != null || hasWinterIntakeRecord
      : true;
    const hasSummerDL = course.intakeSummer
      ? course.applicationDeadlineSummer != null || hasSummerIntakeRecord
      : true;
    const hasDegree = !!course.degree;
    const hasField = !!course.field;

    if (!hasIelts) requiredFieldsMissing.push('ieltsMinimum');
    if (!hasGpa) requiredFieldsMissing.push('gpaMinimum');
    if (!hasWinterDL) requiredFieldsMissing.push('applicationDeadlineWinter');
    if (!hasSummerDL) requiredFieldsMissing.push('applicationDeadlineSummer');
    if (!hasDegree) requiredFieldsMissing.push('degree');
    if (!hasField) requiredFieldsMissing.push('field');

    // Each missing field deducts points from 100
    // 6 fields total → each worth ~16.67, rounded for clarity
    const deductionPerRequiredField = 100 / 6;
    const requiredFieldsScore = Math.max(
      0,
      Math.round(100 - requiredFieldsMissing.length * deductionPerRequiredField)
    );

    // ── Dimension 2: Eligibility (20%) ──────────────────────────────────────
    const eligibilityMissing: string[] = [];

    const modulesCount = course.modules.length;
    const careerProspectsCount = course.careerProspects.length;
    const hasRequirements = course.requirements != null;

    // Thresholds: 8+ modules is "complete", 3+ prospects is "complete"
    if (modulesCount < 8) eligibilityMissing.push(`curriculum (${modulesCount}/8 modules)`);
    if (careerProspectsCount < 3)
      eligibilityMissing.push(`careerProspects (${careerProspectsCount}/3)`);
    if (!hasRequirements) eligibilityMissing.push('requirements');

    // Requirements record is the core signal (40); curriculum and career
    // prospects scale proportionally (30 each) — most catalogs publish them
    // partially, so partial credit instead of all-or-nothing
    const eligibilityScore = Math.round(
      (hasRequirements ? 40 : 0) +
        Math.min(modulesCount / 8, 1) * 30 +
        Math.min(careerProspectsCount / 3, 1) * 30
    );

    // ── Dimension 3: Intake (20%) ────────────────────────────────────────────
    const intakeMissing: string[] = [];

    const confirmedIntakesCount = course.intakes.length;
    const hasEnrollmentDates = course.intakes.some((i) => i.enrollmentStartDate != null);
    const hasCapacityInfo = course.intakes.some((i) => i.capacity != null);

    // Must have at least 1 confirmed intake in the new ProgramIntake table
    if (confirmedIntakesCount === 0) intakeMissing.push('confirmedIntakes');
    if (!hasEnrollmentDates) intakeMissing.push('enrollmentDates');
    if (!hasCapacityInfo) intakeMissing.push('capacity');

    // A confirmed intake (with its mandatory deadline) is the substance (70);
    // enrollment dates and capacity are rarely published by universities,
    // so their absence only trims the score (15 each)
    const intakeScore = Math.round(
      (confirmedIntakesCount > 0 ? 70 : 0) +
        (hasEnrollmentDates ? 15 : 0) +
        (hasCapacityInfo ? 15 : 0)
    );

    // ── Dimension 4: Fees (20%) ──────────────────────────────────────────────
    const feeMissing: string[] = [];

    const hasSemesterFee = course.fees.some((f) => f.feeType === 'SEMESTER_FEE');
    // German public universities charge no tuition — a record documented with
    // a semester fee but no tuition entry means "tuition-free", not "unknown"
    const hasTuition =
      course.fees.some((f) => f.feeType === 'TUITION') ||
      course.tuitionFeeEuros != null ||
      hasSemesterFee;

    if (!hasTuition) feeMissing.push('tuitionFee');
    if (!hasSemesterFee) feeMissing.push('semesterFee');

    // 2 criteria → each worth 50
    const deductionPerFeeField = 50;
    const feeScore = Math.max(0, Math.round(100 - feeMissing.length * deductionPerFeeField));

    // ── Overall Score (weighted; admission-critical fields dominate) ────────
    const overallScore = Math.round(
      requiredFieldsScore * WEIGHT_REQUIRED +
        eligibilityScore * WEIGHT_ELIGIBILITY +
        intakeScore * WEIGHT_INTAKE +
        feeScore * WEIGHT_FEES
    );

    // ── Check staleness ──────────────────────────────────────────────────────
    const staleThreshold = new Date();
    staleThreshold.setMonth(staleThreshold.getMonth() - STALE_MONTHS);
    const isStale = course.lastVerifiedAt < staleThreshold;

    // ── Persist to DB ────────────────────────────────────────────────────────
    await prisma.course.update({
      where: { id: courseId },
      data: {
        completenessScore: overallScore,
        isStale,
      },
    });

    logger.debug(
      `[Completeness] ${course.name} → ${overallScore}/100 ` +
        `(req:${requiredFieldsScore} elig:${eligibilityScore} intake:${intakeScore} fee:${feeScore})`
    );

    const breakdown: CompletenessBreakdown = {
      requiredFields: {
        hasIelts,
        hasGpa,
        hasWinterDeadline: hasWinterDL,
        hasSummerDeadline: hasSummerDL,
        hasDegree,
        hasField,
        missingFields: requiredFieldsMissing,
      },
      eligibility: {
        modulesCount,
        careerProspectsCount,
        hasRequirements,
        missingFields: eligibilityMissing,
      },
      intake: {
        confirmedIntakesCount,
        hasEnrollmentDates,
        hasCapacityInfo,
        missingFields: intakeMissing,
      },
      fees: {
        hasTuition,
        hasSemesterFee,
        missingFields: feeMissing,
      },
    };

    return {
      overallScore,
      requiredFieldsScore,
      eligibilityScore,
      intakeScore,
      feeScore,
      breakdown,
      isAboveThreshold: overallScore >= 75,
      isHighQuality: overallScore >= 85,
    };
  }

  /**
   * Batch-calculate completeness for all active courses.
   * Returns summary stats.
   */
  async calculateAll(): Promise<{ processed: number; averageScore: number }> {
    const courses = await prisma.course.findMany({
      select: { id: true },
      where: { isActive: true },
    });

    let totalScore = 0;
    let processed = 0;

    for (const course of courses) {
      try {
        const result = await this.calculate(course.id);
        totalScore += result.overallScore;
        processed++;
      } catch (err) {
        logger.warn(`[Completeness] Failed for course ${course.id}: ${String(err)}`);
      }
    }

    const averageScore = processed > 0 ? Math.round(totalScore / processed) : 0;
    logger.info(
      `[Completeness] Batch complete. Processed: ${processed}, Average: ${averageScore}/100`
    );

    return { processed, averageScore };
  }
}
