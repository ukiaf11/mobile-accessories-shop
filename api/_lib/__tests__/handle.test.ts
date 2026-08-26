import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Pipeline tests for the public request endpoints.
 *
 * The mailer is mocked so nothing is ever actually sent, and so each test can assert
 * exactly what the handler tried to do with the customer's data.
 */

const sendMock = vi.fn();

vi.mock('../mailer', () => ({
  sendToShopOwner: (...args: unknown[]) => sendMock(...args),
  mailerConfig: () => ({ apiKey: 'test', to: 'owner@example.com', from: 'orders@example.com' }),
}));

const { handleRequest } = await import('../handle');
const { orderRequestSchema } = await import('../../../shared/validation');
const { orderEmail } = await import('../../../emails/templates');

let idSeed = 0;
function nextRequestId(): string {
  // Valid per REQUEST_ID_PATTERN, unique per test so the idempotency cache never collides.
  const suffix = String(++idSeed).padStart(4, '0');
  return `MAS-20260826-${suffix}`;
}

function body(overrides: Record<string, unknown> = {}) {
  return {
    requestType: 'order',
    customer: { name: 'Rahul Kumar', phone: '9876543210', email: 'rahul@example.com' },
    device: { type: 'smartphone', brand: 'Samsung', model: 'Galaxy A55' },
    items: [{ productId: 'case-clear-shockproof', name: 'Clear Case', quantity: 2, unitPrice: 299 }],
    fulfillment: 'pickup',
    requestId: nextRequestId(),
    ...overrides,
  };
}

function post(payload: unknown, headers: Record<string, string> = {}): Request {
  const text = JSON.stringify(payload);
  return new Request('https://shop.example/api/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'content-length': String(new TextEncoder().encode(text).length),
      // A distinct IP per test keeps the rate limiter out of the way.
      'x-forwarded-for': `10.0.0.${(idSeed % 250) + 1}`,
      ...headers,
    },
    body: text,
  });
}

/** `Response.json()` is typed `unknown`; the tests only ever read the API envelope. */
type Envelope = {
  success: boolean;
  code?: string;
  error?: string;
  requestId?: string;
  duplicate?: boolean;
  fieldErrors?: Record<string, string>;
};

async function readJson(response: Response): Promise<Envelope> {
  return (await response.json()) as Envelope;
}

