import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useApplications,
  useCourseSearch,
  useCreateApplication,
  useDeleteApplication,
  useUpdateApplication,
  type Application,
  type ApplicationStatus,
} from '@/features/tracker/hooks/useApplications';

// ─── Column & badge config ────────────────────────────────────────────────────

const columns: { key: ApplicationStatus; label: string; color: string; dot: string }[] = [
  {
    key: 'NOT_STARTED',
    label: 'Not Started',
    color: 'bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
  },
  {
    key: 'SUBMITTED',
    label: 'Submitted',
    color: 'bg-yellow-50 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  {
    key: 'DECISION',
    label: 'Decision',
    color: 'bg-green-50 border-green-200',
    dot: 'bg-green-500',
  },
];

const statusLabels: Record<ApplicationStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  DECISION: 'Decision',
};

// Stable gradient per application, derived from its name
const gradients = [
  'from-blue-600 to-blue-500',
  'from-purple-600 to-purple-500',
  'from-teal-600 to-teal-500',
  'from-orange-600 to-orange-500',
  'from-green-600 to-green-500',
  'from-rose-600 to-rose-500',
];
function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
}

function formatDeadline(value?: string | null): string {
  if (!value) return 'No deadline set';
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Application card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
  const update = useUpdateApplication();
  const remove = useDeleteApplication();
  const color = gradientFor(app.programName);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className={`h-2 bg-gradient-to-r ${color}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}
            >
              <GraduationCap size={16} className="text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-snug truncate">
                {app.universityName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {app.degree ? `${app.degree} · ` : ''}
                {app.programName}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {app.universityId && (
              <Link
                to={`/universities/${app.universityId}`}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                title="View university"
              >
                <ExternalLink size={14} className="text-gray-400" aria-hidden />
              </Link>
            )}
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => remove.mutate(app.id)}
              className="p-1.5 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
              title="Remove application"
            >
              <Trash2 size={14} className="text-gray-400 hover:text-rose-500" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <CalendarDays size={12} aria-hidden />
            {formatDeadline(app.deadline)}
          </span>
          {/* Status mover — changing it slides the card to its new column */}
          <select
            value={app.status}
            onChange={(e) =>
              update.mutate({ id: app.id, status: e.target.value as ApplicationStatus })
            }
            className="text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Application status"
          >
            {columns.map((col) => (
              <option key={col.key} value={col.key}>
                {statusLabels[col.key]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add-application dialog ───────────────────────────────────────────────────

function AddApplicationDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [deadline, setDeadline] = useState('');
  const search = useCourseSearch(debounced);
  const create = useCreateApplication();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePick = async (courseId: string) => {
    try {
      await create.mutateAsync({ courseId, deadline: deadline || undefined });
      onClose();
    } catch {
      // error state rendered below
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Add application"
    >
      <motion.div
        className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Track a new application</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs or universities…"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="mb-3 flex items-center gap-3 text-sm text-gray-600">
          <span className="shrink-0 font-medium">Deadline (optional)</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        {create.isError && (
          <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {(create.error as { message?: string })?.message ??
              'Could not add — you may already be tracking this program.'}
          </p>
        )}

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {search.isFetching && (
            <p className="flex items-center gap-2 px-2 py-4 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" aria-hidden /> Searching…
            </p>
          )}
          {!search.isFetching && debounced.length >= 2 && (search.data?.length ?? 0) === 0 && (
            <p className="px-2 py-4 text-sm text-gray-400">No programs match “{debounced}”.</p>
          )}
          {debounced.length < 2 && (
            <p className="px-2 py-4 text-sm text-gray-400">
              Type at least 2 characters to search the program catalog.
            </p>
          )}
          {search.data?.map((course) => (
            <button
              key={course.id}
              type="button"
              disabled={create.isPending}
              onClick={() => handlePick(course.id)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/50 disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {course.name}
                </span>
                <span className="block truncate text-xs text-gray-500">
                  {course.university?.name ?? 'Unknown university'} · {course.degree}
                </span>
              </span>
              <Plus size={16} className="shrink-0 text-blue-600" aria-hidden />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Tracker() {
  const { data: apps = [], isLoading } = useApplications();
  const [showAdd, setShowAdd] = useState(false);

  const totalApps = apps.length;
  const submittedOrDecision = apps.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'DECISION'
  ).length;
  const completionPct = totalApps === 0 ? 0 : Math.round((submittedOrDecision / totalApps) * 100);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Application Tracker</h1>
          <p className="text-gray-500">Track all your university applications in one place</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} aria-hidden />
          Add Application
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracked', value: totalApps, color: 'text-gray-900' },
          {
            label: 'In Progress',
            value: apps.filter((a) => a.status === 'IN_PROGRESS').length,
            color: 'text-blue-600',
          },
          {
            label: 'Submitted',
            value: apps.filter((a) => a.status === 'SUBMITTED').length,
            color: 'text-yellow-600',
          },
          {
            label: 'Decisions Awaited',
            value: apps.filter((a) => a.status === 'DECISION').length,
            color: 'text-green-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <p className={`text-3xl font-black ${stat.color} mb-1`}>
              {isLoading ? '–' : stat.value}
            </p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Progress ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900 text-sm">Overall Completion</span>
          <span className="text-blue-600 font-bold text-sm">{completionPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-sky-400 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {submittedOrDecision} of {totalApps} applications submitted or in decision stage
        </p>
      </div>

      {/* ── Loading state ──────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className={cn('rounded-2xl border-2 p-4 min-h-48', col.color)}>
              <div className="h-4 w-24 animate-pulse rounded bg-white/70 mb-4" />
              <div className="h-24 animate-pulse rounded-2xl bg-white/70" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && totalApps === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <GraduationCap size={26} className="text-blue-600" aria-hidden />
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">No applications tracked yet</h3>
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">
            Add the programs you&apos;re applying to and move them through each stage — from first
            draft to final decision.
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Plus size={16} aria-hidden /> Track your first application
          </button>
        </motion.div>
      )}

      {/* ── Kanban board ───────────────────────────────────────────── */}
      {!isLoading && totalApps > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colApps = apps.filter((a) => a.status === col.key);
            return (
              <div key={col.key} className={cn('rounded-2xl border-2 p-4 min-h-48', col.color)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full', col.dot)} />
                    <span className="text-sm font-bold text-gray-800">{col.label}</span>
                  </div>
                  <span className="text-xs bg-white text-gray-600 rounded-full px-2 py-0.5 font-medium shadow-sm">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {colApps.map((app) => (
                      <ApplicationCard key={app.id} app={app} />
                    ))}
                  </AnimatePresence>
                  {colApps.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-xs">No applications here yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add dialog ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && <AddApplicationDialog onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
