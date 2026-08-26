import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { useOverlayBehaviour } from '../../hooks/useOverlayBehaviour';
import { useMotionPreference } from '../../hooks/useMotionPreference';

/**
 * One accessible dialog shell behind both the modal and the drawer.
 * Renders through a portal so a dialog is never clipped by a transformed ancestor.
 */

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hidden from view but read out; use when the visible heading is custom. */
  hideTitle?: boolean;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** `drawer` slides in from the right on desktop and up from the bottom on mobile. */
  variant?: 'drawer' | 'modal';
  className?: string;
}

export function Overlay({
  open, onClose, title, hideTitle, description, children, footer, variant = 'drawer', className,
}: OverlayProps) {
  const containerRef = useOverlayBehaviour(open, onClose);
  const { reduced } = useMotionPreference();
  const titleId = useId();
  const descriptionId = useId();

  const panelMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : variant === 'drawer'
      ? {
          initial: { x: '100%' },
          animate: { x: 0 },
          exit: { x: '100%' },
          transition: { type: 'spring' as const, damping: 32, stiffness: 320 },
        }
      : {
          initial: { opacity: 0, scale: 0.96, y: 16 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.97, y: 8 },
          transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
        };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex" role="presentation">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            {...panelMotion}
            className={cn(
              'relative z-10 flex flex-col bg-surface shadow-2xl outline-none',
              variant === 'drawer'
                ? 'ml-auto h-full w-full max-w-lg sm:rounded-l-3xl'
                : 'm-auto max-h-[92dvh] w-[min(56rem,calc(100vw-2rem))] rounded-3xl',
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className={cn(
                    'text-lg font-bold text-ink',
                    hideTitle && 'sr-only',
                  )}
                >
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-0.5 text-sm text-muted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title.toLowerCase()}`}
                className="-mr-1 grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {children}
            </div>

            {footer && (
              <footer className="border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
