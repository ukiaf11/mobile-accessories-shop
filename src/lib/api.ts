import type { ApiResult, CustomRequestPayload, OrderRequestPayload } from '../types';

/**
 * Thin client for the serverless order endpoints.
 *
 * Two rules from blueprint 05_EMAIL_ORDER_FLOW.md section 10:
 *   1. Never report success unless the server actually reported success.
 *   2. Never surface a provider error string to the customer.
 * Every failure is therefore normalised into a typed `ApiFailure` the UI can map to copy.
 */

const TIMEOUT_MS = 20_000;

async function post(path: string, payload: unknown): Promise<ApiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Lets the server collapse a double-submit onto one email.
        'Idempotency-Key': (payload as { requestId?: string }).requestId ?? '',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (response.ok && isSuccess(body)) return body;

    if (isFailure(body)) return body;

    if (response.status === 429) {
      return {
        success: false,
        code: 'rate_limited',
        error: 'Too many requests from this connection. Please wait a moment and try again.',
      };
    }

    if (response.status === 413) {
      return { success: false, code: 'payload_too_large', error: 'That request was too large to send.' };
    }

    return {
      success: false,
      code: 'server_error',
      error: 'We could not reach the shop right now. Please try again.',
    };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return {
      success: false,
      code: 'network_error',
      error: aborted
        ? 'The request timed out. Please check your connection and try again.'
        : 'No internet connection. Your details are safe — try again when you are back online.',
    };
  } finally {
    clearTimeout(timer);
  }
}

function isSuccess(body: unknown): body is Extract<ApiResult, { success: true }> {
  return (
    typeof body === 'object' && body !== null &&
    (body as { success?: unknown }).success === true &&
    typeof (body as { requestId?: unknown }).requestId === 'string'
  );
}

function isFailure(body: unknown): body is Extract<ApiResult, { success: false }> {
  return (
    typeof body === 'object' && body !== null &&
    (body as { success?: unknown }).success === false &&
    typeof (body as { code?: unknown }).code === 'string'
  );
}

export function submitOrder(payload: OrderRequestPayload): Promise<ApiResult> {
  return post('/api/order', payload);
}

export function submitCustomRequest(payload: CustomRequestPayload): Promise<ApiResult> {
  return post('/api/custom-request', payload);
}
