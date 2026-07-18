import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Save, AlertCircle, Pencil, X } from 'lucide-react';
import { Stepper } from '@/components/ui/Stepper';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useProfileForm } from '../hooks/useProfileForm';
import { WizardNavigation } from './WizardNavigation';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AcademicStatusStep } from './steps/AcademicStatusStep';
import { AcademicInfoStep } from './steps/AcademicInfoStep';
import { EnglishProficiencyStep } from './steps/EnglishProficiencyStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { ReviewStep } from './steps/ReviewStep';
import { WIZARD_STEPS, WIZARD_STEP_ICONS } from '../utils/constants';

// ─── Draft Banner ──────────────────────────────────────────────────────────────

interface DraftBannerProps {
  lastSavedAt: string;
  onClear: () => void;
}

function DraftBanner({ lastSavedAt, onClear }: DraftBannerProps) {
  const [visible, setVisible] = useState(true);
  const savedTime = new Date(lastSavedAt);
  const timeLabel = savedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm"
    >
      <div className="flex items-center gap-2 text-blue-700">
        <Save className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>Draft restored from {timeLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-blue-600 hover:text-blue-900 underline underline-offset-2"
        >
          Start fresh
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="text-blue-400 hover:text-blue-600 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Auto-Save Indicator ───────────────────────────────────────────────────────

interface AutoSaveIndicatorProps {
  lastSavedAt: string | null;
}

function AutoSaveIndicator({ lastSavedAt }: AutoSaveIndicatorProps) {
  if (!lastSavedAt) return null;
  const time = new Date(lastSavedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <Clock className="w-3 h-3" aria-hidden="true" />
      <span>Auto-saved at {time}</span>
    </div>
  );
}

// ─── Success Screen ────────────────────────────────────────────────────────────

function SuccessModal({ isUpdate }: { isUpdate: boolean }) {
  const navigate = useNavigate();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" aria-hidden="true" />
            </div>
            <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-30" />
          </div>
          <div>
            <h2 id="profile-success-title" className="text-2xl font-bold text-gray-900">
              {isUpdate ? 'Profile Updated!' : 'Profile Submitted!'}
            </h2>
            <p className="text-gray-500 mt-2">
              {isUpdate
                ? 'Your changes have been saved. We’ve refreshed your recommendations to reflect the new information.'
                : 'Your profile has been saved. We’ll use this information to match you with the best German universities and programs.'}
            </p>
          </div>
          <div className="flex flex-col w-full gap-3 pt-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate('/recommendations')}
            >
              View Matched Universities
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Renderer ─────────────────────────────────────────────────────────────

function renderStep(
  step: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any,
  onEditStep: (s: number) => void
) {
  const { control, formState, getValues } = form;
  const { errors } = formState;

  switch (step) {
    case 0:
      return <PersonalInfoStep control={control} errors={errors} />;
    case 1:
      return <AcademicStatusStep control={control} errors={errors} />;
    case 2:
      return <AcademicInfoStep control={control} errors={errors} />;
    case 3:
      return <EnglishProficiencyStep control={control} errors={errors} />;
    case 4:
      return <PreferencesStep control={control} errors={errors} />;
    case 5:
      return <ReviewStep getValues={getValues} onEditStep={onEditStep} />;
    default:
      return null;
  }
}

// ─── Stepper Steps ─────────────────────────────────────────────────────────────

const stepperSteps = WIZARD_STEPS.map((step, i) => ({
  id: step.id,
  title: step.title,
  description: step.description,
  icon: WIZARD_STEP_ICONS[i],
}));

// ─── ProfileWizard ─────────────────────────────────────────────────────────────
// Main orchestrator component. Renders step header, stepper, progress bar,
// current step content, and navigation controls.
// All logic is in useProfileForm — this component is purely structural.

export function ProfileWizard() {
  const {
    form,
    wizard,
    draft,
    isCompletedProfile,
    submitState,
    handleNext,
    handlePrevious,
    handleGoToStep,
    handleSubmit,
  } = useProfileForm();

  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // The draft banner is meaningful only when *unsaved* work was recovered
  // from localStorage. Once the server-saved profile has been hydrated the
  // banner is misleading (users read "Draft restored" as "you have unsaved
  // changes"), so suppress it in Update mode.
  useEffect(() => {
    if (!draft.isRestoring && draft.hasDraft && draft.lastSavedAt && !isCompletedProfile) {
      setShowDraftBanner(true);
    } else {
      setShowDraftBanner(false);
    }
  }, [draft.isRestoring, draft.hasDraft, draft.lastSavedAt, isCompletedProfile]);

  const handleClearDraft = async () => {
    await draft.clearDraft();
    form.reset();
    setShowDraftBanner(false);
  };

  const currentStepMeta = WIZARD_STEPS[wizard.currentStep];
  const isSubmitting = submitState.status === 'submitting';

  // Loading state while restoring draft
  if (draft.isRestoring) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading your saved profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Update-mode banner replaces the draft banner when we're editing an
          existing profile — different meaning, different action. */}
      {isCompletedProfile && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-800"
        >
          <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            You&apos;re editing your saved profile. Click any step in the stepper to jump straight
            to it.
          </span>
        </div>
      )}

      {/* Draft banner (only shown for in-progress drafts) */}
      {showDraftBanner && draft.lastSavedAt && (
        <DraftBanner lastSavedAt={draft.lastSavedAt} onClear={handleClearDraft} />
      )}

      {/* Stepper */}
      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <Stepper
            steps={stepperSteps}
            currentStep={wizard.currentStep}
            onStepClick={handleGoToStep}
          />
          <div className="mt-5">
            <ProgressBar
              currentStep={wizard.currentStep}
              totalSteps={wizard.totalSteps}
              // Saved profiles are 100% by definition — the wizard is now
              // an editor, not a fill-in-the-blanks flow.
              percentageOverride={isCompletedProfile ? 100 : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardContent className="p-5 sm:p-8">
          {/* Step header */}
          <div className="mb-6 pb-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  <span
                    className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    {wizard.currentStep + 1}
                  </span>
                  Step {wizard.currentStep + 1} of {wizard.totalSteps}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{currentStepMeta?.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{currentStepMeta?.description}</p>
              </div>
              <AutoSaveIndicator lastSavedAt={draft.lastSavedAt} />
            </div>
          </div>

          {/* Step component */}
          <div
            ref={contentRef}
            className={cn(
              'transition-opacity duration-200',
              isSubmitting && 'opacity-50 pointer-events-none'
            )}
          >
            {renderStep(wizard.currentStep, form, handleGoToStep)}
          </div>

          {/* Submit error */}
          {submitState.status === 'error' && submitState.error && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {submitState.error}
            </div>
          )}

          {/* Navigation */}
          <WizardNavigation
            isFirstStep={wizard.isFirstStep}
            isLastStep={wizard.isLastStep}
            isSubmitting={isSubmitting}
            isUpdateMode={isCompletedProfile}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      {/* Success Modal Overlay */}
      {submitState.status === 'success' && <SuccessModal isUpdate={isCompletedProfile} />}
    </div>
  );
}
