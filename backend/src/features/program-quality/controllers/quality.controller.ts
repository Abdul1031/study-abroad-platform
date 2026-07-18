import { Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import { ProgramCompletenessService } from '../services/completeness.service';
import { ProgramAuditService } from '../services/audit.service';

const completenessService = new ProgramCompletenessService();
const auditService = new ProgramAuditService();

// ── GET /api/quality/metrics ──────────────────────────────────────────────────

export async function getQualityMetrics(_req: Request, res: Response) {
  const [totalPrograms, eligibleCount, staleCount, reviewQueueCount, scoreAgg] = await Promise.all([
    prisma.course.count({ where: { isActive: true } }),
    prisma.course.count({ where: { isActive: true, isMatchEligible: true } }),
    prisma.course.count({ where: { isActive: true, isStale: true } }),
    prisma.programReview.count({ where: { reviewStatus: 'FLAGGED' } }),
    prisma.course.aggregate({
      where: { isActive: true },
      _avg: { completenessScore: true },
      _min: { completenessScore: true },
      _max: { completenessScore: true },
    }),
  ]);

  const reviewBreakdown = await prisma.programReview.groupBy({
    by: ['reviewStatus'],
    _count: { id: true },
  });

  const reviewByStatus = Object.fromEntries(
    reviewBreakdown.map((r) => [r.reviewStatus, r._count.id])
  );

  return res.status(200).json({
    success: true,
    data: {
      totalPrograms,
      eligibleCount,
      ineligibleCount: totalPrograms - eligibleCount,
      eligibilityRate: totalPrograms > 0 ? Math.round((eligibleCount / totalPrograms) * 100) : 0,
      staleCount,
      reviewQueue: {
        totalFlagged: reviewQueueCount,
        byStatus: reviewByStatus,
      },
      completenessStats: {
        average: Math.round(scoreAgg._avg.completenessScore ?? 0),
        minimum: Math.round(scoreAgg._min.completenessScore ?? 0),
        maximum: Math.round(scoreAgg._max.completenessScore ?? 0),
      },
      generatedAt: new Date().toISOString(),
    },
  });
}

// ── GET /api/quality/program/:courseId/completeness ───────────────────────────

export async function getProgramCompleteness(req: Request, res: Response) {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, name: true, isActive: true },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }

  // Recalculate live for fresh data
  const score = await completenessService.calculate(courseId);

  return res.status(200).json({
    success: true,
    data: {
      courseId,
      courseName: course.name,
      score,
      calculatedAt: new Date().toISOString(),
    },
  });
}

// ── GET /api/quality/program/:courseId/audit-trail ───────────────────────────

export async function getProgramAuditTrail(req: Request, res: Response) {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, name: true },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Program not found' });
  }

  const history = await auditService.getHistory(courseId);

  // Format history for human-readable display
  const formattedHistory = history.map((record) => ({
    id: record.id,
    fieldName: record.fieldName,
    oldValue: record.oldValue,
    newValue: record.newValue,
    changedBy: record.changedBy,
    reason: record.reason,
    changedAt: record.changedAt,
    summary: auditService.formatChange(record),
  }));

  return res.status(200).json({
    success: true,
    data: {
      courseId,
      courseName: course.name,
      totalChanges: history.length,
      history: formattedHistory,
    },
  });
}