function run(request: Request) {
  return handleRequest({
    request,
    schema: orderRequestSchema,
    render: orderEmail,
    scope: 'test',
  });
}

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue({ ok: true, id: 'email_123' });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('happy path', () => {
  it('sends one email and returns the request id', async () => {
    const payload = body();
    const response = await run(post(payload));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      requestId: payload.requestId,
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('uses the customer email only as reply-to', async () => {
    await run(post(body()));

    const [mail] = sendMock.mock.calls[0];
    expect(mail.replyTo).toBe('rahul@example.com');
    // The recipient is never taken from the request — mailer.ts owns it.
    expect(mail).not.toHaveProperty('to');
  });

  it('passes the request id as the provider idempotency key', async () => {
    const payload = body();
    await run(post(payload));
    expect(sendMock.mock.calls[0][0].idempotencyKey).toBe(payload.requestId);
  });

  it('never sets cache headers on a response containing customer data', async () => {
    const response = await run(post(body()));
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('method and size guards', () => {
  it('rejects a GET', async () => {
    const response = await run(new Request('https://shop.example/api/order'));
    expect(response.status).toBe(405);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized body before parsing it', async () => {
    const response = await run(post(body(), { 'content-length': String(64 * 1024) }));
    expect(response.status).toBe(413);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rejects a body that lies about its length', async () => {
    const huge = body({ notes: 'x'.repeat(80_000) });
    const response = await run(post(huge, { 'content-length': '10' }));
    expect(response.status).toBe(413);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON without leaking a parser error', async () => {
    const request = new Request('https://shop.example/api/order', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.1.1' },
      body: '{not json',
    });
    const response = await run(request);
    expect(response.status).toBe(422);
    const json = await readJson(response);
    expect(json.error!).not.toMatch(/JSON|token|position/i);
  });
});

describe('validation', () => {
  it('returns field errors the form can bind to', async () => {
    const response = await run(post(body({ customer: { name: 'A', phone: '1' } })));
    expect(response.status).toBe(422);
    const json = await readJson(response);
    expect(json.code).toBe('validation_error');
    expect(Object.keys(json.fieldErrors!)).toEqual(
      expect.arrayContaining(['customer.name', 'customer.phone']),
    );
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('refuses a request that tries to choose its own recipient', async () => {
    const response = await run(post(body({ to: 'attacker@example.com' })));
    expect(response.status).toBe(422);
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe('spam and duplicates', () => {
  it('drops a honeypot submission silently but sends nothing', async () => {
    const payload = body({ company: '' });
    // A bot fills the hidden field; schema max(0) rejects it outright.
    const filled = { ...payload, company: 'Acme Corp', requestId: nextRequestId() };
    const response = await run(post(filled));
    expect(response.status).toBe(422);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('collapses a repeated submission of the same request id onto one email', async () => {
    const payload = body();
    const first = await run(post(payload));
    const second = await run(post(payload));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ success: true, duplicate: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('rate limits a burst from one address', async () => {
    const ip = '203.0.113.55';
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await run(post(body(), { 'x-forwarded-for': ip }));
      statuses.push(response.status);
    }

    expect(statuses).toContain(429);
    const limited = statuses.filter((status) => status === 429).length;
    expect(limited).toBeGreaterThanOrEqual(3);
  });

  it('tells a rate-limited caller when to retry', async () => {
    const ip = '203.0.113.99';
    let last: Response | null = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      last = await run(post(body(), { 'x-forwarded-for': ip }));
    }
    expect(last!.status).toBe(429);
    expect(Number(last!.headers.get('Retry-After'))).toBeGreaterThan(0);
    await expect(last!.json()).resolves.toMatchObject({ code: 'rate_limited' });
  });
});

describe('delivery failure', () => {
  it('never reports success when the provider fails', async () => {
    sendMock.mockResolvedValue({ ok: false, reason: 'send_failed', detail: 'upstream 500' });

    const response = await run(post(body()));
    expect(response.status).toBe(502);
    const json = await readJson(response);
    expect(json.success).toBe(false);
    expect(json.code).toBe('email_failed');
    // The provider's own error text must not reach the customer.
    expect(json.error!).not.toMatch(/upstream|500/);
  });

  it('lets the customer retry the same id after a failure', async () => {
    const payload = body();
    sendMock.mockResolvedValueOnce({ ok: false, reason: 'send_failed', detail: 'timeout' });

    const failed = await run(post(payload));
    expect(failed.status).toBe(502);

    // The claim was released, so the retry is a real attempt rather than a false duplicate.
    const retried = await run(post(payload));
    expect(retried.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('reports a distinct code when the shop has not configured email yet', async () => {
    sendMock.mockResolvedValue({
      ok: false,
      reason: 'not_configured',
      detail: 'missing env: RESEND_API_KEY',
    });

    const response = await run(post(body()));
    expect(response.status).toBe(503);
    const json = await readJson(response);
    expect(json.code).toBe('not_configured');
    expect(json.error!).toMatch(/call the shop/i);
    expect(json.error!).not.toMatch(/RESEND|env/i);
  });

  it('survives a template or transport throw without leaking a stack trace', async () => {
    sendMock.mockRejectedValue(new Error('socket hang up at internal/net.js:42'));

    const response = await run(post(body()));
    expect(response.status).toBe(500);
    const json = await readJson(response);
    expect(json.code).toBe('server_error');
    expect(json.error!).not.toMatch(/socket|net\.js/);
  });
});
