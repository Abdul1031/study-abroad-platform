import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

// ─── Validation ───────────────────────────────────────────────────────────────

const APPLICATION_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'DECISION'] as const;

const CreateApplicationSchema = z
  .object({
    courseId: z.string().optional(),
    universityId: z.string().optional(),
    universityName: z.string().min(1).max(200).optional(),
    programName: z.string().min(1).max(300).optional(),
    degree: z.string().max(50).optional(),
    status: z.enum(APPLICATION_STATUSES).default('NOT_STARTED'),
    deadline: z.string().optional(),
    notes: z.string().max(5000).optional(),
  })
  .refine((data) => data.courseId || (data.universityName && data.programName), {
    message: 'Provide either a courseId or universityName + programName',
  });

const UpdateApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  deadline: z.string().nullish(),
  notes: z.string().max(5000).nullish(),
});

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ─── GET /api/applications ────────────────────────────────────────────────────

export async function listApplications(req: Request, res: Response) {
  const studentId = req.authUser?.studentId;
  if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const applications = await prisma.application.findMany({
    where: { studentId },
    orderBy: [{ deadline: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
  });

  return res.json({ success: true, data: applications });
}

// ─── POST /api/applications ───────────────────────────────────────────────────

export async function createApplication(req: Request, res: Response) {
  const studentId = req.authUser?.studentId;
  if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const parsed = CreateApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid application data',
      errors: parsed.error.flatten(),
    });
  }
  const input = parsed.data;

  // Resolve denormalized names from the catalog when a course is referenced
  let universityId = input.universityId ?? null;
  let universityName = input.universityName ?? '';
  let programName = input.programName ?? '';
  let degree = input.degree ?? null;

  if (input.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: input.courseId },
      include: { university: { select: { id: true, name: true } } },
    });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    universityId = course.university.id;
    universityName = course.university.name;
    programName = course.name;
    degree = degree ?? course.degree;

    // One tracked application per course per student
    const existing = await prisma.application.findFirst({
      where: { studentId, courseId: input.courseId },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You are already tracking an application for this program',
      });
    }
  }

  const application = await prisma.application.create({
    data: {
      studentId,
      courseId: input.courseId ?? null,
      universityId,
      universityName,
      programName,
      degree,
      status: input.status,
      deadline: toDate(input.deadline),
      notes: input.notes ?? null,
    },
  });

  logger.info(`[Applications] Student ${studentId} added "${programName}" (${application.id})`);
  return res.status(201).json({ success: true, data: application });
}

// ─── PATCH /api/applications/:id ──────────────────────────────────────────────

export async function updateApplication(req: Request, res: Response) {
  const studentId = req.authUser?.studentId;
  if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const parsed = UpdateApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid update data',
      errors: parsed.error.flatten(),
    });
  }

  // Ownership check baked into the where clause
  const result = await prisma.application.updateMany({
    where: { id: req.params.id, studentId },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.deadline !== undefined ? { deadline: toDate(parsed.data.deadline) } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes ?? null } : {}),
    },
  });

  if (result.count === 0) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  return res.json({ success: true, data: application });
}

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────

export async function deleteApplication(req: Request, res: Response) {
  const studentId = req.authUser?.studentId;
  if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const result = await prisma.application.deleteMany({
    where: { id: req.params.id, studentId },
  });

  if (result.count === 0) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }
  return res.json({ success: true, message: 'Application removed' });
}
