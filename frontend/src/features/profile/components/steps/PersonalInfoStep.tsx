import { Control, FieldErrors } from 'react-hook-form';
import { User } from 'lucide-react';
import { FormField } from '../FormField';
import { FormSection } from '../FormSection';
import type { StudentProfileFormData } from '../../types';
import { COUNTRIES } from '../../utils/constants';

interface PersonalInfoStepProps {
  control: Control<StudentProfileFormData>;
  errors: FieldErrors<StudentProfileFormData>;
}

// ─── PersonalInfoStep ──────────────────────────────────────────────────────────
// Step 1: Full Name, Email, Country
// Pure presentation — no business logic. All data flows via RHF control.

export function PersonalInfoStep({ control }: PersonalInfoStepProps) {
  return (
    <FormSection
      title="Tell us about yourself"
      description="This information helps us personalize your experience."
      icon={User}
    >
      <div className="md:col-span-2">
        <FormField
          name="fullName"
          control={control}
          label="Full Name"
          type="text"
          placeholder="e.g. Ahmad Ali"
          required
          description="As it appears on your passport"
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          name="email"
          control={control}
          label="Email Address"
          type="email"
          placeholder="your.email@example.com"
          required
          description="We'll use this to send you important updates"
        />
      </div>
      <div className="md:col-span-2">
        <FormField
          name="country"
          control={control}
          label="Country of Origin"
          type="select"
          options={COUNTRIES}
          placeholder="Select your country..."
          required
          description="Where you are currently based"
        />
      </div>
    </FormSection>
  );
}
