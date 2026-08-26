import { describe, expect, it } from 'vitest';
import {
  customRequestSchema, orderRequestSchema, phoneSchema, nameSchema, optionalEmailSchema,
  toFieldErrors, LIMITS,
} from '../validation';

const baseCustomer = { name: 'Rahul Kumar', phone: '9876543210' };

function order(overrides: Record<string, unknown> = {}) {
  return {
    requestType: 'order',
    customer: { ...baseCustomer },
    device: { type: 'smartphone', brand: 'Samsung', model: 'Galaxy A55' },
    items: [{ productId: 'case-clear-shockproof', name: 'Clear Case', quantity: 1, unitPrice: 299 }],
    fulfillment: 'pickup',
    requestId: 'MAS-20260826-8F2K',
    ...overrides,
  };
}

function custom(overrides: Record<string, unknown> = {}) {
  return {
    requestType: 'custom',
    customer: { ...baseCustomer },
    device: { type: 'smartphone', brand: 'Samsung', otherModel: 'Galaxy A55' },
    item: 'Transparent camera-protection case',
    quantity: 1,
    description: 'I need a transparent camera-protection case for Samsung Galaxy A55.',
    fulfillment: 'pickup',
    requestId: 'MAS-20260826-C7P4',
    ...overrides,
  };
}

describe('phone validation', () => {
  it.each(['9876543210', '+919876543210', '+91 98765 43210', '098765-43210', '+14155552671'])(
    'accepts %s',
    (value) => {
      expect(phoneSchema.safeParse(value).success).toBe(true);
    },
  );

  // 8 digits is the international floor; anything shorter is a typo, not a number.
  it.each(['12345', 'not a phone', '1234567890', '', '98765 43', '9876543210123456'])(
    'rejects %s',
    (value) => {
      expect(phoneSchema.safeParse(value).success).toBe(false);
    },
  );

  it('accepts a shorter international number, since not every country uses 10 digits', () => {
    expect(phoneSchema.safeParse('987654321').success).toBe(true);
  });

  it('rejects an Indian number starting below 6', () => {
    const result = phoneSchema.safeParse('5876543210');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/6, 7, 8 or 9/);
    }
  });

  it('strips formatting characters before checking', () => {
    const result = phoneSchema.safeParse('(98765) 43-210');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('9876543210');
  });
});

describe('name validation', () => {
  it('trims surrounding whitespace', () => {
    const result = nameSchema.safeParse('  Rahul Kumar  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('Rahul Kumar');
  });

  it('accepts names with marks, apostrophes and hyphens', () => {
    for (const value of ["O'Brien", 'Anne-Marie', 'José', 'अंकित']) {
      expect(nameSchema.safeParse(value).success, value).toBe(true);
    }
  });

  it('rejects a name that is only punctuation or a URL', () => {
    expect(nameSchema.safeParse('...').success).toBe(false);
    expect(nameSchema.safeParse('http://spam.example').success).toBe(false);
  });

  it('enforces the length bounds', () => {
    expect(nameSchema.safeParse('A').success).toBe(false);
    expect(nameSchema.safeParse('A'.repeat(LIMITS.nameMax + 1)).success).toBe(false);
  });
});

describe('optional email', () => {
  it('treats an empty string as absent', () => {
    const result = optionalEmailSchema.safeParse('');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeUndefined();
  });

  it('still rejects a malformed address', () => {
    expect(optionalEmailSchema.safeParse('nope@').success).toBe(false);
  });
});

describe('order request schema', () => {
  it('accepts a well-formed order', () => {
    expect(orderRequestSchema.safeParse(order()).success).toBe(true);
  });

  it('requires at least one item', () => {
    const result = orderRequestSchema.safeParse(order({ items: [] }));
    expect(result.success).toBe(false);
  });

  it('caps quantity per line item', () => {
    const tooMany = order({
      items: [{ productId: 'x', name: 'X', quantity: LIMITS.quantityMax + 1 }],
    });
    expect(orderRequestSchema.safeParse(tooMany).success).toBe(false);
  });

  it('requires an address when delivery is chosen', () => {
    const result = orderRequestSchema.safeParse(order({ fulfillment: 'delivery' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error)).toHaveProperty('address');
    }
  });

  it('accepts delivery once an address is present', () => {
    const result = orderRequestSchema.safeParse(
      order({ fulfillment: 'delivery', address: '12 Main Road, Your City 000000' }),
    );
    expect(result.success).toBe(true);
  });

  it('treats a whitespace-only address as missing', () => {
    const result = orderRequestSchema.safeParse(order({ fulfillment: 'delivery', address: '   ' }));
    expect(result.success).toBe(false);
  });

  it('rejects unexpected fields rather than passing them through', () => {
    const result = orderRequestSchema.safeParse(order({ to: 'attacker@example.com' }));
    expect(result.success).toBe(false);
  });

  it('rejects a recipient smuggled into the customer object', () => {
    const result = orderRequestSchema.safeParse(
      order({ customer: { ...baseCustomer, to: 'attacker@example.com' } }),
    );
    expect(result.success).toBe(false);
  });

  it('rejects a malformed request id', () => {
    expect(orderRequestSchema.safeParse(order({ requestId: 'not-an-id' })).success).toBe(false);
    // I, L, O and U are excluded from the alphabet to avoid misreading over the phone.
    expect(orderRequestSchema.safeParse(order({ requestId: 'MAS-20260826-IIII' })).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    expect(orderRequestSchema.safeParse(order({ company: 'Acme' })).success).toBe(false);
  });

  it('enforces the notes length cap', () => {
    const long = order({ notes: 'x'.repeat(LIMITS.notesMax + 1) });
    expect(orderRequestSchema.safeParse(long).success).toBe(false);
  });
});

describe('custom request schema', () => {
  it('accepts a well-formed custom request', () => {
    expect(customRequestSchema.safeParse(custom()).success).toBe(true);
  });

  it('requires a description of usable length', () => {
    expect(customRequestSchema.safeParse(custom({ description: 'need' })).success).toBe(false);
  });

  it('requires an item', () => {
    expect(customRequestSchema.safeParse(custom({ item: '' })).success).toBe(false);
  });

  it('requires an address for delivery', () => {
    expect(customRequestSchema.safeParse(custom({ fulfillment: 'delivery' })).success).toBe(false);
  });

  it('rejects a non-integer quantity', () => {
    expect(customRequestSchema.safeParse(custom({ quantity: 1.5 })).success).toBe(false);
  });
});

describe('toFieldErrors', () => {
  it('flattens nested paths into dotted keys the form can bind', () => {
    const result = orderRequestSchema.safeParse(
      order({ customer: { name: 'A', phone: '123' } }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = toFieldErrors(result.error);
      expect(Object.keys(errors)).toEqual(
        expect.arrayContaining(['customer.name', 'customer.phone']),
      );
    }
  });
});
