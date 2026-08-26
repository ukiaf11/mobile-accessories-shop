/**
 * Duplicate-submission guard (blueprint 05 section 7, 08 section 6 "duplicate click").
 *
 * The client sends the same `requestId` on every retry of one logical request. If that id
 * has already produced an email from this instance, the second call returns the original
 * success instead of mailing the shop twice.
 *
 * In-memory, so it is per-instance and time-bounded — the same trade-off as the fallback
 * rate limiter. Resend's own idempotency key is also passed through in `mailer.ts`, which
 * covers the cross-instance case for the send itself.
 */

const TTL_MS = 30 * 60 * 1000;

type Entry = { at: number; inFlight: boolean };

const seen = new Map<string, Entry>();

function sweep(now: number): void {
  for (const [key, entry] of seen) {
    if (now - entry.at > TTL_MS) seen.delete(key);
  }
}

export type IdempotencyVerdict = 'fresh' | 'duplicate';

/** Marks the id as being handled. Returns `duplicate` if it was already claimed. */
export function claim(requestId: string): IdempotencyVerdict {
  const now = Date.now();
  if (seen.size > 2000) sweep(now);

  const existing = seen.get(requestId);
  if (existing && now - existing.at <= TTL_MS) return 'duplicate';

  seen.set(requestId, { at: now, inFlight: true });
  return 'fresh';
}

/** Releases a claim so a genuine failure can be retried by the customer. */
export function release(requestId: string): void {
  seen.delete(requestId);
}

/** Marks a claim as completed successfully; it stays for the rest of the TTL. */
export function settle(requestId: string): void {
  const entry = seen.get(requestId);
  if (entry) entry.inFlight = false;
}
