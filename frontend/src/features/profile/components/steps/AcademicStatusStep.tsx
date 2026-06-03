import { Control, Controller, FieldErrors } from 'react-hook-form';
import { GraduationCap, BookOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentProfileFormData, DegreeStatus } from '../../types';

interface AcademicStatusStepProps {
  control: Control<StudentProfileFormData>;
  errors: FieldErrors<StudentProfileFormData>;
}

interface StatusCardProps {
  value: DegreeStatus;
  selectedValue: DegreeStatus | undefined;
  onSelect: (value: DegreeStatus) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

// ─── StatusCard ────────────────────────────────────────────────────────────────
// Accessible radio-style selection card with visual feedback.

function StatusCard({ value, selectedValue, onSelect, icon, title, description }: StatusCardProps) {
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(value)}
      className={cn(
        'relative w-full text-left p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200',
            isSelected
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
          )}
        >
          {icon}
        </div>
        <div>
          <p
            className={cn(
              'font-semibold transition-colors duration-200',
              isSelected ? 'text-primary' : 'text-gray-800'
            )}
          >
            {title}
          </p>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── AcademicStatusStep ────────────────────────────────────────────────────────
// Step 2: Degree Status — Completed vs Ongoing.
// Uses card-based radio selection instead of a dropdown for better UX.

export function AcademicStatusStep({ control }: AcademicStatusStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          What is your current academic status?
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          This determines which academic fields you&apos;ll need to fill in.
        </p>
      </div>

      <Controller
        name="degreeStatus"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <div
              role="radiogroup"
              aria-label="Degree status"
              aria-describedby={fieldState.error ? 'degreeStatus-error' : undefined}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <StatusCard
                value="completed"
                selectedValue={field.value}
                onSelect={(v) => field.onChange(v)}
                icon={<GraduationCap className="w-6 h-6" aria-hidden="true" />}
                title="Degree Completed"
                description="I have already completed my degree and have my final results."
              />
              <StatusCard
                value="ongoing"
                selectedValue={field.value}
                onSelect={(v) => field.onChange(v)}
                icon={<Clock className="w-6 h-6" aria-hidden="true" />}
                title="Degree Ongoing"
                description="I am currently studying and haven't graduated yet."
              />
            </div>
            {fieldState.error && (
              <p
                id="degreeStatus-error"
                role="alert"
                className="mt-2 text-sm text-red-600 flex items-center gap-1"
              >
                <span aria-hidden="true">⚠</span>
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Informational note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-blue-700">
          German universities typically accept both completed and ongoing degree holders. Students
          in their final year often apply with expected results.
        </p>
      </div>
    </div>
  );
}
