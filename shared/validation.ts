import { z } from 'zod';

/**
 * Schemas shared verbatim by the browser form and the serverless handler.
 * The client uses them for UX; the server re-runs them because client validation
 * is not a security control (blueprint 08_SECURITY_TESTING_CHECKLIST.md section 2).
 */

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  notesMax: 1500,
  descriptionMin: 10,
  descriptionMax: 1500,
  itemMax: 160,
  addressMax: 400,
  quantityMin: 1,
  quantityMax: 20,
  maxLineItems: 40,
  /** Rejected before parsing; keeps a hostile body from reaching Zod. */
  maxBodyBytes: 32 * 1024,
} as const;

const trimmed = (schema: z.ZodString) => z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  schema,
);

export const nameSchema = trimmed(
  z.string()
    .min(LIMITS.nameMin, `Please enter at least ${LIMITS.nameMin} characters.`)
    .max(LIMITS.nameMax, `Please keep the name under ${LIMITS.nameMax} characters.`)
    .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u, 'Please use letters only.'),
);

/**
 * Accepts a 10-digit Indian mobile (optionally +91 / 0 prefixed) or a generic
 * international number of 8–15 digits. Deliberately permissive at the edges —
 * a wrong rejection costs the shop a real order.
 */
export const phoneSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.replace(/[\s()-]/g, '') : value),
  z.string()
    .min(8, 'Please enter a valid mobile number.')
    .max(16, 'Please enter a valid mobile number.')
    .regex(/^\+?\d+$/, 'Please enter a valid mobile number.')
    // E.164 allows at most 15 digits; below 8 it is a typo rather than a number.
    .refine((value) => {
      const digits = value.replace(/\D/g, '').length;
      return digits >= 8 && digits <= 15;
    }, 'Please enter a valid mobile number.')
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, '');
        const indian = digits.length === 10 ? digits
          : digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
          : digits.length === 11 && digits.startsWith('0') ? digits.slice(1)
          : null;
        // Only enforce the leading-digit rule when it really is an Indian number.
        return indian === null || /^[6-9]/.test(indian);
      },
      'Indian mobile numbers start with 6, 7, 8 or 9.',
    ),
);

export const optionalEmailSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.email('Please enter a valid email address.').max(160).optional(),
);

export const fulfillmentSchema = z.enum(['pickup', 'delivery']);

export const customerSchema = z.strictObject({
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
});

export const deviceSchema = z.strictObject({
  type: z.string().max(40).optional(),
  brand: z.string().max(60).optional(),
  model: z.string().max(80).optional(),
});

export const lineItemSchema = z.strictObject({
  productId: z.string().min(1).max(80),
  name: z.string().min(1).max(140),
  variant: z.string().max(80).optional(),
  deviceName: z.string().max(80).optional(),
  quantity: z.number().int().min(LIMITS.quantityMin).max(LIMITS.quantityMax),
  unitPrice: z.number().nonnegative().max(1_000_000).optional(),
});

/** Hidden field; a filled value means a bot walked the form. */
export const honeypotSchema = z.string().max(0, 'Rejected.').optional();

export const requestIdSchema = z.string().regex(
  /^MAS-\d{8}-[0-9A-HJ-KM-NP-TV-Z]{4}$/,
  'Invalid request reference.',
);

/** Delivery needs an address; pickup does not. Enforced identically on both sides. */
function requireAddressForDelivery<T extends { fulfillment: 'pickup' | 'delivery'; address?: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.fulfillment === 'delivery' && !data.address?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['address'],
      message: 'Please add a delivery address or switch to shop pickup.',
    });
  }
}

export const orderRequestSchema = z.strictObject({
  requestType: z.literal('order'),
  customer: customerSchema,
  device: deviceSchema,
  items: z.array(lineItemSchema)
    .min(1, 'Add at least one accessory before sending the request.')
    .max(LIMITS.maxLineItems, 'Too many items in one request. Please split it.'),
  fulfillment: fulfillmentSchema,
  address: trimmed(z.string().max(LIMITS.addressMax)).optional(),
  notes: trimmed(z.string().max(LIMITS.notesMax)).optional(),
  requestId: requestIdSchema,
  company: honeypotSchema,
}).superRefine(requireAddressForDelivery);

export const customRequestSchema = z.strictObject({
  requestType: z.literal('custom'),
  customer: customerSchema,
  device: deviceSchema.extend({ otherModel: z.string().max(80).optional() }),
  item: trimmed(
    z.string()
      .min(2, 'Tell us what you are looking for.')
      .max(LIMITS.itemMax),
  ),
  quantity: z.number().int().min(LIMITS.quantityMin).max(LIMITS.quantityMax),
  description: trimmed(
    z.string()
      .min(LIMITS.descriptionMin, 'Please describe the requirement in a little more detail.')
      .max(LIMITS.descriptionMax),
  ),
  fulfillment: fulfillmentSchema,
  address: trimmed(z.string().max(LIMITS.addressMax)).optional(),
  requestId: requestIdSchema,
  company: honeypotSchema,
}).superRefine(requireAddressForDelivery);

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;

/** Flattens Zod issues into `{ 'customer.phone': 'message' }` for form binding. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_';
    if (!(path in out)) out[path] = issue.message;
  }
  return out;
}
