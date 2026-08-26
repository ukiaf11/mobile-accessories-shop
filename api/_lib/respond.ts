/** Uniform JSON responses. The client maps `code` to recovery copy. */

export type FailureCode =
  | 'validation_error'
  | 'rate_limited'
  | 'email_failed'
  | 'not_configured'
  | 'payload_too_large'
  | 'server_error'
  | 'method_not_allowed';

const STATUS: Record<FailureCode, number> = {
  validation_error: 422,
  rate_limited: 429,
  email_failed: 502,
  not_configured: 503,
  payload_too_large: 413,
  server_error: 500,
  method_not_allowed: 405,
};

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

export function ok(requestId: string, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ success: true, requestId, ...extra }), {
    status: 200,
    headers: SECURITY_HEADERS,
  });
}

export function fail(
  code: FailureCode,
  error: string,
  extra: Record<string, unknown> = {},
): Response {
  const headers: Record<string, string> = { ...SECURITY_HEADERS };
  if (code === 'rate_limited' && typeof extra.retryAfterSeconds === 'number') {
    headers['Retry-After'] = String(extra.retryAfterSeconds);
  }
  return new Response(JSON.stringify({ success: false, code, error, ...extra }), {
    status: STATUS[code],
    headers,
  });
}

/**
 * Server-side log. Deliberately terse: the provider's own error text may contain
 * account identifiers, so only its message is recorded, never the customer payload
 * (blueprint 05 section 10 / 08 section 1).
 */
export function logFailure(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}] ${message}`);
}
