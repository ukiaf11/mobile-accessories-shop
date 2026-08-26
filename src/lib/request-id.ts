const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford-ish: no I, L, O, U.

function randomSuffix(length: number): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/**
 * Human-quotable request reference, e.g. `MAS-20260826-8F2K`.
 * Generated on the client so the customer sees the same id the shop receives,
 * and so a retry after a network failure reuses the same reference.
 */
export function generateRequestId(prefix = 'MAS', now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${prefix}-${y}${m}${d}-${randomSuffix(4)}`;
}

export const REQUEST_ID_PATTERN = /^MAS-\d{8}-[0-9A-HJ-KM-NP-TV-Z]{4}$/;
