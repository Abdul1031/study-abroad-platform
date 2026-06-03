import { useCallback, useState } from 'react';
import type { WizardState, WizardActions } from '../types';
import { WIZARD_STEPS } from '../utils/constants';

const TOTAL_STEPS = WIZARD_STEPS.length;

// ─── useProfileWizard ─────────────────────────────────────────────────────────
// Manages wizard step navigation state.
// Does NOT handle validation — that responsibility lives in useProfileForm.
// This separation ensures single responsibility.

interface UseProfileWizardReturn extends WizardState, WizardActions {}

export function useProfileWizard(initialStep = 0): UseProfileWizardReturn {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  const goToNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === TOTAL_STEPS - 1,
    goToNext,
    goToPrevious,
    goToStep,
  };
}
