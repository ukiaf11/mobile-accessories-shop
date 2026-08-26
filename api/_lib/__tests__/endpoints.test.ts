import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import orderHandler from '../../order';
import customHandler from '../../custom-request';
import { mailerConfig, sendToShopOwner } from '../mailer';

/**
 * Covers the two endpoint modules themselves and the real (unmocked) mailer's
 * configuration handling — the parts the pipeline tests stub out.
 */

const ENV_KEYS = ['RESEND_API_KEY', 'SHOP_OWNER_EMAIL', 'MAIL_FROM', 'SHOP_NAME'] as const;
const saved: Record<string, string | undefined> = {};

let idSeed = 5000;
function nextRequestId(): string {
  return `MAS-20260826-${String(++idSeed).padStart(4, '0')}`;
}

function post(url: string, payload: unknown): Request {
  const text = JSON.stringify(payload);
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'content-length': String(new TextEncoder().encode(text).length),
      'x-forwarded-for': `198.51.100.${(idSeed % 250) + 1}`,
    },
    body: text,
  });
}

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  vi.restoreAllMocks();
});

describe('mailer configuration', () => {
  it('reports which variables are missing without sending', async () => {
    const outcome = await sendToShopOwner({
      subject: 'x', html: '<p>x</p>', text: 'x', idempotencyKey: nextRequestId(),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('not_configured');
      expect(outcome.detail).toContain('RESEND_API_KEY');
      expect(outcome.detail).toContain('SHOP_OWNER_EMAIL');
      expect(outcome.detail).toContain('MAIL_FROM');
    }
  });

  it('reads the recipient from the environment, never from a caller', () => {
    process.env.SHOP_OWNER_EMAIL = 'owner@example.com';
    process.env.MAIL_FROM = 'orders@example.com';
    process.env.RESEND_API_KEY = 're_test';
    expect(mailerConfig()).toEqual({
      apiKey: 're_test',
      to: 'owner@example.com',
      from: 'orders@example.com',
    });
  });
});

describe('POST /api/order', () => {
  it('rejects a GET', async () => {
    const response = await orderHandler(new Request('https://shop.example/api/order'));
    expect(response.status).toBe(405);
  });

  it('validates before it ever looks at the mail configuration', async () => {
    const response = await orderHandler(
      post('https://shop.example/api/order', { requestType: 'order' }),
    );
    // 422, not 503: a malformed request is never blamed on the shop's setup.
    expect(response.status).toBe(422);
  });

  it('fails loudly when email is not configured, rather than faking success', async () => {
    const response = await orderHandler(
      post('https://shop.example/api/order', {
        requestType: 'order',
        customer: { name: 'Rahul Kumar', phone: '9876543210' },
        device: { type: 'smartphone', brand: 'Apple', model: 'iPhone 15 Pro' },
        items: [{ productId: 'p', name: 'Clear Case', quantity: 1, unitPrice: 299 }],
        fulfillment: 'pickup',
        requestId: nextRequestId(),
      }),
    );
    expect(response.status).toBe(503);
    const json = (await response.json()) as { success: boolean; code: string; error: string };
    expect(json.success).toBe(false);
    expect(json.code).toBe('not_configured');
    expect(json.error).not.toMatch(/RESEND|env|API/i);
  });
});

describe('POST /api/custom-request', () => {
  it('rejects a GET', async () => {
    const response = await customHandler(new Request('https://shop.example/api/custom-request'));
    expect(response.status).toBe(405);
  });

  it('rejects an order payload sent to the custom endpoint', async () => {
    const response = await customHandler(
      post('https://shop.example/api/custom-request', {
        requestType: 'order',
        customer: { name: 'Rahul Kumar', phone: '9876543210' },
        device: {},
        items: [{ productId: 'p', name: 'X', quantity: 1 }],
        fulfillment: 'pickup',
        requestId: nextRequestId(),
      }),
    );
    expect(response.status).toBe(422);
  });

  it('accepts a valid custom request and reaches the mail step', async () => {
    const response = await customHandler(
      post('https://shop.example/api/custom-request', {
        requestType: 'custom',
        customer: { name: 'Rahul Kumar', phone: '9876543210' },
        device: { type: 'smartphone', brand: 'Samsung', otherModel: 'Galaxy A55 5G' },
        item: 'Transparent camera case',
        quantity: 1,
        description: 'I need a transparent camera-protection case for the Galaxy A55.',
        fulfillment: 'pickup',
        requestId: nextRequestId(),
      }),
    );
    // Reaching `not_configured` proves validation passed and the mailer was invoked.
    expect(response.status).toBe(503);
  });
});
