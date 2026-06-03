import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperStep {
  id: number;
  title: string;
  description?: string;
  icon?: LucideIcon;
}

interface StepperProps {
  steps: readonly StepperStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

type StepState = 'completed' | 'active' | 'upcoming';

function getStepState(stepId: number, currentStep: number): StepState {
  if (stepId < currentStep) return 'completed';
  if (stepId === currentStep) return 'active';
  return 'upcoming';
}

const stepStateStyles: Record<StepState, string> = {
  completed: 'bg-primary border-primary text-white',
  active: 'bg-white border-primary text-primary ring-4 ring-primary/20',
  upcoming: 'bg-white border-gray-300 text-gray-400',
};

const connectorStyles: Record<'completed' | 'upcoming', string> = {
  completed: 'bg-primary',
  upcoming: 'bg-gray-200',
};

export const Stepper = ({ steps, currentStep, onStepClick, className }: StepperProps) => {
  return (
    <nav aria-label="Wizard progress" className={cn('w-full', className)}>
      <ol className="flex items-start justify-between relative">
        {steps.map((step, index) => {
          const state = getStepState(step.id, currentStep);
          const isClickable = state === 'completed' && onStepClick;
          const isLast = index === steps.length - 1;
          const StepIcon = step.icon;

          return (
            <li
              key={step.id}
              className={cn('flex flex-col items-center relative', isLast ? 'flex-none' : 'flex-1')}
            >
              {/* Connector line (after all but last step) */}
              {!isLast && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      connectorStyles[state === 'completed' ? 'completed' : 'upcoming']
                    )}
                  />
                </div>
              )}

              {/* Step circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                aria-current={state === 'active' ? 'step' : undefined}
                aria-label={`${step.title}${state === 'completed' ? ' (completed)' : state === 'active' ? ' (current)' : ' (upcoming)'}`}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all duration-300 z-10',
                  stepStateStyles[state],
                  isClickable && 'cursor-pointer hover:ring-4 hover:ring-primary/20',
                  !isClickable && 'cursor-default'
                )}
              >
                {state === 'completed' ? (
                  <Check className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
                ) : StepIcon ? (
                  <StepIcon className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <span>{step.id + 1}</span>
                )}
              </button>

              {/* Step label */}
              <div className="mt-2 text-center max-w-[80px]">
                <p
                  className={cn(
                    'text-xs font-semibold leading-tight transition-colors duration-300',
                    state === 'active' && 'text-primary',
                    state === 'completed' && 'text-gray-700',
                    state === 'upcoming' && 'text-gray-400'
                  )}
                >
                  {step.title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
