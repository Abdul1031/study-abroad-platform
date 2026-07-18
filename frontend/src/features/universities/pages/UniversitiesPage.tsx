import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useUniversities } from '../hooks/useUniversities';
import { useUniversityFilters } from '../hooks/useUniversityFilters';
import { UniversityCard } from '../components/UniversityCard';
import {
  UNIVERSITY_TYPES,
  GERMAN_REGIONS,
  DEGREE_LEVELS,
  FIELDS_OF_STUDY,
  LANGUAGES,
} from '../constants/filter.constants';

// ── Chip toggle ──────────────────────────────────────────────────────────
function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`chip ${active ? 'chip-active' : 'chip-inactive'}`}
    >
      {active && <X size={12} className="mr-1" />}
      {label}
    </motion.button>
  );
}

// ── Collapsible filter section ───────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <button
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-gray-800 hover:text-gray-900"
        onClick={() => setOpen(!open)}
      >
        {title}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Multi-select chip helper ─────────────────────────────────────────────
function MultiChips({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[] | undefined;
  onChange: (v: string[]) => void;
}) {
  const toggle = (value: string) => {
    const current = selected || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange(next);
  };
  return (
    <>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          active={selected?.includes(opt.value) || false}
          onClick={() => toggle(opt.value)}
        />
      ))}
    </>
  );
}

// ── Skeleton loader card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-9 bg-gray-100 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────
export function UniversitiesPage() {
  const { filters, updateFilter, clearAllFilters, getActiveFilterCount } = useUniversityFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();

  // Debounce search so we query once per pause, not per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeFilters = { ...filters, q: debouncedQuery || undefined };
  const { data, isLoading, hasNextPage, fetchNextPage } = useUniversities(activeFilters);
  const observerTarget = useRef<HTMLDivElement>(null);
  const activeCount = getActiveFilterCount();

  // ── Infinite scroll ──────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isLoading, fetchNextPage]);

  const universities = data?.pages.flatMap((p) => p.universities) || [];

  // ── Filter panel (shared between mobile drawer and desktop sidebar) ──
  const FilterPanel = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900">Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 font-medium hover:text-blue-700"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <FilterSection title="Institution Type">
        <MultiChips
          options={UNIVERSITY_TYPES}
          selected={filters.type}
          onChange={(v) => updateFilter('type', v.length ? v : undefined)}
        />
      </FilterSection>

      <FilterSection title="Region & State">
        <div className="w-full space-y-3">
          {GERMAN_REGIONS.map(({ region, states }) => {
            const selected = filters.state || [];
            const allSelected = states.every((s) => selected.includes(s));
            return (
              <div key={region}>
                <button
                  type="button"
                  onClick={() => {
                    // Region header toggles all of its states at once
                    const next = allSelected
                      ? selected.filter((s) => !states.includes(s))
                      : [...new Set([...selected, ...states])];
                    updateFilter('state', next.length ? next : undefined);
                  }}
                  className={`mb-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                    allSelected ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {region} {allSelected ? '✓' : ''}
                </button>
                <div className="flex flex-wrap gap-2">
                  {states.map((state) => (
                    <Chip
                      key={state}
                      label={state}
                      active={selected.includes(state)}
                      onClick={() => {
                        const next = selected.includes(state)
                          ? selected.filter((s) => s !== state)
                          : [...selected, state];
                        updateFilter('state', next.length ? next : undefined);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Degree Level">
        <MultiChips
          options={DEGREE_LEVELS}
          selected={filters.degree}
          onChange={(v) => updateFilter('degree', v.length ? v : undefined)}
        />
      </FilterSection>

      <FilterSection title="Field of Study">
        <MultiChips
          options={FIELDS_OF_STUDY}
          selected={filters.field}
          onChange={(v) => updateFilter('field', v.length ? v : undefined)}
        />
      </FilterSection>

      <FilterSection title="Language">
        <MultiChips
          options={LANGUAGES}
          selected={filters.language}
          onChange={(v) => updateFilter('language', v.length ? v : undefined)}
        />
      </FilterSection>

      {/* Tuition range */}
      <FilterSection title="Tuition (€ / sem)">
        <div className="flex gap-2 w-full">
          <input
            type="number"
            placeholder="Min"
            value={filters.tuitionMin || ''}
            onChange={(e) =>
              updateFilter('tuitionMin', e.target.value ? +e.target.value : undefined)
            }
            className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.tuitionMax || ''}
            onChange={(e) =>
              updateFilter('tuitionMax', e.target.value ? +e.target.value : undefined)
            }
            className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </FilterSection>

      {/* Dormitory */}
      <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition">
        <input
          type="checkbox"
          checked={filters.hasDormitory || false}
          onChange={(e) => updateFilter('hasDormitory', e.target.checked || undefined)}
          className="w-4 h-4 accent-blue-600 rounded"
        />
        <span className="text-sm font-medium text-gray-700">Has Student Dormitory</span>
      </label>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Hero search bar ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Explore German Universities</h1>
        <p className="text-gray-500 mb-5">
          Find programs that match your academic profile and goals
        </p>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by university name or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <SlidersHorizontal size={16} />
            Filters{' '}
            {activeCount > 0 && (
              <span className="bg-blue-600 text-white rounded-full px-1.5 py-0.5 text-xs">
                {activeCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative hidden sm:block">
            <select
              value={filters.sortBy || 'ranking'}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="appearance-none w-full pl-4 pr-10 py-3 border border-gray-200 rounded-2xl bg-white shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ranking">Sort: Ranking</option>
              <option value="tuition">Sort: Tuition</option>
              <option value="name">Sort: Name</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-white z-50 overflow-y-auto p-5 shadow-2xl lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <FilterPanel />
              <button
                onClick={() => setShowMobileFilters(false)}
                className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
              >
                Show Results ({universities.length})
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">
        {/* ── Desktop filter sidebar ────────────────────────────────── */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
          <FilterPanel />
        </aside>

        {/* ── Results ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Result count */}
          {!isLoading && universities.length > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-900">{universities.length}</span>{' '}
              universities
            </p>
          )}

          {/* Loading skeletons */}
          {isLoading && universities.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && universities.length === 0 && (
            <motion.div
              className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No universities found</h3>
              <p className="text-gray-500 text-sm mb-5">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
              >
                Clear all filters
              </button>
            </motion.div>
          )}

          {/* University cards grid */}
          {universities.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {universities.map((uni, i) => (
                  <motion.div
                    key={uni.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <UniversityCard
                      university={uni}
                      onViewDetails={(id: string) => navigate(`/universities/${id}`)}
                      onSave={(id: string) => console.log('Save', id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={observerTarget} className="py-10 text-center">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Loading more...
                  </div>
                )}
                {!hasNextPage && (
                  <p className="text-gray-400 text-sm">
                    You&apos;ve seen all {universities.length} universities
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
