import { describe, expect, it } from 'vitest';
import { customRequestEmail, orderEmail } from '../templates';
import { customRequestSchema, orderRequestSchema } from '../../shared/validation';

const AT = new Date('2026-08-26T03:00:00.000Z'); // 08:30 IST

function parsedOrder(overrides: Record<string, unknown> = {}) {
  const result = orderRequestSchema.safeParse({
    requestType: 'order',
    customer: { name: 'Rahul Kumar', phone: '9876543210', email: 'rahul@example.com' },
    device: { type: 'smartphone', brand: 'Samsung', model: 'Galaxy A55' },
    items: [
      { productId: 'case-clear', name: 'Clear Shockproof Case', quantity: 1, unitPrice: 299 },
      { productId: 'glass', name: 'Tempered Glass', quantity: 2, unitPrice: 199 },
    ],
    fulfillment: 'pickup',
    notes: 'Please confirm availability.',
    requestId: 'MAS-20260826-8F2K',
    ...overrides,
  });
  if (!result.success) throw new Error(`fixture invalid: ${result.error.message}`);
  return result.data;
}

function parsedCustom(overrides: Record<string, unknown> = {}) {
  const result = customRequestSchema.safeParse({
    requestType: 'custom',
    customer: { name: 'Rahul Kumar', phone: '9876543210' },
    device: { type: 'smartphone', brand: 'Samsung', otherModel: 'Galaxy A55' },
    item: 'Transparent camera-protection case',
    quantity: 1,
    description: 'I need a transparent camera-protection case for Samsung Galaxy A55.',
    fulfillment: 'pickup',
    requestId: 'MAS-20260826-C7P4',
    ...overrides,
  });
  if (!result.success) throw new Error(`fixture invalid: ${result.error.message}`);
  return result.data;
}

describe('order email', () => {
  const email = orderEmail(parsedOrder(), 'Test Shop', AT);

  it('uses the subject line from the blueprint', () => {
    expect(email.subject).toBe('New Mobile Accessories Order Request — MAS-20260826-8F2K');
  });

  it('contains every section the shop needs to act on', () => {
    for (const fragment of [
      'MAS-20260826-8F2K', 'Rahul Kumar', '9876543210', 'rahul@example.com',
      'Galaxy A55', 'Clear Shockproof Case', 'Tempered Glass',
      'Shop pickup', 'Please confirm availability.',
    ]) {
      expect(email.html, fragment).toContain(fragment);
      expect(email.text, fragment).toContain(fragment);
    }
  });

  it('totals the line items', () => {
    // 299 + (199 × 2) = 697
    expect(email.html).toContain('₹697');
    expect(email.text).toContain('₹697');
  });

  it('flags an estimate when an item is priced on request', () => {
    const askPrice = orderEmail(
      parsedOrder({ items: [{ productId: 'x', name: 'Keyboard Folio', quantity: 1 }] }),
      'Test Shop',
      AT,
    );
    expect(askPrice.html).toContain('Ask price');
    expect(askPrice.html).toMatch(/priced on request/i);
  });

  it('stamps the submission time in IST', () => {
    expect(email.text).toContain('26 Aug 2026');
    expect(email.text).toMatch(/08:30/);
  });

  it('renders a tel: link the shop owner can tap', () => {
    expect(email.html).toContain('href="tel:9876543210"');
  });

  it('ships a plain-text alternative that is not HTML', () => {
    expect(email.text).not.toContain('<');
    expect(email.text.startsWith('NEW ORDER REQUEST')).toBe(true);
  });

  it('omits the delivery address row when the customer chose pickup', () => {
    expect(email.html).not.toContain('Address');
  });

  it('includes the address when delivery was chosen', () => {
    const delivery = orderEmail(
      parsedOrder({ fulfillment: 'delivery', address: '12 Main Road, Your City' }),
      'Test Shop',
      AT,
    );
    expect(delivery.html).toContain('12 Main Road, Your City');
    expect(delivery.html).toContain('Local delivery');
  });
});

describe('custom request email', () => {
  const email = customRequestEmail(parsedCustom(), 'Test Shop', AT);

  it('uses the custom subject line', () => {
    expect(email.subject).toBe('Custom Accessory Request — MAS-20260826-C7P4');
  });

  it('carries the requirement, quantity and typed model', () => {
    for (const fragment of [
      'Transparent camera-protection case', 'Galaxy A55', 'MAS-20260826-C7P4',
    ]) {
      expect(email.html, fragment).toContain(fragment);
      expect(email.text, fragment).toContain(fragment);
    }
  });

  it('omits the email row when the customer did not give one', () => {
    expect(email.text).not.toMatch(/^Email:/m);
  });
});

describe('escaping — the email body is entirely customer-controlled', () => {
  it('neutralises HTML in every free-text field', () => {
    const hostile = '<img src=x onerror="alert(1)">';
    const email = orderEmail(
      parsedOrder({
        customer: { name: "O'Brien", phone: '9876543210' },
        notes: hostile,
        items: [{ productId: 'x', name: hostile, quantity: 1, unitPrice: 100 }],
      }),
      'Test Shop',
      AT,
    );

    // What matters is that the angle brackets and quotes are neutralised, so the
    // payload is inert text. The substring "onerror=" surviving inside an escaped
    // string is harmless — it can no longer become an attribute.
    expect(email.html).not.toContain('<img');
    expect(email.html).not.toContain('onerror="alert(1)"');
    expect(email.html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(email.html).toContain('&#39;'); // the apostrophe in O'Brien
  });

  it('does not let a crafted model name break the table markup', () => {
    const email = orderEmail(
      parsedOrder({ device: { type: 'smartphone', brand: 'X', model: '</td></tr><script>' } }),
      'Test Shop',
      AT,
    );
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;/td&gt;');
  });

  it('keeps a newline-injected subject on one line', () => {
    const email = orderEmail(parsedOrder(), 'Test Shop', AT);
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it('escapes hostile text in the custom-request description too', () => {
    const email = customRequestEmail(
      parsedCustom({ description: 'Need this <script>alert(1)</script> in black please.' }),
      'Test Shop',
      AT,
    );
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
