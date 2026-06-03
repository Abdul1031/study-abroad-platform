import { Control, FieldErrors, useWatch } from 'react-hook-form';
import { BookOpen, GraduationCap } from 'lucide-react';
import { FormField } from '../FormField';
import { FormSection } from '../FormSection';
import type { StudentProfileFormData } from '../../types';
import { DEGREE_OPTIONS, SEMESTER_OPTIONS } from '../../utils/constants';

interface AcademicInfoStepProps {
  control: Control<StudentProfileFormData>;
  errors: FieldErrors<StudentProfileFormData>;
}

// ─── AcademicInfoStep ──────────────────────────────────────────────────────────
// Step 3: Academic Information — conditionally renders fields based on degreeStatus.
// Completed path: Degree, Specialization, Final CGPA
// Ongoing path: Degree, Specialization, Current Semester, Expected Graduation, Expected CGPA

export function AcademicInfoStep({ control }: AcademicInfoStepProps) {
  // Watch degreeStatus to conditionally render fields
  const degreeStatus = useWatch({ control, name: 'degreeStatus' });
  const isCompleted = degreeStatus === 'completed';
  const isOngoing = degreeStatus === 'ongoing';

  return (
    <div className="space-y-8">
      {/* Common fields — degree + specialization */}
      <FormSection
        title="Degree Information"
        description="Tell us about your field of study."
        icon={BookOpen}
      >
        <div className="md:col-span-2">
          <FormField
            name="degree"
            control={control}
            label="Degree Type"
            type="select"
            options={DEGREE_OPTIONS}
            placeholder="Select your degree..."
            required
          />
        </div>
        <div className="md:col-span-2">
          <FormField
            name="specialization"
            control={control}
            label="Specialization / Major"
            type="text"
            placeholder="e.g. Computer Science, Mechanical Engineering"
            required
          />
        </div>
      </FormSection>

      {/* Conditional fields — completed degree */}
      {isCompleted && (
        <FormSection
          title="Final Results"
          description="Your academic results from your completed degree."
          icon={GraduationCap}
        >
          <FormField
            name="finalCgpa"
            control={control}
            label="Final CGPA"
            type="number"
            placeholder="e.g. 3.50"
            required
            min={0}
            max={4}
            step={0.01}
            description="Out of 4.0 scale. If your scale differs, convert accordingly."
          />
        </FormSection>
      )}

      {/* Conditional fields — ongoing degree */}
      {isOngoing && (
        <FormSection
          title="Current Progress"
          description="Your ongoing academic progress and expected completion."
          icon={GraduationCap}
        >
          <FormField
            name="currentSemester"
            control={control}
            label="Current Semester"
            type="select"
            options={SEMESTER_OPTIONS}
            placeholder="Select semester..."
            required
          />
          <FormField
            name="expectedGraduationDate"
            control={control}
            label="Expected Graduation Date"
            type="date"
            required
            description="Approximate date you expect to graduate"
          />
          <div className="md:col-span-2">
            <FormField
              name="expectedCgpa"
              control={control}
              label="Expected Final CGPA"
              type="number"
              placeholder="e.g. 3.50"
              required
              min={0}
              max={4}
              step={0.01}
              description="Your expected final CGPA out of 4.0"
            />
          </div>
        </FormSection>
      )}

      {/* No status selected */}
      {!degreeStatus && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mb-3" aria-hidden="true" />
          <p className="text-gray-500 text-sm">
            Please go back to Step 2 and select your degree status first.
          </p>
        </div>
      )}
    </div>
  );
}
