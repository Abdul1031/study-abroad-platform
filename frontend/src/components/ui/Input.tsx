import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, ...props }: InputProps) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <input
      className={cn(
        'w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors',
        error && 'border-red-500',
        className
      )}
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);
