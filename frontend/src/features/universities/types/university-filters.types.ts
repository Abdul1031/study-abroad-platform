export interface UniversityFilters {
  city?: string[];
  state?: string[]; // Bundesländer, e.g. Bavaria, Berlin
  type?: string[]; // UNIVERSITY, TECHNICAL_UNIVERSITY, APPLIED_SCIENCES
  degree?: string[]; // BACHELOR, MASTER, PHD
  field?: string[]; // CS, ENGINEERING, BUSINESS, etc.
  language?: string[]; // ENGLISH, GERMAN, BILINGUAL
  tuitionMin?: number;
  tuitionMax?: number;
  ieltsMin?: number;
  ieltsMax?: number;
  intake?: string[]; // WINTER, SUMMER
  hasDormitory?: boolean;
  sortBy?: 'ranking' | 'tuition' | 'name';
  page?: number;
}

export interface University {
  id: string;
  name: string;
  city: string;
  state?: string;
  type: string;
  ranking?: number;
  tuitionFeeEuros?: number;
  ieltsMinimum?: number;
  logoUrl?: string;
  hasStudentDormitory: boolean;
  description?: string;
}

export interface Course {
  id: string;
  name: string;
  degree: string;
  field: string;
  language: string;
  tuitionFeeEuros?: number;
  ieltsMinimum?: number;
}
