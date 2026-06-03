export interface Student {
  id: string;
  fullName: string;
  email: string;
  country: string;
  degreeStatus: 'completed' | 'ongoing';
  degree: string;
  specialization: string;
  currentSemester?: number;
  graduationDate?: string;
  cgpa?: number;
  expectedCgpa?: number;
  ieltsScore?: number;
  expectedIeltsScore?: number;
  plannedIeltsDate?: string;
  budget?: number;
  preferredIntake?: string;
  preferredCourse?: string;
  createdAt: string;
  updatedAt: string;
}
