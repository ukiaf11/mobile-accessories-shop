import { describe, expect, it } from 'vitest';
import { brands, brandById } from '../brands';
import { devices, deviceById, devicesForBrand } from '../devices';
import { categories } from '../categories';
import { products, productById } from '../products';
import { resolveCompatibility } from '../compatibility';

describe('catalog integrity', () => {
  it('has no duplicate ids', () => {
    for (const [label, ids] of [
      ['brand', brands.map((b) => b.id)],
      ['device', devices.map((d) => d.id)],
      ['category', categories.map((c) => c.id)],
      ['product', products.map((p) => p.id)],
    ] as const) {
      const seen = new Set<string>();
      const dupes = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
      expect(dupes, `duplicate ${label} ids`).toEqual([]);
    }
  });

  it('covers the blueprint brand and model targets', () => {
    expect(brands.length).toBeGreaterThanOrEqual(20);
    expect(devices.length).toBeGreaterThanOrEqual(150);
    expect(categories.length).toBe(9);
    expect(products.length).toBeGreaterThanOrEqual(60);
  });

  it('points every device at a real brand', () => {
    for (const device of devices) {
      expect(brandById.has(device.brandId), `${device.id} -> ${device.brandId}`).toBe(true);
    }
  });

  it('points every product at a real category and only at real devices', () => {
    const categoryIds = new Set(categories.map((c) => c.id));
    for (const product of products) {
      expect(categoryIds.has(product.categoryId), `${product.id}`).toBe(true);
      expect(product.compatibleDeviceIds.length, `${product.id} fits nothing`).toBeGreaterThan(0);
      for (const id of product.compatibleDeviceIds) {
        expect(deviceById.has(id), `${product.id} -> unknown device ${id}`).toBe(true);
      }
    }
  });

  it('prices every product or labels it as ask-price', () => {
    for (const product of products) {
      const priced = typeof product.price === 'number' || Boolean(product.priceLabel);
      expect(priced, `${product.id} has neither price nor priceLabel`).toBe(true);
    }
  });

  it('has both smartphone and tablet coverage', () => {
    expect(devices.some((d) => d.type === 'smartphone')).toBe(true);
    expect(devices.filter((d) => d.type === 'tablet').length).toBeGreaterThanOrEqual(10);
  });

  it('sorts brand models newest first', () => {
    const apple = devicesForBrand('apple', 'smartphone');
    expect(apple[0]?.year).toBeGreaterThanOrEqual(apple[apple.length - 1]?.year ?? 0);
  });
});

describe('compatibility rules', () => {
  it('keeps MagSafe cases on iPhone 12 and newer only', () => {
    const magsafe = productById.get('case-magsafe-clear');
    expect(magsafe).toBeDefined();
    expect(magsafe!.compatibleDeviceIds).toContain('apple-iphone-15-pro');
    expect(magsafe!.compatibleDeviceIds).not.toContain('apple-iphone-11');
    expect(magsafe!.compatibleDeviceIds.every((id) => id.startsWith('apple-'))).toBe(true);
  });

  it('keeps hinge cases on foldables only', () => {
    const fold = productById.get('case-fold-hinge')!;
    expect(fold.compatibleDeviceIds).toContain('samsung-galaxy-z-fold-6');
    expect(fold.compatibleDeviceIds).not.toContain('samsung-galaxy-s24');
  });

  it('never offers a USB-C earphone to a Lightning iPhone', () => {
    const usbc = productById.get('audio-wired-typec')!;
    expect(usbc.compatibleDeviceIds).toContain('apple-iphone-15');
    expect(usbc.compatibleDeviceIds).not.toContain('apple-iphone-14-pro');
    expect(usbc.compatibleDeviceIds).not.toContain('apple-ipad-9th-gen');
  });

  it('keeps the Lightning cable off USB-C iPads', () => {
    const cable = productById.get('charge-cable-lightning')!;
    expect(cable.compatibleDeviceIds).toContain('apple-ipad-9th-gen');
    expect(cable.compatibleDeviceIds).not.toContain('apple-ipad-11th-gen');
    expect(cable.compatibleDeviceIds).not.toContain('apple-iphone-15');
  });

  it('restricts tablet accessories to tablets', () => {
    const folio = productById.get('tablet-folio-case')!;
    const tabletIds = new Set(devices.filter((d) => d.type === 'tablet').map((d) => d.id));
    expect(folio.compatibleDeviceIds.every((id) => tabletIds.has(id))).toBe(true);
  });

  it('treats an empty rule as fitting nothing rather than everything', () => {
    expect(resolveCompatibility({})).toEqual([]);
  });

  it('applies exclusions after every other rule', () => {
    const ids = resolveCompatibility({ brandIds: ['google'], excludeDeviceIds: ['google-pixel-9'] });
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).not.toContain('google-pixel-9');
  });

  it('gives every device at least one compatible product', () => {
    const orphans = devices.filter(
      (device) => !products.some((p) => p.compatibleDeviceIds.includes(device.id)),
    );
    expect(orphans.map((d) => d.id)).toEqual([]);
  });
});
