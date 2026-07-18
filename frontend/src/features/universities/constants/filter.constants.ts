// ── Institution types (all listed institutions are public) ──────────────────
export const UNIVERSITY_TYPES = [
  { value: 'UNIVERSITY', label: 'University (traditional)' },
  { value: 'TECHNICAL_UNIVERSITY', label: 'Technical University (TU)' },
  { value: 'APPLIED_SCIENCES', label: 'Applied Sciences (HAW/FH)' },
];

// ── German regions → Bundesländer (values must match University.state) ──────
export const GERMAN_REGIONS: { region: string; states: string[] }[] = [
  { region: 'South', states: ['Bavaria', 'Baden-Württemberg'] },
  {
    region: 'West',
    states: ['North Rhine-Westphalia', 'Hesse', 'Rhineland-Palatinate', 'Saarland'],
  },
  {
    region: 'North',
    states: ['Hamburg', 'Bremen', 'Lower Saxony', 'Schleswig-Holstein'],
  },
  {
    region: 'East',
    states: [
      'Berlin',
      'Brandenburg',
      'Saxony',
      'Saxony-Anhalt',
      'Thuringia',
      'Mecklenburg-Vorpommern',
    ],
  },
];

export const DEGREE_LEVELS = [
  { value: 'BACHELOR', label: 'Bachelor' },
  { value: 'MASTER', label: 'Master' },
  { value: 'PHD', label: 'PhD' },
];

export const FIELDS_OF_STUDY = [
  { value: 'CS', label: 'Computer Science' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
  { value: 'MEDICINE', label: 'Medicine' },
  { value: 'SCIENCE', label: 'Natural Sciences' },
];

export const LANGUAGES = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'GERMAN', label: 'German' },
  { value: 'BILINGUAL', label: 'Bilingual' },
];

export const INTAKE_SEASONS = [
  { value: 'WINTER', label: 'Winter Semester' },
  { value: 'SUMMER', label: 'Summer Semester' },
];
