import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
}

export const Select = ({
  label,
  error,
  options,
  className,
  ...props
}: SelectProps) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <select
      className={cn(
        'w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors',
        error && 'border-red-500',
        className
      )}
      {...props}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);
