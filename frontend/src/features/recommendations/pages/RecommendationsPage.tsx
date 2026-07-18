import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Sparkles, Filter, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useUniversityRecommendations,
  type MatchTier,
} from '../hooks/useUniversityRecommendations';
import { UniversityMatchCard } from '../components/UniversityMatchCard';
import { useProfileStatus } from '@/features/profile/hooks/useProfileStatus';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// ─── University-level recommendations ─────────────────────────────────────────
// Matches the student's saved profile against the whole public-university
// catalog. Every card links to the university detail page and the official
// website, mirroring the Universities tab experience.

export function RecommendationsPage() {
  const { data: matches, isLoading, isFetching, refetch } = useUniversityRecommendations();
  const { data: profileStatus, isLoading: profileLoading } = useProfileStatus();
  const [filter, setFilter] = useState<MatchTier | 'ALL'>('ALL');
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    if (!matches) return [];
    if (filter === 'ALL') return matches;
    return matches.filter((m) => m.tier === filter);
  }, [matches, filter]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['university-recommendations'] });
    refetch();
  };

  if (isLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-blue-600" aria-hidden />
          <p className="font-medium text-gray-600">Matching you with German universities…</p>
        </div>
      </div>
    );
  }

  // Profile gate: recommendations are only as good as the data provided
  if (profileStatus && !profileStatus.isComplete) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Card className="border-2 border-dashed bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <UserRound className="h-8 w-8 text-blue-500" aria-hidden />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">Complete your profile first</h3>
            <p className="mb-6 max-w-md text-gray-500">
              Recommendations are computed strictly from your academic data — CGPA, IELTS, budget,
              intake, and subject preferences. Fill in your profile and we&apos;ll rank every public
              university in Germany for you.
            </p>
            <Link to="/profile">
              <Button size="lg">Complete My Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Sparkles className="h-8 w-8 text-blue-600" aria-hidden />
            Your University Matches
          </h1>
          <p className="text-gray-600">
            Every public university in Germany, ranked against your profile — academics, language,
            budget, and subject fit.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isFetching} className="shrink-0 shadow-sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
          Refresh Matches
        </Button>
      </div>

      {/* Tier filter */}
      <div className="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="mr-1 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <TierButton
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          label={`All (${matches?.length ?? 0})`}
        />
        <TierButton
          active={filter === 'EXCELLENT'}
          onClick={() => setFilter('EXCELLENT')}
          label="Excellent (80+)"
          className="bg-emerald-50 text-emerald-700"
          activeClassName="bg-emerald-600 text-white"
        />
        <TierButton
          active={filter === 'GOOD'}
          onClick={() => setFilter('GOOD')}
          label="Good (62–79)"
          className="bg-blue-50 text-blue-700"
          activeClassName="bg-blue-600 text-white"
        />
        <TierButton
          active={filter === 'FAIR'}
          onClick={() => setFilter('FAIR')}
          label="Fair (45–61)"
          className="bg-amber-50 text-amber-700"
          activeClassName="bg-amber-500 text-white"
        />
        <TierButton
          active={filter === 'WEAK'}
          onClick={() => setFilter('WEAK')}
          label="Weak (<45)"
          className="bg-gray-50 text-gray-600"
          activeClassName="bg-gray-500 text-white"
        />
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No universities in this tier — try another filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((match, i) => (
            <UniversityMatchCard key={match.universityId} match={match} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function TierButton({
  active,
  onClick,
  label,
  className = 'bg-white text-gray-700 border-gray-200',
  activeClassName = 'bg-blue-600 text-white border-blue-600',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  className?: string;
  activeClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active ? activeClassName : `hover:bg-gray-50 ${className}`
      }`}
    >
      {label}
    </button>
  );
}
