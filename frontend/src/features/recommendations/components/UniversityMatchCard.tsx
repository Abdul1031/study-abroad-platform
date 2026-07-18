import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ExternalLink, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversityAvatar } from '@/features/universities/components/UniversityAvatar';
import type { UniversityMatch, MatchTier } from '../hooks/useUniversityRecommendations';

// ─── Tier styling ─────────────────────────────────────────────────────────────

const tierStyles: Record<MatchTier, { badge: string; label: string; bar: string }> = {
  EXCELLENT: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Excellent match',
    bar: 'bg-emerald-500',
  },
  GOOD: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Good match',
    bar: 'bg-blue-500',
  },
  FAIR: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Fair match',
    bar: 'bg-amber-500',
  },
  WEAK: {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    label: 'Weak match',
    bar: 'bg-gray-400',
  },
};

const typeLabels: Record<string, string> = {
  UNIVERSITY: 'University',
  TECHNICAL_UNIVERSITY: 'Technical University',
  APPLIED_SCIENCES: 'Applied Sciences',
};

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium tabular-nums text-gray-900">
          {Math.round(score)}/{max}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100">
        <motion.div
          className="h-1.5 rounded-full bg-blue-600"
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function UniversityMatchCard({
  match,
  index = 0,
}: {
  match: UniversityMatch;
  index?: number;
}) {
  const navigate = useNavigate();
  const tier = tierStyles[match.tier];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        delay: Math.min(index * 0.06, 0.4),
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }}
      whileHover={{ y: -4 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {/* Header strip */}
      <div className="relative">
        <UniversityAvatar name={match.name} logoUrl={match.logoUrl} className="h-24" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {match.ranking != null && (
            <span className="flex items-center gap-1 rounded-lg bg-white/25 px-2 py-1 backdrop-blur-sm">
              <Star size={11} className="fill-yellow-300 text-yellow-300" aria-hidden />
              <span className="text-xs font-bold text-white">#{match.ranking}</span>
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 rounded-xl bg-white px-2.5 py-1 shadow-sm">
          <span className="text-sm font-black tabular-nums text-gray-900">{match.totalScore}%</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-bold', tier.badge)}>
            {tier.label}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
            {typeLabels[match.type] ?? match.type}
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900">
          {match.name}
        </h3>
        <p className="mb-3 mt-0.5 flex items-center gap-1 text-xs text-gray-400">
          <MapPin size={12} aria-hidden />
          {match.city}, {match.state}
        </p>

        {/* Breakdown */}
        <div className="mb-3 space-y-1.5">
          <ScoreBar label="Academic fit" score={match.breakdown.academicFit} max={25} />
          <ScoreBar label="Language (IELTS)" score={match.breakdown.languageFit} max={20} />
          <ScoreBar label="Affordability" score={match.breakdown.affordability} max={25} />
          <ScoreBar label="Program alignment" score={match.breakdown.programAlignment} max={20} />
          <ScoreBar label="Extras" score={match.breakdown.preferenceBonus} max={10} />
        </div>

        {/* Matched programs */}
        {match.matchedCourses.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <BookOpen size={11} aria-hidden /> Matching programs
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {match.matchedCourses.map((course) => (
                <li
                  key={course}
                  className="max-w-full truncate rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                >
                  {course}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Why this match */}
        {match.reasons.length > 0 && (
          <ul className="mb-4 space-y-1">
            {match.reasons.slice(0, 3).map((reason) => (
              <li key={reason} className="flex items-start gap-1.5 text-xs text-gray-600">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigate(`/universities/${match.universityId}`)}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View University
          </button>
          {match.websiteUrl && (
            <a
              href={match.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Official website"
              className="flex items-center justify-center rounded-xl border border-gray-200 px-3 text-gray-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              <ExternalLink size={16} aria-hidden />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}
