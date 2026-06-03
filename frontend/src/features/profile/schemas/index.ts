import { z } from 'zod';

// ─── Step 1: Personal Information ─────────────────────────────────────────────

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be under 255 characters'),
  country: z.string().min(1, 'Please select your country'),
});

// ─── Step 2: Academic Status ───────────────────────────────────────────────────

export const academicStatusSchema = z.object({
  degreeStatus: z.enum(['completed', 'ongoing'], {
    required_error: 'Please select your degree status',
    invalid_type_error: 'Invalid degree status',
  }),
});

// ─── Step 3: Academic Information ─────────────────────────────────────────────
// Conditionally requires fields based on degreeStatus

export const academicInfoSchema = z
  .object({
    degreeStatus: z.enum(['completed', 'ongoing']),
    degree: z.enum(['bachelors', 'masters', 'phd', 'associate'], {
      required_error: 'Please select your degree type',
    }),
    specialization: z
      .string()
      .min(2, 'Specialization must be at least 2 characters')
      .max(100, 'Specialization must be under 100 characters'),
    // Completed-only fields
    finalCgpa: z
      .number({ invalid_type_error: 'CGPA must be a number' })
      .min(0, 'CGPA cannot be negative')
      .max(4.0, 'CGPA cannot exceed 4.0')
      .optional(),
    // Ongoing-only fields
    currentSemester: z
      .number({ invalid_type_error: 'Semester must be a number' })
      .int('Semester must be a whole number')
      .min(1, 'Semester must be at least 1')
      .max(12, 'Semester cannot exceed 12')
      .optional(),
    expectedGraduationDate: z.string().optional(),
    expectedCgpa: z
      .number({ invalid_type_error: 'Expected CGPA must be a number' })
      .min(0, 'Expected CGPA cannot be negative')
      .max(4.0, 'Expected CGPA cannot exceed 4.0')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.degreeStatus === 'completed') {
      if (data.finalCgpa === undefined || data.finalCgpa === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Final CGPA is required for completed degrees',
          path: ['finalCgpa'],
        });
      }
    }

    if (data.degreeStatus === 'ongoing') {
      if (data.currentSemester === undefined || data.currentSemester === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Current semester is required',
          path: ['currentSemester'],
        });
      }
      if (!data.expectedGraduationDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected graduation date is required',
          path: ['expectedGraduationDate'],
        });
      }
      if (data.expectedCgpa === undefined || data.expectedCgpa === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected CGPA is required',
          path: ['expectedCgpa'],
        });
      }
    }
  });

// ─── Step 4: English Proficiency ──────────────────────────────────────────────

export const englishProficiencySchema = z
  .object({
    ieltsStatus: z.enum(['completed', 'not_taken'], {
      required_error: 'Please select your IELTS status',
    }),
    // Completed-only
    ieltsScore: z
      .number({ invalid_type_error: 'IELTS score must be a number' })
      .min(0, 'IELTS score cannot be less than 0')
      .max(9, 'IELTS score cannot exceed 9')
      .multipleOf(0.5, 'IELTS score must be in 0.5 increments (e.g. 6.0, 6.5, 7.0)')
      .optional(),
    // Not-taken-only
    plannedIeltsDate: z.string().optional(),
    expectedIeltsScore: z
      .number({ invalid_type_error: 'Expected IELTS score must be a number' })
      .min(0, 'Expected IELTS score cannot be less than 0')
      .max(9, 'Expected IELTS score cannot exceed 9')
      .multipleOf(0.5, 'Expected IELTS score must be in 0.5 increments')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ieltsStatus === 'completed') {
      if (data.ieltsScore === undefined || data.ieltsScore === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'IELTS score is required',
          path: ['ieltsScore'],
        });
      }
    }

    if (data.ieltsStatus === 'not_taken') {
      if (!data.plannedIeltsDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Planned IELTS date is required',
          path: ['plannedIeltsDate'],
        });
      }
      if (data.expectedIeltsScore === undefined || data.expectedIeltsScore === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected IELTS score is required',
          path: ['expectedIeltsScore'],
        });
      }
    }
  });

// ─── Step 5: Preferences ──────────────────────────────────────────────────────

export const preferencesSchema = z.object({
  preferredIntake: z.enum(['winter', 'summer'], {
    required_error: 'Please select your preferred intake',
  }),
  preferredCourse: z
    .string()
    .min(2, 'Preferred course must be at least 2 characters')
    .max(100, 'Preferred course must be under 100 characters'),
  budget: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .positive('Budget must be a positive amount')
    .max(500000, 'Budget seems too high — please check'),
});

// ─── Combined Schema ───────────────────────────────────────────────────────────

export const studentProfileSchema = personalInfoSchema
  .merge(academicStatusSchema)
  .merge(
    z.object({
      degree: z.enum(['bachelors', 'masters', 'phd', 'associate']),
      specialization: z.string().min(2).max(100),
      finalCgpa: z.number().min(0).max(4.0).optional(),
      currentSemester: z.number().int().min(1).max(12).optional(),
      expectedGraduationDate: z.string().optional(),
      expectedCgpa: z.number().min(0).max(4.0).optional(),
    })
  )
  .merge(
    z.object({
      ieltsStatus: z.enum(['completed', 'not_taken']),
      ieltsScore: z.number().min(0).max(9).optional(),
      plannedIeltsDate: z.string().optional(),
      expectedIeltsScore: z.number().min(0).max(9).optional(),
    })
  )
  .merge(preferencesSchema);

// ─── Per-Step Schema Map ───────────────────────────────────────────────────────
// Used by the wizard hook to validate only the current step

export const stepSchemas = [
  personalInfoSchema,
  academicStatusSchema,
  academicInfoSchema,
  englishProficiencySchema,
  preferencesSchema,
  // Step 6 (Review) has no validation — it's read-only
] as const;

export type StepSchemaIndex = 0 | 1 | 2 | 3 | 4;
