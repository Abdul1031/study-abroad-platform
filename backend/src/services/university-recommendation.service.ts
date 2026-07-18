import { prisma } from '../config/prisma';
import { appCache } from './cache/cache.service';

// ═══════════════════════════════════════════════════════════════════════════
// University-level recommendation engine.
//
// Matches the student's saved profile against every active university and
// returns a ranked list with a transparent per-dimension breakdown. Scores
// are continuous (not pass/fail) so results genuinely differentiate instead
// of clustering at one number.
//
// Dimensions (sum = 100):
//   academicFit       25  — CGPA vs the university's expectations
//   languageFit       20  — IELTS vs required level
//   affordability     25  — tuition + living cost vs stated yearly budget
//   programAlignment  20  — does it teach what the student wants to study?
//   preferenceBonus   10  — intake availability, dormitory, reputation
// ═══════════════════════════════════════════════════════════════════════════

export type MatchTier = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK';

export interface UniversityMatchBreakdown {
  academicFit: number;
  languageFit: number;
  affordability: number;
  programAlignment: number;
  preferenceBonus: number;
}

export interface UniversityMatch {
  universityId: string;
  name: string;
  city: string;
  state: string;
  type: string;
  ranking: number | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  tuitionFeeEuros: number | null;
  averageRentEuros: number | null;
  courseCount: number;
  totalScore: number;
  tier: MatchTier;
  breakdown: UniversityMatchBreakdown;
  /** Course names at this university matching the student's interest (≤3) */
  matchedCourses: string[];
  /** Human-readable reasons the score came out the way it did */
  reasons: string[];
}

interface StudentProfile {
  cgpa: number | null;
  expectedCgpa: number | null;
  ieltsScore: number | null;
  expectedIeltsScore: number | null;
  budget: number | null;
  preferredIntake: string | null;
  preferredCourse: string | null;
  specialization: string | null;
}

interface UniversityWithCourses {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  ranking: number | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  tuitionFeeEuros: number | null;
  averageRentEuros: number | null;
  ieltsMinimum: number | null;
  gpaMinimum: number | null;
  hasStudentDormitory: boolean;
  courses: {
    name: string;
    field: string;
    ieltsMinimum: number | null;
    gpaMinimum: number | null;
    intakeWinter: boolean;
    intakeSummer: boolean;
  }[];
}

const CACHE_TTL_MS = 5 * 60_000;

/** Tokens too generic to signal a subject match on their own */
const STOPWORDS = new Set([
  'msc',
  'bsc',
  'ba',
  'ma',
  'master',
  'masters',
  'bachelor',
  'bachelors',
  'of',
  'in',
  'and',
  'the',
  'science',
  'sciences',
  'studies',
  'engineering',
]);

/** Common study-field acronyms → the phrases course catalogs actually use */
const ACRONYM_EXPANSIONS: Record<string, string[]> = {
  ai: ['artificial intelligence', 'machine learning'],
  ml: ['machine learning'],
  cs: ['computer'],
  ds: ['data science', 'data'],
  it: ['information technology', 'informatics'],
  ee: ['electrical'],
  me: ['mechanical'],
  bwl: ['business'],
};

