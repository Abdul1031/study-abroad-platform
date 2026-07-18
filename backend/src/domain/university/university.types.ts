import { z } from 'zod';

export const UniversitySchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  state: z.string(),
  type: z.string(),
  foundedYear: z.number().nullable(),
  description: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  ranking: z.number().nullable(),
  tuitionFeeEuros: z.number().nullable(),
  applicationDeadlineWinter: z.date().nullable(),
  applicationDeadlineSummer: z.date().nullable(),
  ieltsMinimum: z.number().nullable(),
  toeflMinimum: z.number().nullable(),
  gpaMinimum: z.number().nullable(),
  hasStudentDormitory: z.boolean(),
  averageRentEuros: z.number().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isActive: z.boolean(),
  lastScrapedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type University = z.infer<typeof UniversitySchema>;

export const CreateUniversitySchema = UniversitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUniversityDTO = z.infer<typeof CreateUniversitySchema>;

export const FilterUniversitySchema = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  ranking: z.number().optional(),
  q: z.string().optional(),
});

export type FilterUniversityDTO = z.infer<typeof FilterUniversitySchema>;
