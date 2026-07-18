import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  BedDouble,
  BookOpen,
  Building2,
  CalendarDays,
  Euro,
  ExternalLink,
  GraduationCap,
  Home,
  MapPin,
  Star,
} from 'lucide-react';
import { UniversityAvatar } from '../components/UniversityAvatar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  FluidProgramCard,
  type FluidProgram,
} from '@/features/dashboard/components/FluidProgramCard';

// ─── Types matching GET /api/universities/:id ─────────────────────────────────

interface UniversityCourseRow {
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
}

interface UniversityDetail {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  foundedYear?: number | null;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  ranking?: number | null;
  tuitionFeeEuros?: number | null;
  applicationDeadlineWinter?: string | null;
  applicationDeadlineSummer?: string | null;
  ieltsMinimum?: number | null;
  toeflMinimum?: number | null;
  gpaMinimum?: number | null;
  hasStudentDormitory: boolean;
  averageRentEuros?: number | null;
  courses: UniversityCourseRow[];
}

function useUniversityDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['university-detail', id],
    queryFn: async (): Promise<UniversityDetail> => {
      const response = await api.get<UniversityDetail>(`/universities/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// ─── Small building blocks ────────────────────────────────────────────────────

const typeBadge: Record<string, string> = {
  UNIVERSITY: 'bg-blue-100 text-blue-800',
  TECHNICAL_UNIVERSITY: 'bg-orange-100 text-orange-800',
  APPLIED_SCIENCES: 'bg-purple-100 text-purple-800',
};

const typeLabel: Record<string, string> = {
  UNIVERSITY: 'Public University',
  TECHNICAL_UNIVERSITY: 'Technical University',
  APPLIED_SCIENCES: 'University of Applied Sciences',
};

function FactCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Euro;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400">
        <Icon size={14} aria-hidden />
        {label}
      </p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatDeadline(value?: string | null): string {
  if (!value) return 'Not published';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedCourseId = searchParams.get('course');
  const focusedRef = useRef<HTMLDivElement>(null);
  const { data: university, isLoading, isError } = useUniversityDetail(id);

  // If routed here from Recommendations with ?course=<id>, scroll the
  // matching program into view with a soft highlight so the user lands
  // exactly on the card they clicked.
  useEffect(() => {
    if (!focusedCourseId || !university) return;
    const timer = setTimeout(() => {
      focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => clearTimeout(timer);
  }, [focusedCourseId, university]);

  // Map course rows into FluidProgram shape for the shared card
  const programs: FluidProgram[] = useMemo(() => {
    if (!university) return [];
    return university.courses.map((course) => ({
      id: course.id,
      name: course.name,
      universityName: university.name,
      city: university.city,
      degree: course.degree,
      field: course.field,
      language: course.language,
      durationSemesters: course.durationSemesters ?? null,
      tuitionFeeEuros: course.tuitionFeeEuros ?? null,
      ieltsMinimum: course.ieltsMinimum ?? null,
      completenessScore: course.completenessScore ?? 0,
      isStale: course.isStale ?? false,
      lastVerifiedAt: course.lastVerifiedAt ?? null,
      isMatchEligible: course.isMatchEligible ?? false,
      matchingBlockers: course.matchingBlockers ?? [],
      matchingWarnings: course.matchingWarnings ?? [],
    }));
  }, [university]);

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">University not found</h1>
        <p className="mb-6 text-gray-500">It may have been removed or the link is invalid.</p>
        <Link
          to="/universities"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ArrowLeft size={16} aria-hidden /> Back to universities
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft size={16} aria-hidden /> Back
      </button>

      {isLoading || !university ? (
        <>
          <div className="h-56 animate-pulse rounded-3xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-8 text-white sm:p-10"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-sky-300/10" />

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-bold',
                      typeBadge[university.type] ?? 'bg-white/20 text-white'
                    )}
                  >
                    {typeLabel[university.type] ?? university.type}
                  </span>
                  {university.ranking != null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
                      <Star size={12} className="fill-yellow-300 text-yellow-300" aria-hidden />
                      Rank #{university.ranking}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{university.name}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-blue-100">
                  <MapPin size={16} aria-hidden />
                  {university.city}, {university.state}
                  {university.foundedYear ? ` · Founded ${university.foundedYear}` : ''}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <UniversityAvatar
                  name={university.name}
                  logoUrl={university.logoUrl}
                  className="h-20 w-20 rounded-2xl ring-4 ring-white/20"
                />
              </div>
            </div>

            {university.websiteUrl && (
              <a
                href={university.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Official website <ExternalLink size={14} aria-hidden />
              </a>
            )}
          </motion.div>

          {/* ── Key facts ────────────────────────────────────────────────── */}
          <section aria-label="Key facts" className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FactCell
              icon={Euro}
              label="Tuition"
              value={
                university.tuitionFeeEuros == null
                  ? 'Unknown'
                  : university.tuitionFeeEuros === 0
                    ? 'Free'
                    : `€${university.tuitionFeeEuros.toLocaleString()} / sem`
              }
            />
            <FactCell
              icon={GraduationCap}
              label="Min IELTS / TOEFL"
              value={`${university.ieltsMinimum ?? '—'} / ${university.toeflMinimum ?? '—'}`}
            />
            <FactCell
              icon={Award}
              label="Min GPA"
              value={
                university.gpaMinimum != null ? university.gpaMinimum.toFixed(1) : 'Not specified'
              }
            />
            <FactCell
              icon={BedDouble}
              label="Avg. rent"
              value={
                university.averageRentEuros != null
                  ? `€${Math.round(university.averageRentEuros)} / month`
                  : 'Unknown'
              }
            />
            <FactCell
              icon={CalendarDays}
              label="Winter deadline"
              value={formatDeadline(university.applicationDeadlineWinter)}
            />
            <FactCell
              icon={CalendarDays}
              label="Summer deadline"
              value={formatDeadline(university.applicationDeadlineSummer)}
            />
            <FactCell
              icon={Home}
              label="Student dormitory"
              value={university.hasStudentDormitory ? 'Available' : 'Not available'}
            />
            <FactCell icon={Building2} label="Programs listed" value={String(programs.length)} />
          </section>

          {/* ── About ────────────────────────────────────────────────────── */}
          {university.description && (
            <section
              aria-label="About"
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="mb-3 text-xl font-bold text-gray-900">About {university.name}</h2>
              <p className="leading-relaxed text-gray-600">{university.description}</p>
            </section>
          )}

          {/* ── Programs ─────────────────────────────────────────────────── */}
          <section aria-labelledby="programs-heading">
            <h2
              id="programs-heading"
              className="mb-5 flex items-center gap-2 text-2xl font-bold text-gray-900"
            >
              <BookOpen size={22} className="text-blue-600" aria-hidden />
              Programs{' '}
              <span className="text-lg font-medium text-gray-400">({programs.length})</span>
            </h2>
            {programs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                No programs listed yet — data collection is in progress.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {programs.map((program, i) => {
                  const isFocused = program.id === focusedCourseId;
                  return (
                    <div
                      key={program.id}
                      ref={isFocused ? focusedRef : undefined}
                      className={cn(
                        'rounded-2xl transition-shadow duration-500',
                        isFocused && 'ring-4 ring-blue-400/60 ring-offset-2'
                      )}
                    >
                      <FluidProgramCard program={program} index={i} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
