import { cn } from '@/lib/utils';

// ─── Deterministic per-university colour ──────────────────────────────────────
// Hashing name → hue means every university gets a stable, distinctive gradient
// without depending on external logo URLs. FNV-1a is used because
// String.charCodeAt sums collide too often (e.g. "TU Berlin" vs "TU Munich").

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

interface Palette {
  from: string;
  via: string;
  to: string;
}

// A curated set of gradients tuned to match the app's blue-forward palette
// while giving every card a recognisable identity. Order matters only for
// stability — don't reshuffle without a migration for saved screenshots.
const GRADIENTS: readonly Palette[] = [
  { from: '#1e40af', via: '#2563eb', to: '#38bdf8' }, // blue → sky
  { from: '#7c3aed', via: '#a855f7', to: '#ec4899' }, // violet → pink
  { from: '#c2410c', via: '#ea580c', to: '#f59e0b' }, // orange → amber
  { from: '#047857', via: '#10b981', to: '#4ade80' }, // emerald
  { from: '#0f766e', via: '#14b8a6', to: '#22d3ee' }, // teal → cyan
  { from: '#b91c1c', via: '#ef4444', to: '#fb923c' }, // red → orange
  { from: '#4338ca', via: '#6366f1', to: '#8b5cf6' }, // indigo → violet
  { from: '#0369a1', via: '#0ea5e9', to: '#67e8f9' }, // sky
  { from: '#a16207', via: '#eab308', to: '#facc15' }, // yellow
  { from: '#831843', via: '#be185d', to: '#f472b6' }, // rose
];

/**
 * Two-letter initials. Prefer the first letter of the first two significant
 * words (skipping generic tokens like "University", "of", "the") so
 * "Technical University of Munich" → "TM", not "TU".
 */
function computeInitials(name: string): string {
  const stopwords = new Set(['university', 'universität', 'of', 'the', 'and', 'für', 'de']);
  const words = name
    .replace(/\(.*?\)/g, ' ')
    .split(/[\s\-–—]+/)
    .filter((w) => w.length > 0 && !stopwords.has(w.toLowerCase()));

  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export interface UniversityAvatarProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
  /** Rendered as the visible letter mark when no logo is available */
  initials?: string;
}

/** Full-bleed gradient panel with initials. Sits inside the parent card. */
export function UniversityAvatar({ name, logoUrl, className, initials }: UniversityAvatarProps) {
  const hash = fnv1aHash(name);
  const palette = GRADIENTS[hash % GRADIENTS.length];
  const letters = initials ?? computeInitials(name);
  // Rotate the gradient axis so each card feels distinct even when the
  // palette repeats
  const rotation = (hash >> 8) % 360;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden text-white',
        className
      )}
      style={{
        backgroundImage: `linear-gradient(${rotation}deg, ${palette.from} 0%, ${palette.via} 55%, ${palette.to} 100%)`,
      }}
      aria-hidden={logoUrl ? undefined : true}
    >
      {/* Decorative rings — kept subtle so they don't fight the initials */}
      <div className="pointer-events-none absolute -left-4 -top-6 h-24 w-24 rounded-full border-4 border-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -right-4 h-16 w-16 rounded-full border-4 border-white/10" />

      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          className="relative z-10 max-h-[60%] max-w-[70%] object-contain drop-shadow-sm"
        />
      ) : (
        <span
          className="relative z-10 select-none font-black tracking-tight drop-shadow-sm"
          style={{ fontSize: 'clamp(1.5rem, 5.5vw, 2.5rem)' }}
        >
          {letters}
        </span>
      )}
    </div>
  );
}
