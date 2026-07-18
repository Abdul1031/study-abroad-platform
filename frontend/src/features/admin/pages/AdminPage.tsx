import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  ListChecks,
  Play,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  useApproveReview,
  useDeadLetters,
  useQualityMetrics,
  useRejectReview,
  useRetryDeadLetter,
  useReviewQueue,
  useRunScraper,
  useScraperStatus,
  type ReviewQueueItem,
} from '../hooks/useAdminData';

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
  index = 0,
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
  index?: number;
}) {
  const tones = {
    neutral: 'bg-blue-50 text-blue-600',
    good: 'bg-emerald-50 text-emerald-600',
    warn: 'bg-amber-50 text-amber-600',
    bad: 'bg-rose-50 text-rose-600',
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06 } }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div
        className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', tones[tone])}
      >
        <Icon size={20} aria-hidden />
      </div>
      <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Review queue row with inline approve / reject-with-reason
// ─────────────────────────────────────────────────────────────────────────────

function ReviewRow({ item, reviewedBy }: { item: ReviewQueueItem; reviewedBy: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const approve = useApproveReview(reviewedBy);
  const reject = useRejectReview(reviewedBy);
  const busy = approve.isPending || reject.isPending;

  const score = Math.round(item.course.completenessScore);
  const scoreTone =
    score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-rose-600';

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-gray-900">{item.course.name}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {item.course.university.name}
            {item.course.university.city ? ` · ${item.course.university.city}` : ''} ·{' '}
            {item.course.degree}
          </p>
          {item.course.matchingBlockers.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.course.matchingBlockers.map((blocker) => (
                <li
                  key={blocker}
                  className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700"
                >
                  {blocker}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-bold tabular-nums', scoreTone)}>{score}%</span>
          {item.course.isStale && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Clock size={11} aria-hidden /> Stale
            </span>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => approve.mutate({ reviewId: item.id })}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 size={15} aria-hidden /> Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
          >
            <XCircle size={15} aria-hidden /> Reject
          </button>
        </div>
      </div>

      <AnimatePresence>
        {rejecting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Rejection reason (required)"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:border-rose-300 focus:outline-none"
              />
              <button
                type="button"
                disabled={busy || reason.trim().length === 0}
                onClick={() => reject.mutate({ reviewId: item.id, reason: reason.trim() })}
                className="rounded-xl bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm rejection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminPage
// ─────────────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { user } = useAuth();
  const metrics = useQualityMetrics();
  const reviewQueue = useReviewQueue('FLAGGED');
  const reviewedBy = user?.email ?? 'admin';

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-blue-600">
          <ShieldCheck size={15} aria-hidden /> Admin
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Data Quality Control</h1>
        <p className="mt-1 text-gray-500">
          Catalog health, the review queue, and scraper operations in one place.
        </p>
      </div>

      {/* ── Metrics ─────────────────────────────────────────────────────── */}
      <section aria-label="Quality metrics">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard
            icon={Database}
            label="Total programs"
            value={metrics.data?.totalPrograms ?? '—'}
            index={0}
          />
          <StatCard
            icon={CheckCircle2}
            label="Match-eligible"
            value={
              metrics.data
                ? `${metrics.data.eligibleCount} (${metrics.data.eligibilityRate}%)`
                : '—'
            }
            tone={metrics.data && metrics.data.eligibleCount > 0 ? 'good' : 'bad'}
            index={1}
          />
          <StatCard
            icon={Gauge}
            label="Avg completeness"
            value={metrics.data ? `${metrics.data.completenessStats.average}%` : '—'}
            hint={
              metrics.data
                ? `min ${metrics.data.completenessStats.minimum}% · max ${metrics.data.completenessStats.maximum}%`
                : undefined
            }
            index={2}
          />
          <StatCard
            icon={Clock}
            label="Stale programs"
            value={metrics.data?.staleCount ?? '—'}
            tone={metrics.data && metrics.data.staleCount > 0 ? 'warn' : 'good'}
            index={3}
          />
          <StatCard
            icon={ListChecks}
            label="Flagged for review"
            value={metrics.data?.reviewQueue.totalFlagged ?? '—'}
            tone={metrics.data && metrics.data.reviewQueue.totalFlagged > 0 ? 'warn' : 'good'}
            index={4}
          />
        </div>
      </section>

      {/* ── Scraper operations ──────────────────────────────────────────── */}
      <section
        aria-label="Scraper operations"
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <ScraperPanel />
      </section>

      {/* ── Review queue ────────────────────────────────────────────────── */}
      <section aria-label="Review queue">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Review queue{' '}
            <span className="text-base font-medium text-gray-400">
              ({reviewQueue.data?.total ?? 0} flagged)
            </span>
          </h2>
        </div>

        {reviewQueue.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : (reviewQueue.data?.data.length ?? 0) === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            Nothing flagged — the catalog is clean. 🎉
          </p>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence>
              {reviewQueue.data?.data.map((item) => (
                <ReviewRow key={item.id} item={item} reviewedBy={reviewedBy} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scraper panel (queue status, run trigger, dead letters)
// ─────────────────────────────────────────────────────────────────────────────

function ScraperPanel() {
  const status = useScraperStatus();
  const deadLetters = useDeadLetters();
  const runScraper = useRunScraper();
  const retry = useRetryDeadLetter();

  const queue = status.data?.queue;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Activity size={19} className="text-blue-600" aria-hidden /> Scraper operations
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Scheduler{' '}
            {status.data?.schedulerInitialised
              ? 'active — weekly run Sunday 02:00 UTC'
              : 'not initialised'}
          </p>
        </div>
        <button
          type="button"
          disabled={runScraper.isPending}
          onClick={() => runScraper.mutate()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Play size={15} aria-hidden />
          {runScraper.isPending ? 'Queueing…' : 'Run full sync now'}
        </button>
      </div>

      {runScraper.data && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mb-4 rounded-xl border px-3 py-2 text-sm font-medium',
            runScraper.data.deduplicated
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          )}
        >
          {runScraper.data.message} (job {runScraper.data.jobId.slice(0, 8)})
        </motion.p>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ['Pending', queue?.pending],
            ['Active', queue?.active],
            ['Completed', queue?.completed],
            ['Failed attempts', queue?.failedAttempts],
            ['Dead-lettered', queue?.deadLettered],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-gray-50 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="text-lg font-bold tabular-nums text-gray-900">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>

      {(deadLetters.data?.length ?? 0) > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-rose-700">
            <AlertTriangle size={15} aria-hidden /> Dead-lettered jobs
          </h3>
          <ul className="space-y-2">
            {deadLetters.data?.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-gray-900">
                    {job.data.trigger} run · {job.attempts}/{job.maxAttempts} attempts
                  </p>
                  <p className="truncate text-xs text-rose-700">
                    {job.lastError ?? 'Unknown error'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(job.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={12} aria-hidden /> Retry
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
