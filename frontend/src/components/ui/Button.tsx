import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-blue-900 focus-visible:ring-primary',
        secondary:
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-200',
        outline:
          'border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-300',
        ghost:
          'hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-200',
      },
      size: {
        sm: 'h-9 px-3 py-2',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
}

export const Button = ({
  className,
  variant,
  size,
  ...props
}: ButtonProps) => (
  <button
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
);
