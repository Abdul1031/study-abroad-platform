import { AnimatePresence, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FluidProgramCard, FluidProgramCardSkeleton } from './FluidProgramCard';
import { useFeaturedPrograms } from '../hooks/useFeaturedPrograms';

/**
 * Dashboard showcase: the highest-quality programs in the catalog rendered
 * as fluid, expandable cards. Skeletons share the card silhouette and
 * crossfade out when the data lands.
 */
export function ProgramShowcase() {
  const { data: programs, isLoading, isError } = useFeaturedPrograms(6);
  const navigate = useNavigate();

  if (isError) return null; // Non-critical section — fail quietly on the dashboard

  return (
    <section aria-labelledby="program-showcase-heading">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-blue-600">
            <Sparkles className="h-4 w-4" aria-hidden />
            Top-rated programs
          </p>
          <h2 id="program-showcase-heading" className="text-3xl font-bold text-gray-900">
            Explore Featured Programs
          </h2>
          <p className="mt-2 max-w-xl text-gray-500">
            The best-documented programs in our catalog right now — verified data, clear
            requirements, ready to match.
          </p>
        </div>
        <Link
          to="/universities"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:text-blue-700"
        >
          Browse all <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => (
                <FluidProgramCardSkeleton key={`skeleton-${i}`} index={i} />
              ))
            : (programs ?? []).map((program, i) => (
                <FluidProgramCard
                  key={program.id}
                  program={program}
                  index={i}
                  onViewDetails={(courseId) => navigate(`/universities?course=${courseId}`)}
                />
              ))}
        </AnimatePresence>
      </div>

      {!isLoading && (programs?.length ?? 0) === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500"
        >
          No programs available yet — check back after the next data sync.
        </motion.p>
      )}
    </section>
  );
}
