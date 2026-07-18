import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Clock,
  Euro,
  GraduationCap,
  Languages,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Program shape consumed by the card — maps 1:1 onto the Phase 5 Course model. */
export interface FluidProgram {
  id: string;
  name: string;
  universityName: string;
  city?: string | null;
  degree: string;
  field: string;
  language: string;
  durationSemesters?: number | null;
  tuitionFeeEuros?: number | null;
  ieltsMinimum?: number | null;
  /** Phase 5 quality metric, 0–100 */
  completenessScore: number;
  /** Phase 5 staleness flag (lastVerifiedAt > 6 months) */
  isStale: boolean;
  lastVerifiedAt?: string | null;
  isMatchEligible: boolean;
  matchingBlockers: string[];
  matchingWarnings: string[];
}

export interface FluidProgramCardProps {
  program: FluidProgram;
  /** Index within the list — drives the scroll-stagger reveal delay */
  index?: number;
  onSave?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motion variants — stagger reveal on scroll
// ─────────────────────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: Math.min(index * 0.07, 0.42),
      type: 'spring',
      stiffness: 120,
      damping: 18,
    },
  }),
};

const detailListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const detailItemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Completeness ring — animated SVG quality indicator
// ─────────────────────────────────────────────────────────────────────────────

function scoreColor(score: number): { stroke: string; text: string; label: string } {
  if (score >= 70)
    return { stroke: 'stroke-emerald-500', text: 'text-emerald-600', label: 'High quality' };
  if (score >= 40)
    return { stroke: 'stroke-amber-500', text: 'text-amber-600', label: 'Partial data' };
  return { stroke: 'stroke-rose-500', text: 'text-rose-600', label: 'Low data' };
}

