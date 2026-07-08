import {cn} from '@/lib/utils';
import {type ReactNode} from 'react';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary-light text-primary dark:bg-amber-950/30 dark:text-amber-400',
  success: 'bg-success-light text-success dark:bg-emerald-950/30 dark:text-emerald-400',
  warning: 'bg-warning-light text-warning dark:bg-orange-950/30 dark:text-orange-400',
  danger: 'bg-danger-light text-danger dark:bg-rose-950/30 dark:text-rose-400',
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
};

export function Badge({variant = 'neutral', children, className}: BadgeProps) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-bold',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
