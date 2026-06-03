import { forwardRef, SelectHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  readonly label: string;
  readonly value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  description?: string;
  options: readonly SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      description,
      options,
      placeholder = 'Select...',
      className,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${selectId}-error` : description ? `${selectId}-desc` : undefined
          }
          className={cn(
            'w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900',
            'focus:outline-none focus:border-primary transition-colors',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-400 focus:border-red-500',
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {description && !error && (
          <p id={`${selectId}-desc`} className="text-xs text-gray-500">
            {description}
          </p>
        )}
        {error && (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
