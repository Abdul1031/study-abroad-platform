import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => (
  <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }: CardProps) => (
  <div className={cn('mb-4', className)}>{children}</div>
);

export const CardTitle = ({
  children,
  className,
}: CardProps & { children: React.ReactNode }) => (
  <h2 className={cn('text-2xl font-bold text-gray-900', className)}>
    {children}
  </h2>
);

export const CardContent = ({ children, className }: CardProps) => (
  <div className={cn('space-y-4', className)}>{children}</div>
);
