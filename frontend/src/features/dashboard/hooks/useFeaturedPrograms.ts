import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FluidProgram } from '../components/FluidProgramCard';

/** Raw course row as returned by GET /api/courses (with university included). */
interface CourseRow {
  id: string;
  name: string;
  degree: string;
  field: string;
  language: string;
  durationSemesters?: number | null;
  tuitionFeeEuros?: number | null;
  ieltsMinimum?: number | null;
  completenessScore?: number | null;
  isMatchEligible?: boolean | null;
  matchingBlockers?: string[] | null;
  matchingWarnings?: string[] | null;
  isStale?: boolean | null;
  lastVerifiedAt?: string | null;
  university?: { name: string; city?: string | null } | null;
}

function toFluidProgram(row: CourseRow): FluidProgram {
  return {
    id: row.id,
    name: row.name,
    universityName: row.university?.name ?? 'Unknown university',
    city: row.university?.city ?? null,
    degree: row.degree,
    field: row.field,
    language: row.language,
    durationSemesters: row.durationSemesters ?? null,
    tuitionFeeEuros: row.tuitionFeeEuros ?? null,
    ieltsMinimum: row.ieltsMinimum ?? null,
    completenessScore: row.completenessScore ?? 0,
    isStale: row.isStale ?? false,
    lastVerifiedAt: row.lastVerifiedAt ?? null,
    isMatchEligible: row.isMatchEligible ?? false,
    matchingBlockers: row.matchingBlockers ?? [],
    matchingWarnings: row.matchingWarnings ?? [],
  };
}

/**
 * Featured programs for the dashboard showcase. The backend already orders
 * by isMatchEligible + completenessScore, so page 1 is the best of the catalog.
 */
export function useFeaturedPrograms(count = 6) {
  return useQuery({
    queryKey: ['featured-programs', count],
    queryFn: async (): Promise<FluidProgram[]> => {
      const response = await api.get<CourseRow[]>('/courses?page=1');
      return (response.data ?? []).slice(0, count).map(toFluidProgram);
    },
    staleTime: 5 * 60 * 1000,
  });
}
