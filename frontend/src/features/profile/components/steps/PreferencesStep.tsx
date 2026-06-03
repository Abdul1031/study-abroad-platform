import { Control, FieldErrors } from 'react-hook-form';
import { Settings2, Euro, Info } from 'lucide-react';
import { FormField } from '../FormField';
import { FormSection } from '../FormSection';
import type { StudentProfileFormData } from '../../types';
import { INTAKE_OPTIONS } from '../../utils/constants';

interface PreferencesStepProps {
  control: Control<StudentProfileFormData>;
  errors: FieldErrors<StudentProfileFormData>;
}

// ─── PreferencesStep ───────────────────────────────────────────────────────────
// Step 5: Study Preferences — Intake, Course, Budget.

export function PreferencesStep({ control }: PreferencesStepProps) {
  return (
    <div className="space-y-8">
      <FormSection
        title="Study Preferences"
        description="Tell us what you're looking for in your German study program."
        icon={Settings2}
      >
        <div className="md:col-span-2">
          <FormField
            name="preferredIntake"
            control={control}
            label="Preferred Intake Semester"
            type="select"
            options={INTAKE_OPTIONS}
            placeholder="Select preferred intake..."
            required
            description="German universities have two intakes: October (Winter) and April (Summer)"
          />
        </div>
        <div className="md:col-span-2">
          <FormField
            name="preferredCourse"
            control={control}
            label="Preferred Course / Program"
            type="text"
            placeholder="e.g. MSc Computer Science, MBA, MSc Electrical Engineering"
            required
            description="The program or field you wish to study in Germany"
          />
        </div>
      </FormSection>

      <FormSection
        title="Budget"
        description="Your estimated annual budget for studying in Germany."
        icon={Euro}
      >
        <div className="md:col-span-2">
          <FormField
            name="budget"
            control={control}
            label="Annual Budget (EUR)"
            type="number"
            placeholder="e.g. 15000"
            required
            min={0}
            step={500}
            description="Include tuition fees, living costs, and travel expenses"
          />
        </div>
      </FormSection>

      {/* Budget guidance note */}
      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
        <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-green-700">
          <p className="font-medium mb-1">Budget Guide for Germany</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Public universities: Low to no tuition fees (€0–€3,000/year)</li>
            <li>Living costs: approximately €10,000–€13,000/year</li>
            <li>
              Proof of funds required: <strong>€11,904/year</strong> for student visa (blocked
              account)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
