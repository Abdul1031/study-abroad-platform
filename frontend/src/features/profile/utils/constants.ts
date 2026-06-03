import { User, GraduationCap, BookOpen, Languages, Settings2, ClipboardCheck } from 'lucide-react';
import type { WizardStep, SelectOption } from '../types';

// ─── localStorage Keys ────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PROFILE_DRAFT: 'studyabroad_profile_draft',
} as const;

// ─── Wizard Step Definitions ──────────────────────────────────────────────────

export const WIZARD_STEPS: readonly WizardStep[] = [
  {
    id: 0,
    title: 'Personal Info',
    description: 'Tell us about yourself',
    fieldNames: ['fullName', 'email', 'country'],
  },
  {
    id: 1,
    title: 'Degree Status',
    description: 'What is your current academic status?',
    fieldNames: ['degreeStatus'],
  },
  {
    id: 2,
    title: 'Academics',
    description: 'Share your academic background',
    fieldNames: [
      'degree',
      'specialization',
      'finalCgpa',
      'currentSemester',
      'expectedGraduationDate',
      'expectedCgpa',
    ],
  },
  {
    id: 3,
    title: 'English',
    description: 'Your English language proficiency',
    fieldNames: ['ieltsStatus', 'ieltsScore', 'plannedIeltsDate', 'expectedIeltsScore'],
  },
  {
    id: 4,
    title: 'Preferences',
    description: 'Your study preferences',
    fieldNames: ['preferredIntake', 'preferredCourse', 'budget'],
  },
  {
    id: 5,
    title: 'Review',
    description: 'Review and submit your profile',
    fieldNames: [],
  },
] as const;

export const WIZARD_STEP_ICONS = [
  User,
  GraduationCap,
  BookOpen,
  Languages,
  Settings2,
  ClipboardCheck,
] as const;

// ─── Countries ────────────────────────────────────────────────────────────────
// Curated list — major source countries for German universities first, then alphabetical

