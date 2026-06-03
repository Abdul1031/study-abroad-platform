import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export const Card = ({ children, className, ...props }: CardProps) => (
  <div
    className={cn('bg-white rounded-xl border border-gray-200 p-6 shadow-sm', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className, ...props }: CardProps) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, as: Tag = 'h2', ...props }: CardTitleProps) => (
  <Tag className={cn('text-xl font-bold text-gray-900', className)} {...props}>
    {children}
  </Tag>
);

export const CardContent = ({ children, className, ...props }: CardProps) => (
  <div className={cn('space-y-4', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }: CardProps) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-100', className)} {...props}>
    {children}
  </div>
);
