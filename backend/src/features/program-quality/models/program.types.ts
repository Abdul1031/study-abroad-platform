import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────────────────────

export const IntakeSeasonEnum = z.enum(['WINTER', 'SUMMER']);
export type IntakeSeason = z.infer<typeof IntakeSeasonEnum>;

export const FeeTypeEnum = z.enum(['TUITION', 'SEMESTER_FEE', 'ADMIN_FEE', 'OTHER']);
export type FeeType = z.infer<typeof FeeTypeEnum>;

export const ChangedByEnum = z.enum(['SCRAPER', 'ADMIN', 'SYSTEM', 'MIGRATION']);
export type ChangedBy = z.infer<typeof ChangedByEnum>;

export const ReviewStatusEnum = z.enum(['FLAGGED', 'APPROVED', 'REJECTED', 'PENDING_VERIFICATION']);
export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

// ── Issue Codes ───────────────────────────────────────────────────────────────
export const IssueCodes = {
  MISSING_IELTS: 'MISSING_IELTS',
  MISSING_GPA: 'MISSING_GPA',
  MISSING_WINTER_DEADLINE: 'MISSING_WINTER_DEADLINE',
  MISSING_SUMMER_DEADLINE: 'MISSING_SUMMER_DEADLINE',
  MISSING_INTAKE: 'MISSING_INTAKE',
  MISSING_CURRICULUM: 'MISSING_CURRICULUM',
  MISSING_CAREER_PROSPECTS: 'MISSING_CAREER_PROSPECTS',
  MISSING_TUITION: 'MISSING_TUITION',
  LOW_COMPLETENESS: 'LOW_COMPLETENESS',
  STALE_DATA: 'STALE_DATA',
  MISSING_DEGREE: 'MISSING_DEGREE',
  MISSING_FIELD: 'MISSING_FIELD',
  MISSING_LANGUAGE: 'MISSING_LANGUAGE',
  FEW_MODULES: 'FEW_MODULES',
  FEW_CAREER_PROSPECTS: 'FEW_CAREER_PROSPECTS',
} as const;

export type IssueCode = (typeof IssueCodes)[keyof typeof IssueCodes];

// ── ProgramRequirement ────────────────────────────────────────────────────────

export const ProgramRequirementInputSchema = z.object({
  courseId: z.string().cuid(),
  ieltsMinimum: z.number().min(0).max(9).optional(),
  toeflMinimum: z.number().min(0).optional(),
  duolingoMinimum: z.number().min(0).optional(),
  gpaMinimum: z.number().min(0).max(4).optional(),
  languageRequirements: z.array(z.string()).default([]),
  additionalCertificates: z.array(z.string()).default([]),
  workExperienceRequired: z.number().int().min(0).optional(),
  requiresUniAssist: z.boolean().default(false),
  requiresAPS: z.boolean().default(false),
  isOpenAdmission: z.boolean().default(false),
  greRequired: z.boolean().default(false),
  gmatRequired: z.boolean().default(false),
});
export type ProgramRequirementInput = z.infer<typeof ProgramRequirementInputSchema>;

// ── ProgramModule ─────────────────────────────────────────────────────────────

export const ProgramModuleInputSchema = z.object({
  courseId: z.string().cuid(),
  name: z.string().min(1).max(300),
  description: z.string().optional(),
  creditPoints: z.number().int().min(0).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  isRequired: z.boolean().default(true),
});
export type ProgramModuleInput = z.infer<typeof ProgramModuleInputSchema>;

// ── ProgramIntake ─────────────────────────────────────────────────────────────

export const ProgramIntakeInputSchema = z.object({
  courseId: z.string().cuid(),
  intakeSeason: IntakeSeasonEnum,
  applicationDeadline: z.coerce.date(),
  confirmationDeadline: z.coerce.date().optional(),
  enrollmentStartDate: z.coerce.date().optional(),
  enrollmentEndDate: z.coerce.date().optional(),
  capacity: z.number().int().min(0).optional(),
  capacityReservedInternational: z.number().int().min(0).optional(),
});
export type ProgramIntakeInput = z.infer<typeof ProgramIntakeInputSchema>;

