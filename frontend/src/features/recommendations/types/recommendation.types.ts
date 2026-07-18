export type EligibilityStatus = 'ELIGIBLE' | 'BORDERLINE' | 'STRETCH' | 'INELIGIBLE';

export interface MatchScoreBreakdown {
  academicFit: number;
  languageEligibility: number;
  budgetFit: number;
  intakeMatch: number;
  fieldAlignment: number;
}

export interface RecommendedCourse {
  id: string;
  name: string;
  degree: string;
  field: string;
  language: string;
  tuitionFeeEuros?: number;
  ieltsMinimum?: number;
  gpaMinimum?: number;
  intakeWinter: boolean;
  intakeSummer: boolean;
}

export interface MatchScore {
  courseId: string;
  courseName: string;
  universityId: string;
  universityName: string;
  totalScore: number;
  eligibilityStatus: EligibilityStatus;
  breakdown: MatchScoreBreakdown;
  courseDetails: RecommendedCourse;
}
