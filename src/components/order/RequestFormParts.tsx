import { AlertTriangle, Phone, RefreshCw, Store, Truck } from 'lucide-react';
import type { Fulfillment } from '../../types';
import { shop } from '../../config/shop';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

/** Pieces shared by the order form and the custom request form. */

export function FulfillmentChoice({
  value, onChange, name,
}: {
  value: Fulfillment;
  onChange: (value: Fulfillment) => void;
  name: string;
}) {
  const options: Array<{ id: Fulfillment; label: string; hint: string; icon: typeof Store }> = [
    { id: 'pickup', label: 'Shop pickup', hint: 'Collect from the shop', icon: Store },
    { id: 'delivery', label: 'Local delivery', hint: shop.deliveryNote, icon: Truck },
  ];

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">How would you like it?</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options
          .filter((option) => option.id === 'pickup' || shop.deliveryEnabled)
          .map(({ id, label, hint, icon: Icon }) => {
            const active = value === id;
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                  active
                    ? 'border-accent bg-accent-soft'
                    : 'border-line-strong bg-surface hover:border-accent-ring',
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={id}
                  checked={active}
                  onChange={() => onChange(id)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{hint}</span>
                </span>
              </label>
            );
          })}
      </div>
    </fieldset>
  );
}

/**
 * Failure banner. Blueprint 03 section 15 and 05 section 10: say what failed, keep the
 * typed data, offer a retry, and always give a phone fallback so the sale is not lost.
 */
export function SubmitError({
  message, code, onRetry, retrying,
}: {
  message: string;
  code: string | null;
  onRetry: () => void;
  retrying: boolean;
}) {
  const canRetry = code !== 'validation_error';

  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft/60 p-4">
      <p className="flex items-start gap-2.5 text-sm font-semibold text-danger">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message}</span>
      </p>

      <p className="mt-2 pl-6.5 text-xs text-muted">
        Nothing you typed has been lost.{' '}
        {canRetry ? 'Try again, or call the shop directly.' : 'Please correct the fields above.'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 pl-6.5">
        {canRetry && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onRetry}
            loading={retrying}
            iconLeft={<RefreshCw className="size-3.5" aria-hidden />}
          >
            Try again
          </Button>
        )}
        <a
          href={`tel:+${shop.phoneDigits}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-strong"
        >
          <Phone className="size-3.5" aria-hidden />
          Call {shop.phone}
        </a>
      </div>
    </div>
  );
}

export function FormSectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-bold text-ink">
      <span
        aria-hidden
        className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-black text-accent-strong"
      >
        {step}
      </span>
      {title}
    </h3>
  );
}