export const COUNTRIES: readonly SelectOption[] = [
  // Top source countries for German universities
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'PK', label: '🇵🇰 Pakistan' },
  { value: 'BD', label: '🇧🇩 Bangladesh' },
  { value: 'CN', label: '🇨🇳 China' },
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'IR', label: '🇮🇷 Iran' },
  { value: 'SY', label: '🇸🇾 Syria' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'KR', label: '🇰🇷 South Korea' },
  { value: 'VN', label: '🇻🇳 Vietnam' },
  { value: 'ID', label: '🇮🇩 Indonesia' },
  { value: 'MX', label: '🇲🇽 Mexico' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'KZ', label: '🇰🇿 Kazakhstan' },
  { value: 'UA', label: '🇺🇦 Ukraine' },
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  // ─ Separator (visual) ─
  { value: 'AF', label: '🇦🇫 Afghanistan' },
  { value: 'AL', label: '🇦🇱 Albania' },
  { value: 'DZ', label: '🇩🇿 Algeria' },
  { value: 'AO', label: '🇦🇴 Angola' },
  { value: 'AR', label: '🇦🇷 Argentina' },
  { value: 'AM', label: '🇦🇲 Armenia' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'AT', label: '🇦🇹 Austria' },
  { value: 'AZ', label: '🇦🇿 Azerbaijan' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  { value: 'BJ', label: '🇧🇯 Benin' },
  { value: 'BO', label: '🇧🇴 Bolivia' },
  { value: 'BA', label: '🇧🇦 Bosnia and Herzegovina' },
  { value: 'BW', label: '🇧🇼 Botswana' },
  { value: 'BG', label: '🇧🇬 Bulgaria' },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'CM', label: '🇨🇲 Cameroon' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'HR', label: '🇭🇷 Croatia' },
  { value: 'CU', label: '🇨🇺 Cuba' },
  { value: 'CY', label: '🇨🇾 Cyprus' },
  { value: 'CZ', label: '🇨🇿 Czech Republic' },
  { value: 'CD', label: '🇨🇩 DR Congo' },
  { value: 'DK', label: '🇩🇰 Denmark' },
  { value: 'DO', label: '🇩🇴 Dominican Republic' },
  { value: 'EC', label: '🇪🇨 Ecuador' },
  { value: 'ER', label: '🇪🇷 Eritrea' },
  { value: 'ET', label: '🇪🇹 Ethiopia' },
  { value: 'FI', label: '🇫🇮 Finland' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'GE', label: '🇬🇪 Georgia' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'GR', label: '🇬🇷 Greece' },
  { value: 'GT', label: '🇬🇹 Guatemala' },
  { value: 'GN', label: '🇬🇳 Guinea' },
  { value: 'HN', label: '🇭🇳 Honduras' },
  { value: 'HU', label: '🇭🇺 Hungary' },
  { value: 'IQ', label: '🇮🇶 Iraq' },
  { value: 'IL', label: '🇮🇱 Israel' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'JM', label: '🇯🇲 Jamaica' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'JO', label: '🇯🇴 Jordan' },
  { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'KG', label: '🇰🇬 Kyrgyzstan' },
  { value: 'LA', label: '🇱🇦 Laos' },
  { value: 'LB', label: '🇱🇧 Lebanon' },
  { value: 'LY', label: '🇱🇾 Libya' },
  { value: 'LT', label: '🇱🇹 Lithuania' },
  { value: 'MK', label: '🇲🇰 North Macedonia' },
  { value: 'MY', label: '🇲🇾 Malaysia' },
  { value: 'ML', label: '🇲🇱 Mali' },
  { value: 'MR', label: '🇲🇷 Mauritania' },
  { value: 'MD', label: '🇲🇩 Moldova' },
  { value: 'MA', label: '🇲🇦 Morocco' },
  { value: 'MZ', label: '🇲🇿 Mozambique' },
  { value: 'MM', label: '🇲🇲 Myanmar' },
  { value: 'NP', label: '🇳🇵 Nepal' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'NZ', label: '🇳🇿 New Zealand' },
  { value: 'NE', label: '🇳🇪 Niger' },
  { value: 'NO', label: '🇳🇴 Norway' },
  { value: 'OM', label: '🇴🇲 Oman' },
  { value: 'PS', label: '🇵🇸 Palestine' },
  { value: 'PA', label: '🇵🇦 Panama' },
  { value: 'PY', label: '🇵🇾 Paraguay' },
  { value: 'PE', label: '🇵🇪 Peru' },
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'PL', label: '🇵🇱 Poland' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'RO', label: '🇷🇴 Romania' },
  { value: 'RW', label: '🇷🇼 Rwanda' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'SN', label: '🇸🇳 Senegal' },
  { value: 'RS', label: '🇷🇸 Serbia' },
  { value: 'SL', label: '🇸🇱 Sierra Leone' },
  { value: 'SO', label: '🇸🇴 Somalia' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'SS', label: '🇸🇸 South Sudan' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'LK', label: '🇱🇰 Sri Lanka' },
  { value: 'SD', label: '🇸🇩 Sudan' },
  { value: 'SE', label: '🇸🇪 Sweden' },
  { value: 'CH', label: '🇨🇭 Switzerland' },
  { value: 'TW', label: '🇹🇼 Taiwan' },
  { value: 'TJ', label: '🇹🇯 Tajikistan' },
  { value: 'TZ', label: '🇹🇿 Tanzania' },
  { value: 'TH', label: '🇹🇭 Thailand' },
  { value: 'TN', label: '🇹🇳 Tunisia' },
  { value: 'TM', label: '🇹🇲 Turkmenistan' },
  { value: 'UG', label: '🇺🇬 Uganda' },
  { value: 'AE', label: '🇦🇪 United Arab Emirates' },
  { value: 'UY', label: '🇺🇾 Uruguay' },
  { value: 'UZ', label: '🇺🇿 Uzbekistan' },
  { value: 'VE', label: '🇻🇪 Venezuela' },
  { value: 'YE', label: '🇾🇪 Yemen' },
  { value: 'ZM', label: '🇿🇲 Zambia' },
  { value: 'ZW', label: '🇿🇼 Zimbabwe' },
] as const;

// ─── Degree Options ───────────────────────────────────────────────────────────

export const DEGREE_OPTIONS: readonly SelectOption[] = [
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'associate', label: 'Associate Degree' },
] as const;

// ─── Intake Options ───────────────────────────────────────────────────────────

export const INTAKE_OPTIONS: readonly SelectOption[] = [
  { value: 'winter', label: 'Winter Semester (October)' },
  { value: 'summer', label: 'Summer Semester (April)' },
] as const;

// ─── IELTS Score Options ──────────────────────────────────────────────────────

export const IELTS_SCORE_OPTIONS: readonly SelectOption[] = [
  { value: '0', label: '0.0' },
  { value: '0.5', label: '0.5' },
  { value: '1', label: '1.0' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' },
  { value: '3.5', label: '3.5' },
  { value: '4', label: '4.0' },
  { value: '4.5', label: '4.5' },
  { value: '5', label: '5.0' },
  { value: '5.5', label: '5.5' },
  { value: '6', label: '6.0' },
  { value: '6.5', label: '6.5' },
  { value: '7', label: '7.0' },
  { value: '7.5', label: '7.5' },
  { value: '8', label: '8.0' },
  { value: '8.5', label: '8.5' },
  { value: '9', label: '9.0 (Expert)' },
] as const;

// ─── Semester Options ─────────────────────────────────────────────────────────

export const SEMESTER_OPTIONS: readonly SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
})) as readonly SelectOption[];
