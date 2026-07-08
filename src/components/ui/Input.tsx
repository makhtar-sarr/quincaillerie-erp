import {cn} from '@/lib/utils';
import {type InputHTMLAttributes, type ReactNode} from 'react';

type Variant = 'default' | 'search';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: Variant;
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  variant = 'default',
  label,
  error,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasIcon = variant === 'search' && icon;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-surface px-3 py-2.5 text-foreground focus:outline-hidden focus:ring-2 min-h-[44px]',
            'border-border focus:ring-primary dark:bg-neutral-800 dark:text-neutral-100',
            hasIcon && 'pl-10',
            error && 'border-danger focus:ring-danger',
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
