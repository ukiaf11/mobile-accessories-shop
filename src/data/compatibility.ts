import type { CompatibilityRule, DeviceModel, Product, ProductSeed } from '../types';
import { activeDevices } from './devices';
import { slugify } from '../lib/format';

/**
 * Expands a declarative rule into concrete device ids.
 *
 * Blueprint 04_DATA_MODEL_CATALOG.md section 9 warns against duplicating a product record per
 * model. Products therefore declare *which kinds* of device they fit; this runs once at module
 * load and produces the `compatibleDeviceIds` array the rest of the app consumes.
 *
 * Keys combine as AND (a device must satisfy every provided key), except `deviceIds`, which is
 * unioned in afterwards, and `excludeDeviceIds`, which is subtracted last.
 */
export function resolveCompatibility(
  rule: CompatibilityRule,
  pool: DeviceModel[] = activeDevices,
): string[] {
  const hasFilter =
    rule.universal === true ||
    Boolean(rule.deviceTypes?.length || rule.brandIds?.length || rule.series?.length);

  const matched = hasFilter
    ? pool.filter((device) => {
        if (rule.deviceTypes?.length && !rule.deviceTypes.includes(device.type)) return false;
        if (rule.brandIds?.length && !rule.brandIds.includes(device.brandId)) return false;
        if (rule.series?.length && !rule.series.includes(device.series)) return false;
        return true;
      })
    : [];

  const ids = new Set(matched.map((device) => device.id));
  for (const id of rule.deviceIds ?? []) ids.add(id);
  for (const id of rule.excludeDeviceIds ?? []) ids.delete(id);
  return [...ids];
}

/** Turns authoring seeds into the public `Product` shape. */
export function buildProducts(seeds: ProductSeed[]): Product[] {
  return seeds.map(({ compatibility, slug, ...rest }) => ({
    ...rest,
    slug: slug ?? slugify(rest.name),
    compatibleDeviceIds: resolveCompatibility(compatibility),
  }));
}