function CompletenessRing({ score, size = 46 }: { score: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const { stroke, text } = scoreColor(clamped);
  const radius = (size - 6) / 2;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Data completeness ${Math.round(clamped)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          className="stroke-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          className={stroke}
          style={{ pathLength: 0 }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: clamped / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums',
          text
        )}
      >
        {Math.round(clamped)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stale-data badge with soft pulse
// ─────────────────────────────────────────────────────────────────────────────

function StaleBadge({ lastVerifiedAt }: { lastVerifiedAt?: string | null }) {
  const verified = lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleDateString() : null;

  return (
    <motion.span
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
      animate={{ opacity: [1, 0.65, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      title={verified ? `Last verified ${verified}` : 'This program has not been verified recently'}
    >
      <Clock className="h-3 w-3" aria-hidden />
      Stale data
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick-fact cell shared by collapsed card and expanded modal
// ─────────────────────────────────────────────────────────────────────────────

function Fact({ icon: Icon, label, value }: { icon: typeof Euro; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 flex items-center gap-1 text-[11px] uppercase tracking-wide text-gray-400">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function formatTuition(euros?: number | null): string {
  if (euros === null || euros === undefined) return 'Unknown';
  return euros === 0 ? 'Free' : `€${euros.toLocaleString()} / sem`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FluidProgramCard
// ─────────────────────────────────────────────────────────────────────────────

export function FluidProgramCard({
  program,
  index = 0,
  onSave,
  onViewDetails,
}: FluidProgramCardProps) {
  const [expanded, setExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Shared layoutId — the collapsed card morphs into the expanded modal
  const layoutId = `fluid-program-${program.id}`;

  // ── Magnetic hover physics ────────────────────────────────────────────────
  // Raw pointer offset (-0.5 … 0.5) → spring-smoothed tilt + parallax lift.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springConfig = { stiffness: 260, damping: 22, mass: 0.6 };
  const smoothX = useSpring(pointerX, springConfig);
  const smoothY = useSpring(pointerY, springConfig);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
  const translateX = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  const translateY = useTransform(smoothY, [-0.5, 0.5], [-3, 3]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || expanded) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
      pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    },
    [prefersReducedMotion, expanded, pointerX, pointerY]
  );

  const handlePointerLeave = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  // ── Modal lifecycle: Escape to close + body scroll lock ───────────────────
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const quality = scoreColor(program.completenessScore);

  return (
    <>
      {/* ── Collapsed card ─────────────────────────────────────────────────── */}
      <motion.div
        ref={cardRef}
        layoutId={layoutId}
        custom={index}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
        whileTap={{ scale: 0.985 }}
        style={
          prefersReducedMotion
            ? undefined
            : { rotateX, rotateY, x: translateX, y: translateY, transformPerspective: 900 }
        }
        className={cn(
          'group relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm',
          'transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-100/60',
          program.isMatchEligible ? 'border-gray-200' : 'border-rose-200/70'
        )}
        onClick={() => setExpanded(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setExpanded(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={expanded}
      >
        {/* Sheen sweep on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        >
          <div className="absolute -inset-x-full top-0 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-[200%] group-hover:opacity-100" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {program.degree}
              </span>
              {program.isStale && <StaleBadge lastVerifiedAt={program.lastVerifiedAt} />}
              {!program.isMatchEligible && (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  <ShieldAlert className="h-3 w-3" aria-hidden />
                  Not matchable
                </span>
              )}
            </div>
            <motion.h3
              layoutId={`${layoutId}-title`}
              className="line-clamp-2 text-lg font-bold leading-snug text-gray-900"
            >
              {program.name}
            </motion.h3>
            <motion.p
              layoutId={`${layoutId}-university`}
              className="mt-1 flex items-center gap-1 text-sm font-medium text-gray-500"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {program.universityName}
                {program.city ? ` · ${program.city}` : ''}
              </span>
            </motion.p>
          </div>

          <motion.div layoutId={`${layoutId}-ring`}>
            <CompletenessRing score={program.completenessScore} />
          </motion.div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
          <Fact icon={Euro} label="Tuition" value={formatTuition(program.tuitionFeeEuros)} />
          <Fact icon={Languages} label="Language" value={program.language} />
          <Fact
            icon={GraduationCap}
            label="IELTS"
            value={program.ieltsMinimum != null ? program.ieltsMinimum.toFixed(1) : 'N/A'}
          />
        </div>
      </motion.div>

      {/* ── Expanded modal (layoutId morph) ────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <motion.div
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
            />

            <motion.div
              layoutId={layoutId}
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl"
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6 pb-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      {program.degree} · {program.field}
                    </span>
                    {program.isStale && <StaleBadge lastVerifiedAt={program.lastVerifiedAt} />}
                  </div>
                  <motion.h3
                    layoutId={`${layoutId}-title`}
                    id={titleId}
                    className="text-2xl font-bold leading-tight text-gray-900"
                  >
                    {program.name}
                  </motion.h3>
                  <motion.p
                    layoutId={`${layoutId}-university`}
                    className="mt-1 flex items-center gap-1 text-sm font-medium text-gray-500"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {program.universityName}
                    {program.city ? ` · ${program.city}` : ''}
                  </motion.p>
                </div>

                <div className="flex items-center gap-3">
                  <motion.div layoutId={`${layoutId}-ring`}>
                    <CompletenessRing score={program.completenessScore} size={56} />
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <motion.div
                className="overflow-y-auto p-6 pt-4"
                variants={detailListVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Quality verdict strip */}
                <motion.div
                  variants={detailItemVariants}
                  className={cn(
                    'mb-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium',
                    program.isMatchEligible
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  )}
                >
                  {program.isMatchEligible ? (
                    <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {program.isMatchEligible
                    ? `Eligible for matching — ${quality.label.toLowerCase()} (${Math.round(program.completenessScore)}% complete)`
                    : 'Excluded from matching until data quality improves'}
                </motion.div>

                <motion.div
                  variants={detailItemVariants}
                  className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-4"
                >
                  <Fact
                    icon={Euro}
                    label="Tuition"
                    value={formatTuition(program.tuitionFeeEuros)}
                  />
                  <Fact icon={Languages} label="Language" value={program.language} />
                  <Fact
                    icon={GraduationCap}
                    label="IELTS min"
                    value={program.ieltsMinimum != null ? program.ieltsMinimum.toFixed(1) : 'N/A'}
                  />
                  <Fact
                    icon={BookOpen}
                    label="Duration"
                    value={
                      program.durationSemesters != null
                        ? `${program.durationSemesters} semesters`
                        : 'Unknown'
                    }
                  />
                </motion.div>

                {program.matchingBlockers.length > 0 && (
                  <motion.div variants={detailItemVariants} className="mb-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
                      <ShieldAlert className="h-4 w-4" aria-hidden />
                      Matching blockers
                    </h4>
                    <ul className="space-y-1.5">
                      {program.matchingBlockers.map((blocker) => (
                        <li
                          key={blocker}
                          className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-1.5 text-sm text-rose-800"
                        >
                          {blocker}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {program.matchingWarnings.length > 0 && (
                  <motion.div variants={detailItemVariants} className="mb-4">
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      Data warnings
                    </h4>
                    <ul className="space-y-1.5">
                      {program.matchingWarnings.map((warning) => (
                        <li
                          key={warning}
                          className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-1.5 text-sm text-amber-800"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                <motion.div variants={detailItemVariants} className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    onClick={() => onViewDetails?.(program.id)}
                  >
                    <BookOpen className="h-4 w-4" aria-hidden />
                    Full course page
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => onSave?.(program.id)}
                  >
                    <Star className="h-4 w-4" aria-hidden />
                    Save
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — same silhouette as the card, crossfades out when data arrives.
// Render inside <AnimatePresence mode="popLayout"> next to FluidProgramCard.
// ─────────────────────────────────────────────────────────────────────────────

export function FluidProgramCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="h-4 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-5 w-4/5 animate-pulse rounded-md bg-gray-200" />
          <div className="h-4 w-3/5 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="h-[46px] w-[46px] animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
