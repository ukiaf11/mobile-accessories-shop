export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  /** Lucide icon name, resolved in `src/lib/icons.ts`. */
  icon: string;
  image?: string;
  active: boolean;
}

export interface ProductVariant {
  id: string;
  /** Variant axis, e.g. "Color", "Finish", "Type", "Size". */
  name: string;
  /** Variant value, e.g. "Black", "Matte", "Privacy", "10,000 mAh". */
  value: string;
  priceAdjustment?: number;
  available: boolean;
}

export type ProductBadge = 'Popular' | 'New' | 'Best Seller' | 'Limited';

export type Availability = 'in-stock' | 'low-stock' | 'made-to-order' | 'out-of-stock';

/**
 * Declarative compatibility. Products describe WHICH devices they fit rather than
 * listing every id, so the catalog stays small as models are added.
 * Blueprint 04_DATA_MODEL_CATALOG.md section 9.
 */
export interface CompatibilityRule {
  /** Fits every active device (cables, power banks, cleaning kits...). */
  universal?: boolean;
  /** Restrict to a device type. Combined with the other keys as AND. */
  deviceTypes?: import('./device').DeviceType[];
  brandIds?: string[];
  /** Matches `DeviceModel.series` exactly. */
  series?: string[];
  /** Explicit model ids, always included. */
  deviceIds?: string[];
  /** Model ids removed after every other rule has been applied. */
  excludeDeviceIds?: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  /** Absent means "price on request" — render `priceLabel` instead. */
  price?: number;
  priceLabel?: string;
  images: string[];
  badges?: ProductBadge[];
  tags?: string[];
  /** Resolved from `compatibility` at module load. Never hand-written. */
  compatibleDeviceIds: string[];
  /**
   * Lowercased brand + series + model + name + description + category + tags, joined
   * once at module load so free-text search is a substring test rather than a
   * rebuild-per-keystroke. Badges are excluded on purpose — see `buildSearchText`.
   */
  searchText: string;
  variants?: ProductVariant[];
  availability: Availability;
  active: boolean;
  featured?: boolean;
}

/** Authoring shape: what `src/data/products.ts` writes before rules are expanded. */
export type ProductSeed = Omit<Product, 'compatibleDeviceIds' | 'slug' | 'searchText'> & {
  slug?: string;
  compatibility: CompatibilityRule;
};
