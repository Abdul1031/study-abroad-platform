import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/context/AuthContext';

// ─── Types mirroring GET /api/recommendations/universities ───────────────────

export type MatchTier = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK';

export interface UniversityMatchBreakdown {
  academicFit: number; // /25
  languageFit: number; // /20
  affordability: number; // /25
  programAlignment: number; // /20
  preferenceBonus: number; // /10
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
  matchedCourses: string[];
  reasons: string[];
}

export function useUniversityRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['university-recommendations', user?.id],
    queryFn: async (): Promise<UniversityMatch[]> => {
      const response = await api.get<UniversityMatch[]>('/recommendations/universities');
      return response.data ?? [];
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60_000,
  });
}
