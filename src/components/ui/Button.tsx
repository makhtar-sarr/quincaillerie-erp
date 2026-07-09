import {cn} from '@/lib/utils';
import {type ButtonHTMLAttributes, type ReactNode} from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'dark' | 'icon';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-primary hover:bg-primary-hover text-white hover:scale-[1.02]',
  secondary:
    'bg-white border-2 border-border hover:bg-neutral-50 text-foreground dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-800',
  danger:
    'bg-danger hover:bg-danger-hover text-white',
  success:
    'bg-success hover:bg-success-hover text-white hover:scale-[1.02]',
  dark:
    'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900',
  icon:
    'p-2 text-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-200 dark:hover:text-neutral-800',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-xl font-bold cursor-pointer transition-all',
        variantStyles[variant],
        variant !== 'icon' && sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
