import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CustomRequestPayload, DeviceType, Fulfillment } from '../../types';
import { customerSchema, fulfillmentSchema, LIMITS } from '../../../shared/validation';
import { brands } from '../../data/brands';
import { devicesForBrand } from '../../data/devices';
import { useUiStore } from '../../store/uiStore';
import { generateRequestId } from '../../lib/request-id';
import { track } from '../../lib/analytics';
import { useSubmitRequest } from '../../hooks/useSubmitRequest';
import { Button } from '../ui/Button';
import { Honeypot, SelectField, TextArea, TextField } from '../ui/Field';
import { Overlay } from '../ui/Overlay';
import { FormSectionHeading, FulfillmentChoice, SubmitError } from './RequestFormParts';
import { SuccessState } from './SuccessState';

/**
 * Custom request. Blueprint FR-09 and 03 section 11 — this is a first-class path for
 * "I know exactly what I want and you do not list it", not an error fallback.
 */

const OTHER = '__other__';

const formSchema = z.object({
  customer: customerSchema,
  brandId: z.string().min(1, 'Please choose a brand, or pick “Other / not listed”.'),
  modelId: z.string().optional(),
  otherModel: z.string().max(80).optional(),
  deviceType: z.enum(['smartphone', 'tablet']),
  item: z.string().min(2, 'Tell us what you are looking for.').max(LIMITS.itemMax),
  quantity: z.coerce.number().int().min(LIMITS.quantityMin).max(LIMITS.quantityMax),
  description: z.string()
    .min(LIMITS.descriptionMin, 'Please describe the requirement in a little more detail.')
    .max(LIMITS.descriptionMax),
  fulfillment: fulfillmentSchema,
  address: z.string().max(LIMITS.addressMax).optional(),
  company: z.string().max(0).optional(),
}).superRefine((data, ctx) => {
  // A model is required one way or the other — either picked, or typed under "Other".
  if ((!data.modelId || data.modelId === OTHER) && !data.otherModel?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['otherModel'],
      message: 'Type the exact model name so we source the right fit.',
    });
  }
  if (data.fulfillment === 'delivery' && !data.address?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['address'],
      message: 'Please add a delivery address or switch to shop pickup.',
    });
  }
});

type FormValues = z.input<typeof formSchema>;

