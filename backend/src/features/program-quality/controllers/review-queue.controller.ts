import { Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { logger } from '../../../utils/logger';
import { ProgramCompletenessService } from '../services/completeness.service';
import { ProgramValidator } from '../services/validator.service';
import {
  ReviewQueueQuerySchema,
  ApproveReviewBodySchema,
  RejectReviewBodySchema,
  IssueCodes,
} from '../models/program.types';

const completenessService = new ProgramCompletenessService();
const validator = new ProgramValidator();

// ── Helper: derive issue codes for a course ──────────────────────────────────

async function deriveIssues(courseId: string): Promise<string[]> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { intakes: true, modules: true, requirements: true },
  });
  if (!course) return [IssueCodes.MISSING_DEGREE];

  const issues: string[] = [];

  if (!course.ieltsMinimum && !course.requirements?.ieltsMinimum)
    issues.push(IssueCodes.MISSING_IELTS);

  if (!course.gpaMinimum && !course.requirements?.gpaMinimum) issues.push(IssueCodes.MISSING_GPA);

  if (
    course.intakeWinter &&
    !course.applicationDeadlineWinter &&
    !course.intakes.some((i) => i.intakeSeason === 'WINTER')
  )
    issues.push(IssueCodes.MISSING_WINTER_DEADLINE);

  if (
    course.intakeSummer &&
    !course.applicationDeadlineSummer &&
    !course.intakes.some((i) => i.intakeSeason === 'SUMMER')
  )
    issues.push(IssueCodes.MISSING_SUMMER_DEADLINE);

  if (!course.intakeWinter && !course.intakeSummer && course.intakes.length === 0)
    issues.push(IssueCodes.MISSING_INTAKE);

  if (course.modules.length === 0) issues.push(IssueCodes.MISSING_CURRICULUM);

  if (course.careerProspects.length === 0) issues.push(IssueCodes.MISSING_CAREER_PROSPECTS);

  if (!course.tuitionFeeEuros) issues.push(IssueCodes.MISSING_TUITION);

  if (course.completenessScore < 75) issues.push(IssueCodes.LOW_COMPLETENESS);

  if (course.isStale) issues.push(IssueCodes.STALE_DATA);

  return issues;
}

// ── GET /api/quality/review-queue ────────────────────────────────────────────

export async function getReviewQueue(req: Request, res: Response) {
  const parsed = ReviewQueueQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const { status, sortBy, order, limit, offset } = parsed.data;

  const where = status ? { reviewStatus: status } : {};

  const [total, items] = await Promise.all([
    prisma.programReview.count({ where }),
    prisma.programReview.findMany({
      where,
      orderBy: { [sortBy]: order },
      take: limit,
      skip: offset,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            degree: true,
            field: true,
            language: true,
            completenessScore: true,
            isMatchEligible: true,
            matchingBlockers: true,
            isStale: true,
            lastVerifiedAt: true,
            university: {
              select: { id: true, name: true, city: true },
            },
          },
        },
      },
    }),
  ]);

  return res.status(200).json({
    success: true,
    total,
    limit,
    offset,
    data: items,
  });
}

// ── GET /api/quality/review-queue/:programReviewId ───────────────────────────

export async function getReviewById(req: Request, res: Response) {
  const { programReviewId } = req.params;

  const review = await prisma.programReview.findUnique({
    where: { id: programReviewId },
    include: {
      course: {
        include: {
          university: { select: { name: true, city: true, state: true, type: true } },
          requirements: true,
          modules: { orderBy: { semester: 'asc' } },
          intakes: true,
          fees: true,
          history: { orderBy: { changedAt: 'desc' }, take: 10 },
        },
      },
    },
  });

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  return res.status(200).json({ success: true, data: review });
}

// ── PATCH /api/quality/review-queue/:programReviewId/approve ─────────────────