export class UniversityRecommendationService {
  async recommend(studentId: string): Promise<UniversityMatch[]> {
    return appCache.getOrSet(`urecs:${studentId}`, CACHE_TTL_MS, async () => {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) throw new Error('Student not found');

      const profile: StudentProfile = {
        cgpa: student.cgpa,
        expectedCgpa: student.expectedCgpa,
        ieltsScore: student.ieltsScore,
        expectedIeltsScore: student.expectedIeltsScore,
        budget: student.budget,
        preferredIntake: student.preferredIntake,
        preferredCourse: student.preferredCourse,
        specialization: student.specialization,
      };

      const universities = (await prisma.university.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          type: true,
          ranking: true,
          websiteUrl: true,
          logoUrl: true,
          tuitionFeeEuros: true,
          averageRentEuros: true,
          ieltsMinimum: true,
          gpaMinimum: true,
          hasStudentDormitory: true,
          courses: {
            select: {
              name: true,
              field: true,
              ieltsMinimum: true,
              gpaMinimum: true,
              intakeWinter: true,
              intakeSummer: true,
            },
          },
        },
      })) as UniversityWithCourses[];

      const matches = universities.map((uni) => this.scoreUniversity(uni, profile));
      matches.sort(
        (a, b) => b.totalScore - a.totalScore || (a.ranking ?? 9999) - (b.ranking ?? 9999)
      );
      return matches.slice(0, 30);
    });
  }

  // ── Scoring ────────────────────────────────────────────────────────────────

  private scoreUniversity(uni: UniversityWithCourses, profile: StudentProfile): UniversityMatch {
    const reasons: string[] = [];

    const academicFit = this.scoreAcademic(uni, profile, reasons);
    const languageFit = this.scoreLanguage(uni, profile, reasons);
    const affordability = this.scoreAffordability(uni, profile, reasons);
    const { score: programAlignment, matched } = this.scoreProgramAlignment(uni, profile, reasons);
    const preferenceBonus = this.scorePreferences(uni, profile, reasons);

    const totalScore = Math.round(
      academicFit + languageFit + affordability + programAlignment + preferenceBonus
    );

    const tier: MatchTier =
      totalScore >= 80
        ? 'EXCELLENT'
        : totalScore >= 62
          ? 'GOOD'
          : totalScore >= 45
            ? 'FAIR'
            : 'WEAK';

    return {
      universityId: uni.id,
      name: uni.name,
      city: uni.city,
      state: uni.state,
      type: uni.type,
      ranking: uni.ranking,
      websiteUrl: uni.websiteUrl,
      logoUrl: uni.logoUrl,
      tuitionFeeEuros: uni.tuitionFeeEuros,
      averageRentEuros: uni.averageRentEuros,
      courseCount: uni.courses.length,
      totalScore,
      tier,
      breakdown: {
        academicFit: round1(academicFit),
        languageFit: round1(languageFit),
        affordability: round1(affordability),
        programAlignment: round1(programAlignment),
        preferenceBonus: round1(preferenceBonus),
      },
      matchedCourses: matched,
      reasons,
    };
  }

  /** CGPA vs expectation — expectation derived from explicit minima, else reputation tier. */
  private scoreAcademic(
    uni: UniversityWithCourses,
    profile: StudentProfile,
    reasons: string[]
  ): number {
    const cgpa = profile.cgpa ?? profile.expectedCgpa;
    if (cgpa == null) return 12; // unknown — neutral midpoint

    const courseMinima = uni.courses.map((c) => c.gpaMinimum).filter((v): v is number => v != null);
    const explicitMin = uni.gpaMinimum ?? (courseMinima.length ? Math.min(...courseMinima) : null);

    // No published requirement → infer selectivity from world ranking.
    const expected =
      explicitMin ??
      (uni.ranking == null ? 2.7 : uni.ranking <= 100 ? 3.5 : uni.ranking <= 250 ? 3.2 : 3.0);

    const ratio = Math.min(1, cgpa / expected);
    const score = Math.pow(ratio, 1.5) * 25;

    if (ratio >= 1) reasons.push(`Your CGPA (${cgpa}) meets this university's expectations`);
    else if (ratio < 0.85) reasons.push(`Admission is competitive for your CGPA (${cgpa})`);
    return score;
  }

  /** IELTS vs required level with a graceful gradient below the bar. */
  private scoreLanguage(
    uni: UniversityWithCourses,
    profile: StudentProfile,
    reasons: string[]
  ): number {
    const ielts = profile.ieltsScore ?? profile.expectedIeltsScore;
    if (ielts == null) return 10; // unknown — neutral midpoint

    const courseMinima = uni.courses
      .map((c) => c.ieltsMinimum)
      .filter((v): v is number => v != null);
    const required = uni.ieltsMinimum ?? (courseMinima.length ? Math.min(...courseMinima) : 6.5);

    if (ielts >= required) {
      reasons.push(`IELTS ${ielts} clears the ${required} requirement`);
      return 20;
    }
    const gap = required - ielts;
    if (gap > 0.5) reasons.push(`IELTS ${ielts} is below the typical ${required} requirement`);
    return Math.max(0, 20 - gap * 16);
  }

  /** Yearly cost (tuition ×2 semesters + rent ×12) vs stated budget. */
  private scoreAffordability(
    uni: UniversityWithCourses,
    profile: StudentProfile,
    reasons: string[]
  ): number {
    if (profile.budget == null) return 12; // unknown — neutral midpoint

    const tuitionYearly = (uni.tuitionFeeEuros ?? 0) * 2;
    const rentYearly = (uni.averageRentEuros ?? 600) * 12;
    const yearlyCost = tuitionYearly + rentYearly;

    const ratio = Math.min(1, profile.budget / yearlyCost);
    // Below budget: linear up to 22. Above budget: the remaining 3 points
    // reward headroom, so a cheaper city genuinely outranks an expensive one
    // even when both are technically affordable.
    const score =
      ratio < 1 ? ratio * 22 : 22 + 3 * Math.min(1, (profile.budget - yearlyCost) / yearlyCost);

    if (ratio >= 1) {
      reasons.push(
        tuitionYearly === 0
          ? `Tuition-free, and your budget covers living costs in ${uni.city}`
          : `Your budget covers tuition and living costs in ${uni.city}`
      );
    } else if (ratio < 0.7) {
      reasons.push(
        `Living costs in ${uni.city} (~€${Math.round(yearlyCost / 12)}/mo) stretch your budget`
      );
    }
    return score;
  }

  /** Does the university teach the student's subject? Token match over course catalog. */
  private scoreProgramAlignment(
    uni: UniversityWithCourses,
    profile: StudentProfile,
    reasons: string[]
  ): { score: number; matched: string[] } {
    const interest =
      `${profile.preferredCourse ?? ''} ${profile.specialization ?? ''}`.toLowerCase();
    const rawTokens = interest.split(/[^a-zäöüß]+/).filter((t) => t.length >= 2);

    // Expand acronyms ("AI" → "artificial intelligence") so short interests
    // still match real catalog entries; then drop generic words.
    const tokens = [
      ...rawTokens.filter((t) => t.length >= 3 && !STOPWORDS.has(t)),
      ...rawTokens.flatMap((t) => ACRONYM_EXPANSIONS[t] ?? []),
    ];

    if (tokens.length === 0) return { score: 10, matched: [] }; // nothing stated — neutral

    if (uni.courses.length === 0) {
      // Catalog not ingested yet — neutral-low, not zero: absence of data
      // isn't evidence of absence of the program.
      return { score: 8, matched: [] };
    }

    const matched = uni.courses
      .filter((course) => {
        const haystack = `${course.name} ${course.field}`.toLowerCase();
        return tokens.some((t) => haystack.includes(t));
      })
      // Scraped names occasionally carry embedded newlines/extra whitespace —
      // normalize for display so the UI never renders raw artifacts.
      .map((c) => c.name.replace(/\s+/g, ' ').trim());

    const unique = [...new Set(matched)].slice(0, 3);
    const score =
      matched.length === 0 ? 4 : matched.length === 1 ? 14 : matched.length === 2 ? 17 : 20;

    if (unique.length > 0) {
      reasons.push(
        `Offers ${matched.length} program${matched.length > 1 ? 's' : ''} matching "${profile.preferredCourse}"`
      );
    }
    return { score, matched: unique };
  }

  /** Intake availability + dormitory + reputation nudge. */
  private scorePreferences(
    uni: UniversityWithCourses,
    profile: StudentProfile,
    reasons: string[]
  ): number {
    let score = 0;

    const intake = profile.preferredIntake?.toLowerCase();
    if (!intake || uni.courses.length === 0) {
      score += 2; // unknown either way
    } else if (
      (intake === 'winter' && uni.courses.some((c) => c.intakeWinter)) ||
      (intake === 'summer' && uni.courses.some((c) => c.intakeSummer))
    ) {
      score += 4;
      reasons.push(`Programs available for the ${intake} intake`);
    }

    if (uni.hasStudentDormitory) score += 2;

    if (uni.ranking != null && uni.ranking <= 200) {
      score += 4;
      reasons.push(`Ranked #${uni.ranking} worldwide`);
    } else if (uni.ranking != null) {
      score += 2;
    }

    return Math.min(10, score);
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Drop the cached recommendations for a student (call after profile updates). */
export function invalidateUniversityRecommendations(studentId: string): void {
  appCache.invalidate(`urecs:${studentId}`);
}
