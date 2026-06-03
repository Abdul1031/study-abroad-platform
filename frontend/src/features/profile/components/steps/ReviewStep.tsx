import { UseFormGetValues } from 'react-hook-form';
import { Edit2, User, GraduationCap, BookOpen, Languages, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentProfileFormData } from '../../types';
import { COUNTRIES } from '../../utils/constants';
import {
  formatBudget,
  formatCgpa,
  formatDate,
  formatDegreeStatus,
  formatDegreeType,
  formatIeltsScore,
  formatIeltsStatus,
  formatIntake,
} from '../../utils/formatters';

interface ReviewStepProps {
  getValues: UseFormGetValues<StudentProfileFormData>;
  onEditStep: (step: number) => void;
}

interface ReviewSectionProps {
  title: string;
  icon: React.ReactNode;
  stepIndex: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}

interface ReviewRowProps {
  label: string;
  value: string | undefined;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span
        className={cn(
          'text-sm font-medium text-right',
          value && value !== '—' ? 'text-gray-900' : 'text-gray-400'
        )}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

function ReviewSection({ title, icon, stepIndex, onEdit, children }: ReviewSectionProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
        </div>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-blue-900 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
          aria-label={`Edit ${title}`}
        >
          <Edit2 className="w-3 h-3" aria-hidden="true" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── ReviewStep ────────────────────────────────────────────────────────────────
// Step 6: Review all entered data before submission.
// Pure read-only display. Edit buttons navigate back to specific steps.

export function ReviewStep({ getValues, onEditStep }: ReviewStepProps) {
  const values = getValues();

  const countryLabel = COUNTRIES.find((c) => c.value === values.country)?.label ?? values.country;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Review Your Profile</h3>
        <p className="text-sm text-gray-500 mt-1">
          Please review all information before submitting. You can click <strong>Edit</strong> on
          any section to go back and make changes.
        </p>
      </div>

      {/* Personal Information */}
      <ReviewSection
        title="Personal Information"
        icon={<User className="w-4 h-4 text-primary" aria-hidden="true" />}
        stepIndex={0}
        onEdit={onEditStep}
      >
        <ReviewRow label="Full Name" value={values.fullName} />
        <ReviewRow label="Email" value={values.email} />
        <ReviewRow label="Country" value={countryLabel} />
      </ReviewSection>

      {/* Academic Status */}
      <ReviewSection
        title="Academic Status"
        icon={<GraduationCap className="w-4 h-4 text-primary" aria-hidden="true" />}
        stepIndex={1}
        onEdit={onEditStep}
      >
        <ReviewRow
          label="Degree Status"
          value={values.degreeStatus ? formatDegreeStatus(values.degreeStatus) : undefined}
        />
      </ReviewSection>

      {/* Academic Information */}
      <ReviewSection
        title="Academic Information"
        icon={<BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />}
        stepIndex={2}
        onEdit={onEditStep}
      >
        <ReviewRow
          label="Degree"
          value={values.degree ? formatDegreeType(values.degree) : undefined}
        />
        <ReviewRow label="Specialization" value={values.specialization} />

        {values.degreeStatus === 'completed' && (
          <ReviewRow label="Final CGPA" value={formatCgpa(values.finalCgpa)} />
        )}
        {values.degreeStatus === 'ongoing' && (
          <>
            <ReviewRow
              label="Current Semester"
              value={values.currentSemester ? `Semester ${values.currentSemester}` : undefined}
            />
            <ReviewRow
              label="Expected Graduation"
              value={formatDate(values.expectedGraduationDate ?? '')}
            />
            <ReviewRow label="Expected CGPA" value={formatCgpa(values.expectedCgpa)} />
          </>
        )}
      </ReviewSection>

      {/* English Proficiency */}
      <ReviewSection
        title="English Proficiency"
        icon={<Languages className="w-4 h-4 text-primary" aria-hidden="true" />}
        stepIndex={3}
        onEdit={onEditStep}
      >
        <ReviewRow
          label="IELTS Status"
          value={values.ieltsStatus ? formatIeltsStatus(values.ieltsStatus) : undefined}
        />
        {values.ieltsStatus === 'completed' && (
          <ReviewRow label="IELTS Score" value={formatIeltsScore(values.ieltsScore)} />
        )}
        {values.ieltsStatus === 'not_taken' && (
          <>
            <ReviewRow
              label="Planned IELTS Date"
              value={formatDate(values.plannedIeltsDate ?? '')}
            />
            <ReviewRow label="Expected Score" value={formatIeltsScore(values.expectedIeltsScore)} />
          </>
        )}
      </ReviewSection>

      {/* Preferences */}
      <ReviewSection
        title="Study Preferences"
        icon={<Settings2 className="w-4 h-4 text-primary" aria-hidden="true" />}
        stepIndex={4}
        onEdit={onEditStep}
      >
        <ReviewRow
          label="Preferred Intake"
          value={values.preferredIntake ? formatIntake(values.preferredIntake) : undefined}
        />
        <ReviewRow label="Preferred Course" value={values.preferredCourse} />
        <ReviewRow
          label="Annual Budget"
          value={values.budget ? formatBudget(values.budget) : undefined}
        />
      </ReviewSection>

      {/* Submission note */}
      <p className="text-xs text-gray-400 text-center pt-2">
        Your profile is saved automatically. Submitting will finalize it for university matching.
      </p>
    </div>
  );
}
