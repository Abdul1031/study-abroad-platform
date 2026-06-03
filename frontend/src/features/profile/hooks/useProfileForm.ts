import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileService } from '../services/profileService';
import { studentProfileSchema, stepSchemas } from '../schemas';
import { useProfileWizard } from './useProfileWizard';
import { useProfileDraft } from './useProfileDraft';
import type { StudentProfileFormData, SubmitState, WizardState, WizardActions } from '../types';
import { useState } from 'react';

// ─── useProfileForm ────────────────────────────────────────────────────────────
// Orchestrator hook — composes useForm + useProfileWizard + useProfileDraft.
// This is the single hook that the ProfileWizard page component imports.
// Handles: validation per step, draft persistence, submission.

interface UseProfileFormReturn {
  form: ReturnType<typeof useForm<StudentProfileFormData>>;
  wizard: WizardState & WizardActions;
  draft: {
    hasDraft: boolean;
    lastSavedAt: string | null;
    isRestoring: boolean;
    clearDraft: () => Promise<void>;
  };
  submitState: SubmitState;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  handleGoToStep: (step: number) => void;
  handleSubmit: () => Promise<void>;
}

export function useProfileForm(): UseProfileFormReturn {
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  // RHF with Zod resolver for full schema (final submit validation)
  const form = useForm<StudentProfileFormData>({
    resolver: zodResolver(studentProfileSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      country: '',
      degreeStatus: undefined,
      degree: undefined,
      specialization: '',
      finalCgpa: undefined,
      currentSemester: undefined,
      expectedGraduationDate: '',
      expectedCgpa: undefined,
      ieltsStatus: undefined,
      ieltsScore: undefined,
      plannedIeltsDate: '',
      expectedIeltsScore: undefined,
      preferredIntake: undefined,
      preferredCourse: '',
      budget: undefined,
    },
  });

  // Draft persistence
  const { hasDraft, lastSavedAt, isRestoring, loadedDraft, saveDraft, clearDraft } =
    useProfileDraft();

  // Wizard step navigation
  const wizardNav = useProfileWizard(0);

  // Restore saved draft into form on initial load
  useEffect(() => {
    if (!isRestoring && loadedDraft) {
      form.reset({ ...form.getValues(), ...loadedDraft.data });
      wizardNav.goToStep(loadedDraft.currentStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestoring]);

  // Auto-save draft whenever form values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      saveDraft(values as Partial<StudentProfileFormData>, wizardNav.currentStep);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft, wizardNav.currentStep]);

  // ─── Step Validation ────────────────────────────────────────────────────────
  // Only validates fields relevant to the current step before advancing.
  // This prevents blocking the user on irrelevant errors.

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const { currentStep } = wizardNav;

    // Review step (last) has no validation
    if (currentStep >= stepSchemas.length) return true;

    const stepSchema = stepSchemas[currentStep as 0 | 1 | 2 | 3 | 4];
    const currentValues = form.getValues();

    const result = stepSchema.safeParse(currentValues);

    if (!result.success) {
      // Map Zod errors to RHF errors for the relevant fields
      result.error.errors.forEach((err) => {
        const fieldName = err.path.join('.') as keyof StudentProfileFormData;
        form.setError(fieldName, {
          type: 'validation',
          message: err.message,
        });
      });
      return false;
    }

    return true;
  }, [wizardNav, form]);

  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      wizardNav.goToNext();
      // Scroll to top on step change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [validateCurrentStep, wizardNav]);

  const handlePrevious = useCallback(() => {
    wizardNav.goToPrevious();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [wizardNav]);

  const handleGoToStep = useCallback(
    (step: number) => {
      // Only allow going to completed steps
      if (step < wizardNav.currentStep) {
        wizardNav.goToStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [wizardNav]
  );

  // ─── Form Submit ────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSubmitState({ status: 'submitting' });

    try {
      const values = form.getValues();
      const result = studentProfileSchema.safeParse(values);

      if (!result.success) {
        // Should not happen if step validation is correct, but be defensive
        result.error.errors.forEach((err) => {
          const fieldName = err.path.join('.') as keyof StudentProfileFormData;
          form.setError(fieldName, { type: 'validation', message: err.message });
        });
        setSubmitState({
          status: 'error',
          error: 'Please complete all required fields.',
        });
        return;
      }

      await profileService.submitProfile(result.data);
      await clearDraft();
      setSubmitState({ status: 'success' });
    } catch {
      setSubmitState({
        status: 'error',
        error: 'Something went wrong. Please try again.',
      });
    }
  }, [form, clearDraft]);

  return {
    form,
    wizard: {
      currentStep: wizardNav.currentStep,
      totalSteps: wizardNav.totalSteps,
      isFirstStep: wizardNav.isFirstStep,
      isLastStep: wizardNav.isLastStep,
      goToNext: wizardNav.goToNext,
      goToPrevious: wizardNav.goToPrevious,
      goToStep: wizardNav.goToStep,
    },
    draft: { hasDraft, lastSavedAt, isRestoring, clearDraft },
    submitState,
    handleNext,
    handlePrevious,
    handleGoToStep,
    handleSubmit,
  };
}
