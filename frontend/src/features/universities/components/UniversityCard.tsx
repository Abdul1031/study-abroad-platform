import { motion } from 'framer-motion';
import { MapPin, Euro, Star, Bookmark } from 'lucide-react';
import type { University } from '../types/university-filters.types';
import { UniversityAvatar } from './UniversityAvatar';

interface UniversityCardProps {
  university: University;
  onViewDetails: (id: string) => void;
  onSave: (id: string) => void;
  isSaved?: boolean;
}

const typeColors: Record<string, string> = {
  UNIVERSITY: 'bg-blue-50 text-blue-700',
  TECHNICAL_UNIVERSITY: 'bg-orange-50 text-orange-700',
  APPLIED_SCIENCES: 'bg-purple-50 text-purple-700',
};

const typeLabels: Record<string, string> = {
  UNIVERSITY: 'University',
  TECHNICAL_UNIVERSITY: 'Technical University',
  APPLIED_SCIENCES: 'Applied Sciences',
};

export function UniversityCard({
  university,
  onViewDetails,
  onSave,
  isSaved = false,
}: UniversityCardProps) {
  const {
    name,
    city,
    state,
    type,
    ranking,
    tuitionFeeEuros,
    ieltsMinimum,
    logoUrl,
    hasStudentDormitory,
  } = university;

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col h-full"
    >
      {/* ── Header strip with hashed-gradient initials avatar ───────── */}
      <div className="relative">
        <UniversityAvatar name={name} logoUrl={logoUrl} className="h-32" />
        <button
          type="button"
          onClick={() => onSave(university.id)}
          className="absolute top-3 right-3 rounded-xl bg-white/20 p-2 backdrop-blur-sm transition hover:bg-white/30"
          title={isSaved ? 'Remove from saved' : 'Save university'}
        >
          <Bookmark size={16} className={`text-white ${isSaved ? 'fill-white' : ''}`} aria-hidden />
        </button>
        {ranking && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 backdrop-blur-sm">
            <Star size={12} className="fill-yellow-300 text-yellow-300" aria-hidden />
            <span className="text-xs font-bold text-white">#{ranking}</span>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Type badge */}
        <div className="mb-2">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-600'}`}
          >
            {typeLabels[type] ?? type}
          </span>
        </div>

        {/* Name & city */}
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2">{name}</h3>
        <p className="text-gray-400 text-xs flex items-center gap-1 mb-4">
          <MapPin size={12} />
          {city}
          {state ? `, ${state}` : ''}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-5 mt-auto">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-xs text-gray-400 mb-0.5">Tuition</p>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
              <Euro size={12} className="text-gray-500" />
              {tuitionFeeEuros === 0 ? 'Free' : tuitionFeeEuros ? `${tuitionFeeEuros}/sem` : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <p className="text-xs text-gray-400 mb-0.5">Min IELTS</p>
            <p className="text-sm font-semibold text-gray-800">{ieltsMinimum ?? 'N/A'}</p>
          </div>
          {hasStudentDormitory && (
            <div className="col-span-2 bg-green-50 rounded-xl p-2 flex items-center gap-2">
              <span className="text-green-600 text-xs font-medium">
                ✓ Student Dormitory Available
              </span>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={() => onViewDetails(university.id)}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
