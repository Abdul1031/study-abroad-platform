import { Course } from '../course/course.types';

export type EligibilityStatus = 'ELIGIBLE' | 'BORDERLINE' | 'STRETCH' | 'INELIGIBLE';

export interface MatchScoreBreakdown {
  academicFit: number;
  languageEligibility: number;
  budgetFit: number;
  intakeMatch: number;
  fieldAlignment: number;
}

export interface MatchScore {
  courseId: string;
  courseName: string;
  universityId: string;
  universityName: string;
  totalScore: number;
  eligibilityStatus: EligibilityStatus;
  breakdown: MatchScoreBreakdown;
  courseDetails: Course; // Includes additional course metadata
  qualityWarnings?: string[]; // Phase 5: data-quality warnings surfaced to the student
}
