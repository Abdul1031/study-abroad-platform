import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { invalidateUniversityRecommendations } from '../services/university-recommendation.service';

// ─── Validation schema (mirrors the frontend wizard payload) ─────────────────

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  // Accepted for wizard compatibility but ignored — the auth email is canonical
  email: z.string().email().optional(),
  country: z.string().min(1).max(100),
  degreeStatus: z.enum(['completed', 'ongoing']),
  degree: z.enum(['bachelors', 'masters', 'phd', 'associate']),
  specialization: z.string().min(2).max(100),
  finalCgpa: z.number().min(0).max(4).nullish(),
  currentSemester: z.number().int().min(1).max(12).nullish(),
  expectedGraduationDate: z.string().nullish(),
  expectedCgpa: z.number().min(0).max(4).nullish(),
  ieltsStatus: z.enum(['completed', 'not_taken']).optional(),
  ieltsScore: z.number().min(0).max(9).nullish(),
  plannedIeltsDate: z.string().nullish(),
  expectedIeltsScore: z.number().min(0).max(9).nullish(),
  preferredIntake: z.enum(['winter', 'summer']),
  preferredCourse: z.string().min(2).max(100),
  budget: z.number().positive().max(500_000),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

/** "2027-06-01" → Date, empty/absent → null */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → "yyyy-MM-dd" for HTML date inputs */
function toDateInput(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : '';
}

// ─── GET /api/profile ─────────────────────────────────────────────────────────
// Returns the student's profile in the exact shape the wizard form consumes,
// plus an isComplete flag so the frontend knows whether onboarding happened.

export async function getProfile(req: Request, res: Response) {
  const studentId = req.authUser?.studentId;
  if (!studentId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  const isComplete = Boolean(student.degreeStatus && student.preferredIntake);

  return res.json({
    success: true,
    data: {
      isComplete,
      profile: {
        fullName: student.fullName,
        email: student.email,
        country: student.country ?? '',
        degreeStatus: student.degreeStatus ?? undefined,
        degree: student.degree ?? undefined,
        specialization: student.specialization ?? '',
        finalCgpa: student.cgpa ?? undefined,
        currentSemester: student.currentSemester ?? undefined,
        expectedGraduationDate: toDateInput(student.graduationDate),
        expectedCgpa: student.expectedCgpa ?? undefined,
        ieltsStatus:
          student.ieltsScore != null
            ? 'completed'
            : student.expectedIeltsScore != null
              ? 'not_taken'
              : undefined,
        ieltsScore: student.ieltsScore ?? undefined,
        plannedIeltsDate: toDateInput(student.plannedIeltsDate),
        expectedIeltsScore: student.expectedIeltsScore ?? undefined,
        preferredIntake: student.preferredIntake ?? undefined,
        preferredCourse: student.preferredCourse ?? '',
        budget: student.budget ?? undefined,
      },
    },
  });
}

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
// Persists the completed wizard onto the Student row.

export async function updateProfile(req: Request, res: Response) {
  const studentId = req.authUser?.studentId;
  if (!studentId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid profile data',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const data = parsed.data;

  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      fullName: data.fullName,
      country: data.country,
      degreeStatus: data.degreeStatus,
      degree: data.degree,
      specialization: data.specialization,
      cgpa: data.finalCgpa ?? null,
      currentSemester: data.currentSemester ?? null,
      graduationDate: toDate(data.expectedGraduationDate),
      expectedCgpa: data.expectedCgpa ?? null,
      ieltsScore: data.ieltsStatus === 'completed' ? (data.ieltsScore ?? null) : null,
      plannedIeltsDate: data.ieltsStatus === 'not_taken' ? toDate(data.plannedIeltsDate) : null,
      expectedIeltsScore:
        data.ieltsStatus === 'not_taken' ? (data.expectedIeltsScore ?? null) : null,
      preferredIntake: data.preferredIntake,
      preferredCourse: data.preferredCourse,
      budget: data.budget,
    },
  });

  // Profile changes invalidate cached recommendations for this student
  await prisma.recommendationCache
    .deleteMany({ where: { studentId } })
    .catch((err: unknown) => logger.warn(`[Profile] Could not clear rec cache: ${String(err)}`));
  invalidateUniversityRecommendations(studentId);

  logger.info(`[Profile] Updated profile for student ${student.id}`);
  return res.json({ success: true, data: { id: student.id } });
}
