import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Fulfillment, OrderRequestPayload, ResolvedDevice } from '../../types';
import {
  customerSchema, fulfillmentSchema, LIMITS,
} from '../../../shared/validation';
import { cartTotals, useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { generateRequestId } from '../../lib/request-id';
import { formatPrice, pluralize } from '../../lib/format';
import { track } from '../../lib/analytics';
import { useSubmitRequest } from '../../hooks/useSubmitRequest';
import { Button } from '../ui/Button';
import { Honeypot, TextArea, TextField } from '../ui/Field';
import { Overlay } from '../ui/Overlay';
import { FormSectionHeading, FulfillmentChoice, SubmitError } from './RequestFormParts';
import { SuccessState } from './SuccessState';

/**
 * Order form. Blueprint FR-08 and 03 section 10: right-side drawer on desktop, full-screen
 * sheet on mobile, sections for customer / device / summary / fulfillment / notes / submit.
 *
 * The form schema is the shared customer schema plus the fields the customer actually types;
 * items, device and requestId are assembled at submit time from state the form does not own.
 */
const formSchema = z.object({
  customer: customerSchema,
  fulfillment: fulfillmentSchema,
  address: z.string().max(LIMITS.addressMax).optional(),
  notes: z.string().max(LIMITS.notesMax).optional(),
  deviceOverride: z.string().max(80).optional(),
  company: z.string().max(0).optional(),
}).superRefine((data, ctx) => {
  if (data.fulfillment === 'delivery' && !data.address?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['address'],
      message: 'Please add a delivery address or switch to shop pickup.',
    });
  }
});

type FormValues = z.input<typeof formSchema>;

