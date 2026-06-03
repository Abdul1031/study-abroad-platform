import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { Languages, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField } from '../FormField';
import { FormSection } from '../FormSection';
import type { StudentProfileFormData, IeltsStatus } from '../../types';
import { IELTS_SCORE_OPTIONS } from '../../utils/constants';

interface EnglishProficiencyStepProps {
  control: Control<StudentProfileFormData>;
  errors: FieldErrors<StudentProfileFormData>;
}

interface IeltsStatusCardProps {
  value: IeltsStatus;
  selectedValue: IeltsStatus | undefined;
  onSelect: (value: IeltsStatus) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function IeltsStatusCard({
  value,
  selectedValue,
  onSelect,
  icon,
  title,
  description,
}: IeltsStatusCardProps) {
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(value)}
      className={cn(
        'relative w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200',
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
              'font-semibold text-sm transition-colors duration-200',
              isSelected ? 'text-primary' : 'text-gray-800'
            )}
          >
            {title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── EnglishProficiencyStep ────────────────────────────────────────────────────
// Step 4: English Proficiency
// IELTS Completed → show actual score
// IELTS Not Taken → show planned date + expected score

export function EnglishProficiencyStep({ control }: EnglishProficiencyStepProps) {
  const ieltsStatus = useWatch({ control, name: 'ieltsStatus' });
  const hasCompleted = ieltsStatus === 'completed';
  const hasNotTaken = ieltsStatus === 'not_taken';

  return (
    <div className="space-y-8">
      {/* IELTS Status Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Have you taken the IELTS exam?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Most German universities require IELTS 6.5+ for English-taught programs.
          </p>
        </div>

        <Controller
          name="ieltsStatus"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <div
                role="radiogroup"
                aria-label="IELTS status"
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <IeltsStatusCard
                  value="completed"
                  selectedValue={field.value}
                  onSelect={(v) => field.onChange(v)}
                  icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
                  title="IELTS Completed"
                  description="I have my official IELTS band score"
                />
                <IeltsStatusCard
                  value="not_taken"
                  selectedValue={field.value}
                  onSelect={(v) => field.onChange(v)}
                  icon={<Clock className="w-5 h-5" aria-hidden="true" />}
                  title="IELTS Not Taken Yet"
                  description="I plan to take IELTS in the future"
                />
              </div>
              {fieldState.error && (
                <p role="alert" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span aria-hidden="true">⚠</span>
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>

      {/* Conditional: IELTS Score (completed) */}
      {hasCompleted && (
        <FormSection
          title="Your IELTS Score"
          description="Enter your overall band score as reported on your certificate."
          icon={Languages}
        >
          <div className="md:col-span-2">
            <FormField
              name="ieltsScore"
              control={control}
              label="Overall IELTS Band Score"
              type="select"
              options={IELTS_SCORE_OPTIONS}
              placeholder="Select your score..."
              required
              description="Select your overall band score (0.0 – 9.0)"
            />
          </div>
        </FormSection>
      )}

      {/* Conditional: Planned IELTS (not taken) */}
      {hasNotTaken && (
        <FormSection
          title="IELTS Plans"
          description="Share your planned IELTS date and expected score."
          icon={Languages}
        >
          <FormField
            name="plannedIeltsDate"
            control={control}
            label="Planned IELTS Date"
            type="date"
            required
            description="When do you plan to take the IELTS exam?"
          />
          <FormField
            name="expectedIeltsScore"
            control={control}
            label="Expected IELTS Score"
            type="select"
            options={IELTS_SCORE_OPTIONS}
            placeholder="Select expected score..."
            required
            description="Your target overall band score"
          />
        </FormSection>
      )}

      {/* IELTS info note */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
        <Languages className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-amber-700">
          <p className="font-medium mb-1">IELTS Requirements</p>
          <p>
            Most German universities require an overall band score of <strong>6.5 or higher</strong>{' '}
            for English-taught Master&apos;s programs. Some programs may require 7.0+.
          </p>
        </div>
      </div>
    </div>
  );
}
