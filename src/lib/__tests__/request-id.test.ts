import { describe, expect, it } from 'vitest';
import { generateRequestId, REQUEST_ID_PATTERN } from '../request-id';
import { requestIdSchema } from '../../../shared/validation';

describe('request id', () => {
  it('matches the blueprint format MAS-YYYYMMDD-XXXX', () => {
    const id = generateRequestId('MAS', new Date('2026-08-26T09:00:00Z'));
    expect(id).toMatch(/^MAS-20260826-[0-9A-HJ-KM-NP-TV-Z]{4}$/);
  });

  it('is accepted by the schema the server validates against', () => {
    for (let i = 0; i < 200; i += 1) {
      const id = generateRequestId();
      expect(requestIdSchema.safeParse(id).success, id).toBe(true);
      expect(REQUEST_ID_PATTERN.test(id), id).toBe(true);
    }
  });

  it('omits the letters that are misread over a phone call', () => {
    const suffixes = Array.from({ length: 500 }, () => generateRequestId().split('-')[2]).join('');
    for (const letter of ['I', 'L', 'O', 'U']) {
      expect(suffixes.includes(letter), `contains ${letter}`).toBe(false);
    }
  });

  it('does not collide across a realistic day of orders', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => generateRequestId()));
    // 32^4 ≈ 1M combinations; a handful of collisions in 2000 draws would still be
    // acceptable operationally, but anything worse means the RNG is broken.
    expect(ids.size).toBeGreaterThan(1980);
  });

  it('pads single-digit months and days', () => {
    expect(generateRequestId('MAS', new Date('2026-01-05T09:00:00Z'))).toMatch(/^MAS-20260105-/);
  });
});