export function OrderForm({ device }: { device: ResolvedDevice | null }) {
  const { overlay, closeOverlay } = useUiStore();
  const { items, clear } = useCartStore();
  const { count, subtotal, hasAskPrice } = cartTotals(items);
  const submission = useSubmitRequest();

  const open = overlay === 'order';

  // One request id per open form, reused across retries so a duplicate delivery
  // is collapsed server-side rather than emailing the shop twice.
  const [requestId, setRequestId] = useState(() => generateRequestId());

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: { fulfillment: 'pickup', customer: { name: '', phone: '', email: '' } },
  });

  const fulfillment = watch('fulfillment') as Fulfillment;

  useEffect(() => {
    if (open) {
      setRequestId(generateRequestId());
      submission.reset();
    }
    // `submission.reset` is stable; re-running on it would clear state mid-submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keeps the payload builder out of the submit handler so a retry reuses it verbatim.
  const lastValues = useRef<FormValues | null>(null);

  const buildPayload = (values: FormValues): OrderRequestPayload => ({
    requestType: 'order',
    customer: {
      name: values.customer.name as string,
      phone: values.customer.phone as string,
      email: (values.customer.email as string) || undefined,
    },
    device: device
      ? { type: device.type, brand: device.brandName, model: device.name }
      : { model: values.deviceOverride?.trim() || undefined },
    items: items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      variant: item.variantName,
      deviceName: item.deviceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    fulfillment: values.fulfillment,
    address: values.fulfillment === 'delivery' ? values.address?.trim() : undefined,
    notes: values.notes?.trim() || undefined,
    requestId,
    company: values.company || undefined,
  });

  const send = async (values: FormValues) => {
    lastValues.current = values;
    const result = await submission.sendOrder(buildPayload(values));
    if (result?.success) {
      track('order_submitted', { items: count, value: subtotal });
      clear();
    }
  };

  const retry = () => {
    if (lastValues.current) void send(lastValues.current);
  };

  const closeAndReset = () => {
    closeOverlay();
    // Only wipe the typed values once the request actually went through.
    if (submission.status === 'success') reset();
    submission.reset();
  };

  const summary = useMemo(
    () => (
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface-soft/60">
        {items.map((item) => (
          <li key={item.key} className="flex items-start justify-between gap-3 px-3.5 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="font-semibold text-ink">
                <span className="tabular-nums">{item.quantity} ×</span> {item.productName}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {[item.variantName, item.deviceName].filter(Boolean).join(' · ') || 'Model to confirm'}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-ink tabular-nums">
              {item.unitPrice === undefined ? 'Ask' : formatPrice(item.unitPrice * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
    ),
    [items],
  );

  return (
    <Overlay
      open={open}
      onClose={closeAndReset}
      title={submission.status === 'success' ? 'Request sent' : 'Send order request'}
      description={
        submission.status === 'success'
          ? undefined
          : `${count} ${pluralize(count, 'item')} · no payment taken`
      }
    >
      {submission.status === 'success' && submission.requestId ? (
        <SuccessState requestId={submission.requestId} kind="order" onClose={closeAndReset} />
      ) : (
        <form onSubmit={handleSubmit(send)} noValidate className="space-y-7">
          <Honeypot register={register('company')} />

          <section className="space-y-3.5">
            <FormSectionHeading step={1} title="Your details" />
            <TextField
              label="Full name"
              required
              autoComplete="name"
              placeholder="e.g. Rahul Kumar"
              data-autofocus
              error={errors.customer?.name?.message}
              {...register('customer.name')}
            />
            <TextField
              label="Mobile number"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 98765 43210"
              hint="We call this number to confirm availability."
              error={errors.customer?.phone?.message}
              {...register('customer.phone')}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              hint="Only if you want a written copy of the confirmation."
              error={errors.customer?.email?.message}
              {...register('customer.email')}
            />
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={2} title="Your device" />
            {device ? (
              <div className="rounded-xl border border-line bg-surface-soft/60 px-3.5 py-3">
                <p className="text-sm font-semibold text-ink">
                  {device.brandName} {device.name}
                </p>
                <p className="mt-0.5 text-xs text-muted capitalize">{device.type}</p>
              </div>
            ) : (
              <TextField
                label="Phone / tablet model"
                hint="You did not pick a model above — type it here so we send the right fit."
                placeholder="e.g. Samsung Galaxy A55"
                error={errors.deviceOverride?.message}
                {...register('deviceOverride')}
              />
            )}
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={3} title="Items" />
            {summary}
            <div className="flex items-baseline justify-between px-1 text-sm">
              <span className="text-muted">Estimated subtotal</span>
              <span className="font-extrabold text-ink tabular-nums">
                {hasAskPrice && <span className="mr-1 text-xs font-medium text-muted">from</span>}
                {formatPrice(subtotal, '—')}
              </span>
            </div>
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={4} title="Pickup or delivery" />
            <FulfillmentChoice
              name="fulfillment"
              value={fulfillment}
              onChange={(value) => setValue('fulfillment', value, { shouldValidate: true })}
            />
            {fulfillment === 'delivery' && (
              <TextArea
                label="Delivery address"
                required
                rows={3}
                autoComplete="street-address"
                placeholder="House / flat, street, area, landmark, pincode"
                error={errors.address?.message}
                {...register('address')}
              />
            )}
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={5} title="Anything else?" />
            <TextArea
              label="Notes for the shop"
              rows={3}
              maxLength={LIMITS.notesMax}
              placeholder="e.g. Please confirm if the privacy glass is in stock in matte."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </section>

          {submission.status === 'error' && submission.error && (
            <SubmitError
              message={submission.error}
              code={submission.code}
              onRetry={retry}
              retrying={submission.isSubmitting}
            />
          )}

          <div className="space-y-3 border-t border-line pt-5">
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submission.isSubmitting}
              loadingLabel="Sending to the shop…"
              disabled={items.length === 0}
              iconRight={<Send className="size-4" aria-hidden />}
            >
              Send Order Request
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-subtle">
              Reference <span className="font-mono font-semibold">{requestId}</span> · This sends
              your list to the shop. It is not a payment and not a confirmed order.
            </p>
          </div>
        </form>
      )}
    </Overlay>
  );
}
