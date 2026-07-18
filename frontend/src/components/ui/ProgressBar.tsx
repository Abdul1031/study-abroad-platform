import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  showLabel?: boolean;
  /** Override the computed percentage — used by "Update Profile" flows to pin at 100%. */
  percentageOverride?: number;
}

export const ProgressBar = ({
  currentStep,
  totalSteps,
  className,
  showLabel = true,
  percentageOverride,
}: ProgressBarProps) => {
  // Progress measures how far the user has advanced through the flow, so
  // being ON the final step means 100% done. (currentStep / (totalSteps - 1))
  // — step 0 → 0%, last step → 100%. Old formula counted "step number as
  // fraction of total" which showed 0% on step 1 of 6 with everything filled.
  const denominator = Math.max(1, totalSteps - 1);
  const computed = Math.round((currentStep / denominator) * 100);
  const percentage = Math.min(
    100,
    Math.max(0, percentageOverride !== undefined ? percentageOverride : computed)
  );

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Progress
          </span>
          <span className="text-xs font-semibold text-primary">{percentage}%</span>
        </div>
      )}
      <div
        className="relative h-2 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
        {/* Shimmer effect */}
        <div
          className="absolute inset-y-0 rounded-full opacity-30"
          style={{
            width: `${percentage}%`,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
    </div>
  );
};
