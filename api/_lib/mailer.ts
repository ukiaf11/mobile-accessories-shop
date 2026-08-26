import { Resend } from 'resend';
import { sanitizeHeader } from '../../shared/text.js';

/**
 * Transactional email. Blueprint 05 section 6 and 08 section 4:
 *   - the API key never leaves the server;
 *   - the recipient is ALWAYS the configured shop owner, never a value from the request;
 *   - the customer's address is used only as reply-to.
 */

export interface MailInput {
  subject: string;
  html: string;
  text: string;
  /** Customer address, if they gave one. Used for reply-to only. */
  replyTo?: string;
  replyToName?: string;
  /** Reused across retries so Resend collapses duplicate sends. */
  idempotencyKey: string;
}

export type MailOutcome =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'not_configured' | 'send_failed'; detail: string };

export function mailerConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    to: process.env.SHOP_OWNER_EMAIL,
    from: process.env.MAIL_FROM,
  };
}

export async function sendToShopOwner(input: MailInput): Promise<MailOutcome> {
  const { apiKey, to, from } = mailerConfig();

  if (!apiKey || !to || !from) {
    const missing = [
      !apiKey && 'RESEND_API_KEY',
      !to && 'SHOP_OWNER_EMAIL',
      !from && 'MAIL_FROM',
    ].filter(Boolean).join(', ');
    return { ok: false, reason: 'not_configured', detail: `missing env: ${missing}` };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(
      {
        from,
        // Never `input`-controlled. This is the whole point of section 4 of the
        // security checklist.
        to: [to],
        subject: sanitizeHeader(input.subject),
        html: input.html,
        text: input.text,
        ...(input.replyTo
          ? {
              replyTo: input.replyToName
                ? `${sanitizeHeader(input.replyToName).replace(/[<>"]/g, '')} <${input.replyTo}>`
                : input.replyTo,
            }
          : {}),
      },
      { idempotencyKey: input.idempotencyKey },
    );

    if (error) return { ok: false, reason: 'send_failed', detail: error.message };
    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      reason: 'send_failed',
      detail: error instanceof Error ? error.message : 'unknown transport error',
    };
  }
}
