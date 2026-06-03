import { z } from 'zod';
import {
  personalInfoSchema,
  academicStatusSchema,
  academicInfoSchema,
  englishProficiencySchema,
  preferencesSchema,
  studentProfileSchema,
} from '../schemas';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type DegreeStatus = 'completed' | 'ongoing';
export type IeltsStatus = 'completed' | 'not_taken';
export type PreferredIntake = 'winter' | 'summer';
export type DegreeType = 'bachelors' | 'masters' | 'phd' | 'associate';

// ─── Zod-Inferred Form Data Types ─────────────────────────────────────────────
// Single source of truth — type + runtime validation from one schema

export type PersonalInfoData = z.infer<typeof personalInfoSchema>;
export type AcademicStatusData = z.infer<typeof academicStatusSchema>;
export type AcademicInfoData = z.infer<typeof academicInfoSchema>;
export type EnglishProficiencyData = z.infer<typeof englishProficiencySchema>;
export type PreferencesData = z.infer<typeof preferencesSchema>;
export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

// ─── Wizard Step Metadata ─────────────────────────────────────────────────────

export interface WizardStep {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly fieldNames: readonly (keyof StudentProfileFormData)[];
}

// ─── Draft Persistence ────────────────────────────────────────────────────────

export interface ProfileDraft {
  data: Partial<StudentProfileFormData>;
  currentStep: number;
  lastSaved: string; // ISO timestamp
}

// ─── Service Contract ─────────────────────────────────────────────────────────
// Interface allows swapping localStorage → API without changing components

export interface ProfileServiceContract {
  saveDraft(data: Partial<StudentProfileFormData>, currentStep: number): Promise<void>;
  loadDraft(): Promise<ProfileDraft | null>;
  clearDraft(): Promise<void>;
  submitProfile(data: StudentProfileFormData): Promise<{ id: string }>;
}

// ─── Wizard State & Actions ───────────────────────────────────────────────────

export interface WizardState {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export interface WizardActions {
  goToNext: () => void;
  goToPrevious: () => void;
  goToStep: (step: number) => void;
}

// ─── Submit State ─────────────────────────────────────────────────────────────

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface SubmitState {
  status: SubmitStatus;
  error?: string;
}

// ─── Shared Option Type ───────────────────────────────────────────────────────

export interface SelectOption {
  readonly label: string;
  readonly value: string;
}
