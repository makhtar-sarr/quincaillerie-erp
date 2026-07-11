import {type ReactNode, useRef, useEffect} from 'react';
import {AnimatePresence, motion} from 'motion/react';
import {X, type LucideIcon} from 'lucide-react';
import {cn} from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | '3xl' | '4xl';
type ModalVariant = 'default' | 'danger';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: LucideIcon;
  size?: ModalSize;
  variant?: ModalVariant;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

const headerGradients: Record<ModalVariant, string> = {
  default: 'bg-gradient-to-r from-primary to-primary-hover',
  danger: 'bg-gradient-to-r from-danger to-danger-hover',
};

const headerTextColors: Record<ModalVariant, string> = {
  default: 'text-neutral-950 dark:text-white',
  danger: 'text-white',
};

export function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  size = 'md',
  variant = 'default',
  children,
  footer,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Views pass an inline arrow for onClose (e.g. onClose={() => setIsOpen(false)}),
  // which gets a NEW identity on every parent render. Reading it through a ref
  // keeps effects from re-running (and stealing focus) on each re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Tracks the open transition so auto-focus fires ONCE on open, not on every render.
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }
    // Only auto-focus when the modal opens (false -> true). Re-rendering on each
    // keystroke must NOT re-trigger this, or focus gets yanked off the field being typed in.
    if (wasOpen.current) return;
    wasOpen.current = true;

    const timer = setTimeout(() => {
      const container = contentRef.current;
      if (!container) return;

      // Prefer the first form field over the header's close button.
      const field = container.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea'
      );
      const focusable =
        field ??
        container.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      focusable?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-950/40 dark:bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={contentRef}
            initial={{scale: 0.95, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0.95, opacity: 0}}
            transition={{duration: 0.15}}
            className={cn(
              'bg-surface rounded-2xl border border-border max-h-[90vh] overflow-hidden flex flex-col w-full',
              sizeStyles[size]
            )}
            style={{
              boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
            }}
          >
            <div
              className={cn(
                'flex items-center justify-between px-6 py-5 border-b',
                headerGradients[variant],
                headerTextColors[variant]
              )}
            >
              <h3 className="font-black font-display text-sm uppercase tracking-wider flex items-center gap-2">
                {Icon && <Icon className="h-5 w-5 stroke-[2.5]" />}
                {title}
              </h3>
              <button
                onClick={onClose}
                className={cn(
                  'cursor-pointer transition-colors',
                  headerTextColors[variant],
                  variant === 'default'
                    ? 'hover:text-neutral-800'
                    : 'hover:text-white/70'
                )}
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {footer && (
              <div className="p-6 border-t border-border">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
