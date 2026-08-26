import { motion } from 'framer-motion';
import { Check, Copy, MessageCircle, Phone } from 'lucide-react';
import { useState } from 'react';
import { shop } from '../../config/shop';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { Button } from '../ui/Button';

/**
 * Blueprint FR-11 / 03 section 15: a polished success state, never a browser alert,
 * and language that does not promise an accepted or paid order (05 section 8).
 */
export function SuccessState({
  requestId, kind, onClose,
}: {
  requestId: string;
  kind: 'order' | 'custom';
  onClose: () => void;
}) {
  const { reduced } = useMotionPreference();
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions; the id is visible on screen anyway.
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <motion.span
        aria-hidden
        initial={reduced ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        className="grid size-16 place-items-center rounded-full bg-success-soft text-success"
      >
        <motion.svg viewBox="0 0 24 24" fill="none" className="size-8">
          <motion.path
            d="M4 12.5l5.2 5.2L20 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.span>

      <h3 className="mt-5 text-xl font-extrabold">Request received</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {kind === 'order'
          ? 'Your requirement has been sent to the shop. Please keep your phone available — we will confirm availability and the final price shortly.'
          : 'Your custom requirement has been sent to the shop. We will check what is available for your exact model and call you back.'}
      </p>

      <div className="mt-6 w-full max-w-xs rounded-2xl border border-line bg-surface-soft p-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Request ID</p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <p className="font-mono text-lg font-bold text-ink">{requestId}</p>
          <button
            type="button"
            onClick={copyId}
            aria-label="Copy request ID"
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-accent-strong"
          >
            {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          </button>
        </div>
        <p aria-live="polite" className="mt-1 h-4 text-[11px] text-success">
          {copied ? 'Copied' : ''}
        </p>
        <p className="text-[11px] text-muted">Quote this when you call or visit.</p>
      </div>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
        <a
          href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`Hi, I just sent request ${requestId}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-success text-sm font-semibold text-white transition-[filter] hover:brightness-95"
        >
          <MessageCircle className="size-4" aria-hidden />
          Message on WhatsApp
        </a>
        <a
          href={`tel:+${shop.phoneDigits}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-strong"
        >
          <Phone className="size-4" aria-hidden />
          Call {shop.phone}
        </a>
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
