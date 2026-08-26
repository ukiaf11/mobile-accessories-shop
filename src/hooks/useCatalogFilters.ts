import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DeviceType, Product, ResolvedDevice } from '../types';
import { activeDevices, deviceById } from '../data/devices';
import { brandName } from '../data/brands';
import { activeProducts } from '../data/products';
import { track } from '../lib/analytics';

/**
 * The one place catalog filtering happens.
 *
 * Blueprint 06_PROJECT_STRUCTURE.md section 2 is explicit that compatibility logic must not
 * live in components, and section 4 asks for shareable URLs such as
 * `/?device=iphone-15-pro&category=cases`. Both live here.
 */

export type SortKey = 'relevance' | 'price-low' | 'price-high' | 'name';

export interface CatalogFilters {
  deviceType: DeviceType;
  brandId: string | null;
  deviceId: string | null;
  categoryId: string | null;
  tags: string[];
  availableOnly: boolean;
  maxPrice: number | null;
  query: string;
  sort: SortKey;
}

const DEFAULTS: CatalogFilters = {
  deviceType: 'smartphone',
  brandId: null,
  deviceId: null,
  categoryId: null,
  tags: [],
  availableOnly: false,
  maxPrice: null,
  query: '',
  sort: 'relevance',
};

export const PRICE_CEILING = Math.max(
  ...activeProducts.map((product) => product.price ?? 0),
);

function readUrl(): CatalogFilters {
  if (typeof window === 'undefined') return DEFAULTS;
  const params = new URLSearchParams(window.location.search);
  const deviceId = params.get('device');
  const device = deviceId ? deviceById.get(deviceId) : undefined;
  const tags = params.get('tags');
  const maxPrice = Number(params.get('maxPrice'));

  return {
    ...DEFAULTS,
    deviceType: (params.get('type') as DeviceType) || device?.type || DEFAULTS.deviceType,
    brandId: params.get('brand') || device?.brandId || null,
    deviceId: device?.id ?? null,
    categoryId: params.get('category'),
    tags: tags ? tags.split(',').filter(Boolean) : [],
    availableOnly: params.get('inStock') === '1',
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : null,
    query: params.get('q') ?? '',
    sort: (params.get('sort') as SortKey) || DEFAULTS.sort,
  };
}

function writeUrl(filters: CatalogFilters): void {
  const params = new URLSearchParams();
  if (filters.deviceType !== DEFAULTS.deviceType) params.set('type', filters.deviceType);
  if (filters.brandId) params.set('brand', filters.brandId);
  if (filters.deviceId) params.set('device', filters.deviceId);
  if (filters.categoryId) params.set('category', filters.categoryId);
  if (filters.tags.length) params.set('tags', filters.tags.join(','));
  if (filters.availableOnly) params.set('inStock', '1');
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.query) params.set('q', filters.query);
  if (filters.sort !== DEFAULTS.sort) params.set('sort', filters.sort);

  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
}

const UNAVAILABLE = new Set(['out-of-stock']);

export function resolveDevice(deviceId: string | null): ResolvedDevice | null {
  if (!deviceId) return null;
  const device = deviceById.get(deviceId);
  if (!device) return null;
  return { ...device, brandName: brandName(device.brandId) };
}

/**
 * Matches a free-text query against brand, series, model, product, category and tags.
 * The haystack is precomputed in `buildProducts`, so this is a substring test rather than
 * a per-keystroke rebuild of a ~312 KB string.
 */
function matchesQuery(product: Product, terms: string[]): boolean {
  if (terms.length === 0) return true;
  return terms.every((term) => product.searchText.includes(term));
}

export function useCatalogFilters() {
  const [filters, setFilters] = useState<CatalogFilters>(readUrl);

  useEffect(() => {
    writeUrl(filters);
  }, [filters]);

  // Browser back/forward should restore the filter state the URL describes.
  useEffect(() => {
    const onPopState = () => setFilters(readUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const patch = useCallback((next: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...next }));
  }, []);

  const selectDeviceType = useCallback((deviceType: DeviceType) => {
    // Switching type invalidates a brand/model chosen for the other type.
    setFilters((current) => ({ ...current, deviceType, brandId: null, deviceId: null }));
  }, []);

  const selectBrand = useCallback((brandId: string | null) => {
    setFilters((current) => ({ ...current, brandId, deviceId: null }));
  }, []);

  const selectDevice = useCallback((deviceId: string | null) => {
    setFilters((current) => {
      const device = deviceId ? deviceById.get(deviceId) : undefined;
      if (device) {
        track('device_selected', { brand: device.brandId, model: device.id });
      }
      return {
        ...current,
        deviceId: device?.id ?? null,
        brandId: device?.brandId ?? current.brandId,
        deviceType: device?.type ?? current.deviceType,
      };
    });
  }, []);

  const selectCategory = useCallback((categoryId: string | null) => {
    if (categoryId) track('category_selected', { category: categoryId });
    setFilters((current) => ({
      ...current,
      categoryId: current.categoryId === categoryId ? null : categoryId,
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((entry) => entry !== tag)
        : [...current.tags, tag],
    }));
  }, []);

  const reset = useCallback(() => setFilters({ ...DEFAULTS }), []);

  const selectedDevice = useMemo(() => resolveDevice(filters.deviceId), [filters.deviceId]);

  /** Products compatible with the chosen model, before the cosmetic filters run. */
  const compatibleProducts = useMemo(() => {
    if (!filters.deviceId) {
      // With no model chosen, restrict to products that fit the chosen device *type*
      // so a phone shopper is never shown a tablet folio.
      const typeIds = new Set(
        activeDevices.filter((device) => device.type === filters.deviceType).map((d) => d.id),
      );
      return activeProducts.filter((product) =>
        product.compatibleDeviceIds.some((id) => typeIds.has(id)),
      );
    }
    return activeProducts.filter((product) =>
      product.compatibleDeviceIds.includes(filters.deviceId!),
    );
  }, [filters.deviceId, filters.deviceType]);

  const results = useMemo(() => {
    const terms = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = compatibleProducts.filter((product) => {
      if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
      if (filters.availableOnly && UNAVAILABLE.has(product.availability)) return false;
      if (filters.maxPrice !== null && (product.price ?? 0) > filters.maxPrice) return false;
      if (filters.tags.length && !filters.tags.every((tag) => product.tags?.includes(tag))) {
        return false;
      }
      return matchesQuery(product, terms);
    });

    const sorted = [...filtered];
    switch (filters.sort) {
      case 'price-low':
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Relevance: featured first, then in-stock, then cheapest.
        sorted.sort((a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          Number(UNAVAILABLE.has(a.availability)) - Number(UNAVAILABLE.has(b.availability)) ||
          (a.price ?? Infinity) - (b.price ?? Infinity),
        );
    }
    return sorted;
  }, [compatibleProducts, filters]);

  /** Result counts per category, so empty categories can be dimmed rather than hidden. */
  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of compatibleProducts) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [compatibleProducts]);

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    filters.tags.length +
    (filters.availableOnly ? 1 : 0) +
    (filters.maxPrice !== null ? 1 : 0) +
    (filters.query.trim() ? 1 : 0);

  return {
    filters,
    patch,
    selectDeviceType,
    selectBrand,
    selectDevice,
    selectCategory,
    toggleTag,
    reset,
    selectedDevice,
    results,
    countsByCategory,
    compatibleCount: compatibleProducts.length,
    activeFilterCount,
  };
}

export type CatalogController = ReturnType<typeof useCatalogFilters>;