export function CustomRequestForm() {
  const { overlay, closeOverlay } = useUiStore();
  const submission = useSubmitRequest();
  const open = overlay === 'custom';

  const [requestId, setRequestId] = useState(() => generateRequestId());

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      deviceType: 'smartphone',
      fulfillment: 'pickup',
      quantity: 1,
      customer: { name: '', phone: '', email: '' },
    },
  });

  const brandId = watch('brandId');
  const modelId = watch('modelId');
  const deviceType = watch('deviceType') as DeviceType;
  const fulfillment = watch('fulfillment') as Fulfillment;

  const models = useMemo(
    () => (brandId && brandId !== OTHER ? devicesForBrand(brandId, deviceType) : []),
    [brandId, deviceType],
  );

  const needsTypedModel = !modelId || modelId === OTHER || brandId === OTHER;

  useEffect(() => {
    if (open) {
      setRequestId(generateRequestId());
      submission.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const lastValues = useRef<FormValues | null>(null);

  const buildPayload = (values: FormValues): CustomRequestPayload => {
    const brand = brands.find((entry) => entry.id === values.brandId);
    const model = models.find((entry) => entry.id === values.modelId);

    return {
      requestType: 'custom',
      customer: {
        name: values.customer.name as string,
        phone: values.customer.phone as string,
        email: (values.customer.email as string) || undefined,
      },
      device: {
        type: values.deviceType,
        brand: brand?.name ?? 'Other / not listed',
        model: model?.name ?? values.otherModel?.trim(),
        otherModel: model ? undefined : values.otherModel?.trim(),
      },
      item: values.item.trim(),
      quantity: Number(values.quantity),
      description: values.description.trim(),
      fulfillment: values.fulfillment,
      address: values.fulfillment === 'delivery' ? values.address?.trim() : undefined,
      requestId,
      company: values.company || undefined,
    };
  };

  const send = async (values: FormValues) => {
    lastValues.current = values;
    const result = await submission.sendCustom(buildPayload(values));
    if (result?.success) track('custom_request_submitted', {});
  };

  const retry = () => {
    if (lastValues.current) void send(lastValues.current);
  };

  const closeAndReset = () => {
    closeOverlay();
    if (submission.status === 'success') reset();
    submission.reset();
  };

  return (
    <Overlay
      open={open}
      onClose={closeAndReset}
      title={submission.status === 'success' ? 'Request sent' : 'Custom request'}
      description={
        submission.status === 'success'
          ? undefined
          : 'Tell us what you need. We check availability for your exact model.'
      }
    >
      {submission.status === 'success' && submission.requestId ? (
        <SuccessState requestId={submission.requestId} kind="custom" onClose={closeAndReset} />
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
              error={errors.customer?.phone?.message}
              {...register('customer.phone')}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.customer?.email?.message}
              {...register('customer.email')}
            />
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={2} title="Your device" />

            <SelectField
              label="Device type"
              required
              error={errors.deviceType?.message}
              {...register('deviceType')}
            >
              <option value="smartphone">Smartphone</option>
              <option value="tablet">Tablet</option>
            </SelectField>

            <SelectField
              label="Brand"
              required
              error={errors.brandId?.message}
              {...register('brandId', {
                onChange: () => setValue('modelId', undefined),
              })}
            >
              <option value="">Select a brand…</option>
              {brands.filter((brand) => brand.active).map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
              <option value={OTHER}>Other / not listed</option>
            </SelectField>

            {brandId && brandId !== OTHER && models.length > 0 && (
              <SelectField
                label="Model"
                hint="Cannot see it? Choose “Other” and type the exact name."
                error={errors.modelId?.message}
                {...register('modelId')}
              >
                <option value="">Select a model…</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
                <option value={OTHER}>Other / not listed</option>
              </SelectField>
            )}

            {needsTypedModel && (
              <TextField
                label="Exact model name"
                required
                placeholder="e.g. Samsung Galaxy A55 5G"
                hint="Copy it from Settings → About phone if you are unsure."
                error={errors.otherModel?.message}
                {...register('otherModel')}
              />
            )}
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={3} title="What do you need?" />
            <div className="grid gap-3.5 sm:grid-cols-[1fr_7rem]">
              <TextField
                label="Item you are looking for"
                required
                placeholder="e.g. Transparent camera-protection case"
                error={errors.item?.message}
                {...register('item')}
              />
              <TextField
                label="Quantity"
                required
                type="number"
                inputMode="numeric"
                min={LIMITS.quantityMin}
                max={LIMITS.quantityMax}
                error={errors.quantity?.message}
                {...register('quantity')}
              />
            </div>

            <TextArea
              label="Describe the requirement"
              required
              rows={4}
              maxLength={LIMITS.descriptionMax}
              placeholder="I need a transparent camera-protection case for Samsung Galaxy A55. I could not find the model in the catalog."
              hint="Colour, finish, brand preference, budget — anything that helps us get it right."
              error={errors.description?.message}
              {...register('description')}
            />
          </section>

          <section className="space-y-3.5">
            <FormSectionHeading step={4} title="Pickup or delivery" />
            <FulfillmentChoice
              name="custom-fulfillment"
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
              iconRight={<Send className="size-4" aria-hidden />}
            >
              Send Custom Request
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-subtle">
              Reference <span className="font-mono font-semibold">{requestId}</span> · We will
              confirm availability and price before ordering anything.
            </p>
          </div>
        </form>
      )}
    </Overlay>
  );
}