export async function approveReview(req: Request, res: Response) {
  const { programReviewId } = req.params;
  const parsed = ApproveReviewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const review = await prisma.programReview.findUnique({ where: { id: programReviewId } });
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const now = new Date();

  const [updatedReview] = await prisma.$transaction([
    prisma.programReview.update({
      where: { id: programReviewId },
      data: {
        reviewStatus: 'APPROVED',
        reviewedAt: now,
        reviewedBy: parsed.data.reviewedBy,
        notes: parsed.data.notes ?? null,
      },
    }),
    prisma.course.update({
      where: { id: review.courseId },
      data: {
        isMatchEligible: true,
        matchingBlockers: [],
        lastVerifiedAt: now,
        isStale: false,
      },
    }),
    prisma.programHistory.create({
      data: {
        courseId: review.courseId,
        fieldName: 'reviewStatus',
        oldValue: review.reviewStatus,
        newValue: 'APPROVED',
        changedBy: 'ADMIN',
        reason: parsed.data.notes ?? 'Admin approved program',
      },
    }),
  ]);

  logger.info(`[ReviewQueue] Program ${review.courseId} APPROVED by ${parsed.data.reviewedBy}`);

  return res.status(200).json({
    success: true,
    message: 'Program approved and marked as match-eligible',
    data: updatedReview,
  });
}

// ── PATCH /api/quality/review-queue/:programReviewId/reject ──────────────────

export async function rejectReview(req: Request, res: Response) {
  const { programReviewId } = req.params;
  const parsed = RejectReviewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() });
  }

  const review = await prisma.programReview.findUnique({ where: { id: programReviewId } });
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  const now = new Date();

  const [updatedReview] = await prisma.$transaction([
    prisma.programReview.update({
      where: { id: programReviewId },
      data: {
        reviewStatus: 'REJECTED',
        reviewedAt: now,
        reviewedBy: parsed.data.reviewedBy,
        notes: parsed.data.reason,
      },
    }),
    prisma.course.update({
      where: { id: review.courseId },
      data: {
        isMatchEligible: false,
        isActive: false, // Rejected programs are hidden from students
        matchingBlockers: [`REJECTED_BY_ADMIN: ${parsed.data.reason}`],
      },
    }),
    prisma.programHistory.create({
      data: {
        courseId: review.courseId,
        fieldName: 'reviewStatus',
        oldValue: review.reviewStatus,
        newValue: 'REJECTED',
        changedBy: 'ADMIN',
        reason: parsed.data.reason,
      },
    }),
  ]);

  logger.info(
    `[ReviewQueue] Program ${review.courseId} REJECTED by ${parsed.data.reviewedBy}: ${parsed.data.reason}`
  );

  return res.status(200).json({
    success: true,
    message: 'Program rejected and removed from matching',
    data: updatedReview,
  });
}

// ── POST /api/quality/trigger-review-scan ────────────────────────────────────

export async function triggerReviewScan(_req: Request, res: Response) {
  logger.info('[ReviewQueue] Starting review scan...');

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, completenessScore: true, isStale: true },
  });

  let flagged = 0;
  let skipped = 0;

  for (const course of courses) {
    // Recalculate completeness first
    try {
      await completenessService.calculate(course.id);
      await validator.validateForMatching(course.id);
    } catch (_err) {
      // Non-blocking — continue with current score
    }

    // Re-fetch updated course
    const updated = await prisma.course.findUnique({
      where: { id: course.id },
      select: {
        completenessScore: true,
        isStale: true,
        intakeWinter: true,
        intakeSummer: true,
        applicationDeadlineWinter: true,
        applicationDeadlineSummer: true,
        ieltsMinimum: true,
      },
    });
    if (!updated) continue;

    // Determine if this course needs review
    const needsReview =
      updated.completenessScore < 75 ||
      updated.isStale ||
      (updated.intakeWinter && !updated.applicationDeadlineWinter) ||
      (updated.intakeSummer && !updated.applicationDeadlineSummer) ||
      !updated.ieltsMinimum;

    if (!needsReview) {
      skipped++;
      continue;
    }

    // Derive specific issue codes
    const issues = await deriveIssues(course.id);

    // Upsert review record (one per course)
    await prisma.programReview.upsert({
      where: { courseId: course.id },
      update: {
        reviewStatus: 'FLAGGED',
        issues,
        completenessScore: updated.completenessScore,
        flaggedAt: new Date(),
      },
      create: {
        courseId: course.id,
        reviewStatus: 'FLAGGED',
        issues,
        completenessScore: updated.completenessScore,
      },
    });

    flagged++;
  }

  logger.info(`[ReviewQueue] Scan complete. Flagged: ${flagged}, Skipped: ${skipped}`);

  return res.status(200).json({
    success: true,
    message: `Review scan complete`,
    data: {
      totalScanned: courses.length,
      flagged,
      skipped,
    },
  });
}
