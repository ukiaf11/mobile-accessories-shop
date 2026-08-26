import type { CompatibilityRule, DeviceModel, Product, ProductSeed } from '../types';
import { activeDevices, deviceById } from './devices';
import { brandById } from './brands';
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
  return seeds.map(({ compatibility, slug, ...rest }) => {
    const compatibleDeviceIds = resolveCompatibility(compatibility);
    return {
      ...rest,
      slug: slug ?? slugify(rest.name),
      compatibleDeviceIds,
      searchText: buildSearchText(rest, compatibleDeviceIds),
    };
  });
}

/**
 * The search haystack, built once. This used to be assembled inside the filter predicate:
 * for every product, slice 400 device ids, look each one up, join the names and lowercase
 * the result — on every keystroke. Blueprint 04 section 10 defines what search must match.
 */
function buildSearchText(
  rest: Omit<ProductSeed, 'compatibility' | 'slug'>,
  compatibleDeviceIds: string[],
): string {
  const deviceWords = new Set<string>();
  for (const id of compatibleDeviceIds) {
    const device = deviceById.get(id);
    if (!device) continue;
    deviceWords.add(device.name);
    deviceWords.add(device.series);
    const brand = brandById.get(device.brandId);
    if (brand) deviceWords.add(brand.name);
    for (const alias of device.aliases ?? []) deviceWords.add(alias);
  }

  /*
   * Badges are deliberately NOT indexed. Blueprint 04 section 10 lists brand, model,
   * series, product name, category and tags; badges are merchandising labels already
   * shown as chips. Indexing them made every "Popular"-badged product match the query
   * "pop" — 13 results where there had been 1, burying the actual Pop Grip.
   */
  return [
    rest.name,
    rest.description,
    rest.categoryId,
    ...(rest.tags ?? []),
    ...deviceWords,
  ].join(' ').toLowerCase();
}
