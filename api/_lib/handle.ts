import type { z } from 'zod';
import { LIMITS, toFieldErrors } from '../../shared/validation.js';
import { claim, release, settle } from './idempotency.js';
import { sendToShopOwner } from './mailer.js';
import { checkRateLimit, clientKey } from './rate-limit.js';
import { fail, logFailure, ok } from './respond.js';

/**
 * Shared request pipeline for both endpoints.
 *
 * Order matters and is the security story of this file:
 *   method → size → rate limit → parse → validate → honeypot → idempotency → send.
 * Cheap rejections happen before expensive ones, and nothing reaches the mail provider
 * until every check has passed.
 */

interface HandleOptions<S extends z.ZodType> {
  request: Request;
  schema: S;
  /** Builds the email from validated input. Runs only after every check passes. */
  render: (payload: z.infer<S>, shopName: string, submittedAt: Date) => {
    subject: string;
    html: string;
    text: string;
  };
  scope: string;
}

export async function handleRequest<S extends z.ZodType>({
  request, schema, render, scope,
}: HandleOptions<S>): Promise<Response> {
  if (request.method !== 'POST') {
    return fail('method_not_allowed', 'Method not allowed.');
  }

  // 1. Body size, before we allocate a string for it.
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > LIMITS.maxBodyBytes) {
    return fail('payload_too_large', 'That request was too large to send.');
  }

  // 2. Rate limit per IP.
  const limit = await checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return fail(
      'rate_limited',
      'Too many requests from this connection. Please wait a few minutes, or call the shop directly.',
      { retryAfterSeconds: limit.retryAfterSeconds },
    );
  }

  // 3. Parse.
  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > LIMITS.maxBodyBytes) {
      return fail('payload_too_large', 'That request was too large to send.');
    }
    raw = JSON.parse(text);
  } catch {
    return fail('validation_error', 'We could not read that request. Please try again.');
  }

  // 4. Validate with the same schema the browser used. `strictObject` also rejects
  //    unexpected fields, per blueprint 08 section 2.
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return fail('validation_error', 'Please check the highlighted fields and try again.', {
      fieldErrors: toFieldErrors(parsed.error),
    });
  }

  const payload = parsed.data as z.infer<S> & {
    requestId: string;
    company?: string;
    customer: { name: string; email?: string };
  };

  // 5. Honeypot. Answer as if it worked so a bot learns nothing, but send no email.
  if (payload.company) {
    console.warn(`[${scope}] honeypot triggered, dropping request`);
    return ok(payload.requestId);
  }

  // 6. Idempotency — a double-click or a retry after a timeout must not mail twice.
  if (claim(payload.requestId) === 'duplicate') {
    console.warn(`[${scope}] duplicate request ${payload.requestId}, not re-sending`);
    return ok(payload.requestId, { duplicate: true });
  }

  const shopName = process.env.SHOP_NAME || 'Mobile Accessories Shop';
  const submittedAt = new Date();

  try {
    const email = render(parsed.data, shopName, submittedAt);

    const outcome = await sendToShopOwner({
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: payload.customer.email,
      replyToName: payload.customer.name,
      idempotencyKey: payload.requestId,
    });

    if (!outcome.ok) {
      // Free the id so the customer's retry is a real attempt, not a false success.
      release(payload.requestId);
      logFailure(scope, outcome.detail);

      return outcome.reason === 'not_configured'
        ? fail(
            'not_configured',
            'Online requests are temporarily unavailable. Please call the shop and we will take your order directly.',
          )
        : fail(
            'email_failed',
            'We could not deliver your request to the shop just now. Please try again, or call us.',
          );
    }

    settle(payload.requestId);
    return ok(payload.requestId);
  } catch (error) {
    release(payload.requestId);
    logFailure(scope, error);
    return fail('server_error', 'Something went wrong on our side. Please try again, or call us.');
  }
}