// ── ProgramFee ────────────────────────────────────────────────────────────────

export const ProgramFeeInputSchema = z.object({
  courseId: z.string().cuid(),
  feeType: FeeTypeEnum,
  amount: z.number().min(0),
  currency: z.string().default('EUR'),
  description: z.string().optional(),
  applicableIntakes: z.array(IntakeSeasonEnum).default([]),
});
export type ProgramFeeInput = z.infer<typeof ProgramFeeInputSchema>;

// ── ProgramHistory ────────────────────────────────────────────────────────────

export const ProgramHistoryInputSchema = z.object({
  courseId: z.string().cuid(),
  fieldName: z.string().min(1).max(100),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  changedBy: ChangedByEnum,
  reason: z.string().optional(),
});
export type ProgramHistoryInput = z.infer<typeof ProgramHistoryInputSchema>;

// ── ProgramReview ─────────────────────────────────────────────────────────────

export const ProgramReviewInputSchema = z.object({
  courseId: z.string().cuid(),
  reviewStatus: ReviewStatusEnum.default('FLAGGED'),
  issues: z.array(z.string()),
  completenessScore: z.number().min(0).max(100),
  notes: z.string().optional(),
  reviewedBy: z.string().optional(),
});
export type ProgramReviewInput = z.infer<typeof ProgramReviewInputSchema>;

// ── Completeness Score ────────────────────────────────────────────────────────

export interface CompletenessBreakdown {
  /** Which required fields are present/missing */
  requiredFields: {
    hasIelts: boolean;
    hasGpa: boolean;
    hasWinterDeadline: boolean;
    hasSummerDeadline: boolean;
    hasDegree: boolean;
    hasField: boolean;
    missingFields: string[];
  };
  /** Curriculum and eligibility detail */
  eligibility: {
    modulesCount: number;
    careerProspectsCount: number;
    hasRequirements: boolean;
    missingFields: string[];
  };
  /** Intake detail */
  intake: {
    confirmedIntakesCount: number;
    hasEnrollmentDates: boolean;
    hasCapacityInfo: boolean;
    missingFields: string[];
  };
  /** Fee detail */
  fees: {
    hasTuition: boolean;
    hasSemesterFee: boolean;
    missingFields: string[];
  };
}

export interface CompletenessScore {
  overallScore: number; // 0-100, weighted average
  requiredFieldsScore: number; // 0-100
  eligibilityScore: number; // 0-100
  intakeScore: number; // 0-100
  feeScore: number; // 0-100
  breakdown: CompletenessBreakdown;
  isAboveThreshold: boolean; // >= 75
  isHighQuality: boolean; // >= 85
}

// ── Validation Result ─────────────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean;
  errors: string[]; // Hard blocking issues
  warnings: string[]; // Soft flags
}

export interface MatchValidationResult {
  isEligible: boolean;
  blockers: string[]; // Hard blocking reasons
  warnings: string[]; // Soft warnings
}

// ── Review Queue Query Params ─────────────────────────────────────────────────

export const ReviewQueueQuerySchema = z.object({
  status: ReviewStatusEnum.optional(),
  sortBy: z.enum(['completenessScore', 'flaggedAt']).default('flaggedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ReviewQueueQuery = z.infer<typeof ReviewQueueQuerySchema>;

// ── Approve/Reject Body ───────────────────────────────────────────────────────

export const ApproveReviewBodySchema = z.object({
  reviewedBy: z.string().min(1),
  notes: z.string().optional(),
});
export type ApproveReviewBody = z.infer<typeof ApproveReviewBodySchema>;

export const RejectReviewBodySchema = z.object({
  reviewedBy: z.string().min(1),
  reason: z.string().min(1),
});
export type RejectReviewBody = z.infer<typeof RejectReviewBodySchema>;
