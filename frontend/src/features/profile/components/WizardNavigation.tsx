import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WizardNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => Promise<void>;
  onSubmit: () => Promise<void>;
}

// ─── WizardNavigation ──────────────────────────────────────────────────────────
// Previous / Next / Submit button row.
// Pure presentation — receives all handlers from parent.

export function WizardNavigation({
  isFirstStep,
  isLastStep,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Previous
      </Button>

      {isLastStep ? (
        <Button
          type="button"
          variant="default"
          onClick={onSubmit}
          isLoading={isSubmitting}
          className="gap-2 bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 min-w-32"
        >
          {!isSubmitting && <CheckCircle className="w-4 h-4" aria-hidden="true" />}
          Submit Profile
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          onClick={onNext}
          disabled={isSubmitting}
          className="gap-2 min-w-28"
        >
          Next
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
