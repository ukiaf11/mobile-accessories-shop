import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToastStore, type Toast, type ToastTone } from '../../store/toastStore';
import { useMotionPreference } from '../../hooks/useMotionPreference';

const TONE_ICON: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent-strong',
};

const DISMISS_MS = 4200;

function ToastRow({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = TONE_ICON[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-line bg-surface/95 p-3.5 shadow-[var(--shadow-lift)]"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${TONE_CLASS[toast.tone]}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs text-muted">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="grid size-6 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-surface-soft hover:text-ink"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const { reduced } = useMotionPreference();

  return createPortal(
    <div
      // `polite` so a toast never interrupts what the user is doing.
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-200 mx-auto flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2 sm:inset-x-auto sm:right-5 sm:mx-0"
    >
      <ul className="contents">
        {reduced ? (
          toasts.map((toast) => <ToastRow key={toast.id} toast={toast} />)
        ) : (
          <AnimatePresence initial={false}>
            {toasts.map((toast) => <ToastRow key={toast.id} toast={toast} />)}
          </AnimatePresence>
        )}
      </ul>
    </div>,
    document.body,
  );
}
