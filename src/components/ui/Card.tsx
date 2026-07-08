import {cn} from '@/lib/utils';
import {type ReactNode} from 'react';

type Accent = 'primary' | 'success' | 'warning' | 'danger';

interface CardProps {
  className?: string;
  borderAccent?: Accent;
  children: ReactNode;
}

const accentBorderStyles: Record<Accent, string> = {
  primary: 'border-b-4 border-b-primary',
  success: 'border-b-4 border-b-success',
  warning: 'border-b-4 border-b-warning',
  danger: 'border-b-4 border-b-danger',
};

export function Card({className, borderAccent, children}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-6 shadow-xs transition-shadow hover:shadow-md dark:bg-neutral-800',
        borderAccent && accentBorderStyles[borderAccent],
        className,
      )}
    >
      {children}
    </div>
  );
}
