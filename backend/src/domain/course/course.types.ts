import { z } from 'zod';

export const CourseSchema = z.object({
  id: z.string(),
  universityId: z.string(),
  name: z.string(),
  degree: z.string(),
  field: z.string(),
  language: z.string(),
  durationSemesters: z.number(),
  creditPoints: z.number(),
  tuitionFeeEuros: z.number().nullable(),
  intakeWinter: z.boolean(),
  intakeSummer: z.boolean(),
  applicationDeadlineWinter: z.date().nullable(),
  applicationDeadlineSummer: z.date().nullable(),
  ieltsMinimum: z.number().nullable(),
  gpaMinimum: z.number().nullable(),
  curriculum: z.any().nullable(),
  admissionRequirements: z.any().nullable(),
  careerProspects: z.array(z.string()),
  websiteUrl: z.string().nullable(),
  programPageUrl: z.string().nullable(),
  isActive: z.boolean(),
  lastScrapedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Course = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateCourseDTO = z.infer<typeof CreateCourseSchema>;

export const FilterCourseSchema = z.object({
  /** Free-text search across course and university names */
  q: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  language: z.string().optional(),
  intake: z.string().optional(),
  universityId: z.string().optional(),
});

export type FilterCourseDTO = z.infer<typeof FilterCourseSchema>;

export const CourseResponseSchema = CourseSchema.extend({
  university: z.any().optional(), // Can be replaced with actual University schema if needed
});
