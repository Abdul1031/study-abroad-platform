import { UniversityRepository } from '../repositories/university.repository';

// ─── Query contract for GET /api/universities ─────────────────────────────────

export interface UniversityQuery {
  /** Free-text search across university name, city, and course names */
  q?: string;
  cities?: string[];
  /** Bundesländer, e.g. ["Bavaria", "Berlin"] */
  states?: string[];
  types?: string[];
  degrees?: string[];
  fields?: string[];
  languages?: string[];
  intakes?: string[];
  tuitionMin?: number;
  tuitionMax?: number;
  hasDormitory?: boolean;
  sortBy?: 'ranking' | 'tuition' | 'name';
}

/**
 * The Course.field column contains a mix of category codes ("CS") and free
 * text ("Computer Science", "Civil Engineering") from different scrape
 * sources. Until the taxonomy is normalized, each filter code expands to a
 * keyword group matched with case-insensitive `contains`.
 */
const FIELD_KEYWORDS: Record<string, string[]> = {
  CS: ['cs', 'computer', 'software', 'informatics'],
  ENGINEERING: ['engineering'],
  BUSINESS: ['business', 'management', 'economics'],
  DATA_SCIENCE: ['data'],
  MEDICINE: ['medicine', 'medical', 'health'],
  SCIENCE: ['mathematic', 'physic', 'chemi', 'biolog', 'natural science'],
};

export class UniversityService {
  constructor(private repo: UniversityRepository) {}

  async getUniversities(query: UniversityQuery, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AND: any[] = [];

    // ── Free-text search: university name, city, or any course name ──────────
    if (query.q && query.q.trim().length > 0) {
      const q = query.q.trim();
      AND.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { courses: { some: { name: { contains: q, mode: 'insensitive' } } } },
        ],
      });
    }

    // ── University-level filters ─────────────────────────────────────────────
    if (query.cities?.length) {
      AND.push({
        OR: query.cities.map((city) => ({ city: { equals: city, mode: 'insensitive' } })),
      });
    }
    if (query.states?.length) {
      AND.push({
        OR: query.states.map((state) => ({ state: { equals: state, mode: 'insensitive' } })),
      });
    }
    if (query.types?.length) {
      AND.push({ type: { in: query.types.map((t) => t.toUpperCase()) } });
    }
    if (query.tuitionMin != null || query.tuitionMax != null) {
      AND.push({
        tuitionFeeEuros: {
          ...(query.tuitionMin != null ? { gte: query.tuitionMin } : {}),
          ...(query.tuitionMax != null ? { lte: query.tuitionMax } : {}),
        },
      });
    }
    if (query.hasDormitory) {
      AND.push({ hasStudentDormitory: true });
    }

    // ── Course-level filters (university must offer a matching course) ───────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseAND: any[] = [];
    if (query.degrees?.length) {
      courseAND.push({ degree: { in: query.degrees.map((d) => d.toUpperCase()) } });
    }
    if (query.languages?.length) {
      courseAND.push({ language: { in: query.languages.map((l) => l.toUpperCase()) } });
    }
    if (query.fields?.length) {
      const keywords = query.fields.flatMap((code) => FIELD_KEYWORDS[code.toUpperCase()] ?? [code]);
      courseAND.push({
        OR: keywords.map((kw) => ({ field: { contains: kw, mode: 'insensitive' } })),
      });
    }
    if (query.intakes?.length) {
      const intakeOR = [];
      if (query.intakes.some((i) => i.toUpperCase() === 'WINTER')) {
        intakeOR.push({ intakeWinter: true });
      }
      if (query.intakes.some((i) => i.toUpperCase() === 'SUMMER')) {
        intakeOR.push({ intakeSummer: true });
      }
      if (intakeOR.length) courseAND.push({ OR: intakeOR });
    }
    if (courseAND.length) {
      AND.push({ courses: { some: { AND: courseAND } } });
    }

    const where = AND.length ? { AND } : {};

    // ── Sorting (nulls last so unranked/unpriced entries don't float up;
    //     name as a stable tiebreaker so pagination never skips rows) ────────
    const orderBy =
      query.sortBy === 'tuition'
        ? [
            { tuitionFeeEuros: { sort: 'asc' as const, nulls: 'last' as const } },
            { name: 'asc' as const },
          ]
        : query.sortBy === 'name'
          ? [{ name: 'asc' as const }]
          : [
              { ranking: { sort: 'asc' as const, nulls: 'last' as const } },
              { name: 'asc' as const },
            ];

    return this.repo.findFiltered(where, orderBy, skip, pageSize);
  }

  async getUniversityDetail(id: string) {
    return this.repo.findWithCourses(id);
  }

  async searchUniversities(query: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    return this.repo.searchByName(query, skip, pageSize);
  }

  async getByCity(city: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    return this.repo.findByCity(city, skip, pageSize);
  }
}
