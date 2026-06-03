import type { DegreeType, DegreeStatus, IeltsStatus, PreferredIntake } from '../types';

// ─── Currency Formatter ────────────────────────────────────────────────────────

const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatBudget(amount: number): string {
  return eurFormatter.format(amount);
}

// ─── Date Formatter ────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return dateFormatter.format(date);
}

// ─── CGPA Formatter ────────────────────────────────────────────────────────────

export function formatCgpa(cgpa: number | undefined): string {
  if (cgpa === undefined || cgpa === null) return '—';
  return `${cgpa.toFixed(2)} / 4.00`;
}

// ─── IELTS Score Formatter ─────────────────────────────────────────────────────

export function formatIeltsScore(score: number | undefined): string {
  if (score === undefined || score === null) return '—';
  return `${score.toFixed(1)} / 9.0`;
}

// ─── Label Mappers ─────────────────────────────────────────────────────────────

export function formatDegreeStatus(status: DegreeStatus): string {
  const map: Record<DegreeStatus, string> = {
    completed: 'Completed',
    ongoing: 'Ongoing',
  };
  return map[status];
}

export function formatDegreeType(degree: DegreeType): string {
  const map: Record<DegreeType, string> = {
    bachelors: "Bachelor's Degree",
    masters: "Master's Degree",
    phd: 'PhD / Doctorate',
    associate: 'Associate Degree',
  };
  return map[degree];
}

export function formatIeltsStatus(status: IeltsStatus): string {
  const map: Record<IeltsStatus, string> = {
    completed: 'IELTS Completed',
    not_taken: 'IELTS Not Taken Yet',
  };
  return map[status];
}

export function formatIntake(intake: PreferredIntake): string {
  const map: Record<PreferredIntake, string> = {
    winter: 'Winter Semester (October)',
    summer: 'Summer Semester (April)',
  };
  return map[intake];
}
