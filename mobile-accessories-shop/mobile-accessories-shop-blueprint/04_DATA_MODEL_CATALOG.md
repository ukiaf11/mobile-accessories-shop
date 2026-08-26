# Catalog & Data Model

## 1. Principle

Product data and device compatibility should be data-driven.

The UI must not contain long `if/else` trees for individual phone models.

## 2. Device Model

```ts
export type DeviceType = 'smartphone' | 'tablet';

export interface DeviceModel {
  id: string;
  type: DeviceType;
  brandId: string;
  series: string;
  name: string;
  aliases?: string[];
  active: boolean;
}
```

Example:

```ts
{
  id: 'samsung-galaxy-a55',
  type: 'smartphone',
  brandId: 'samsung',
  series: 'Galaxy A',
  name: 'Galaxy A55',
  active: true
}
```

## 3. Brand Model

```ts
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
}
```

## 4. Product Model

```ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price?: number;
  priceLabel?: string;
  images: string[];
  badges?: string[];
  tags?: string[];
  compatibleDeviceIds: string[];
  variants?: ProductVariant[];
  active: boolean;
  featured?: boolean;
}
```

## 5. Product Variant

```ts
export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  priceAdjustment?: number;
  available: boolean;
}
```

Examples:

- Color: Black
- Color: Blue
- Finish: Matte
- Type: Privacy
- Size: 10,000 mAh

## 6. Category Model

```ts
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  image?: string;
  active: boolean;
}
```

## 7. Cart Model

```ts
export interface CartItem {
  productId: string;
  productName: string;
  deviceId?: string;
  deviceName?: string;
  quantity: number;
  unitPrice?: number;
  variantId?: string;
  variantName?: string;
}
```

## 8. Suggested Catalog Categories

```ts
[
  'cases',
  'screen-protection',
  'audio',
  'charging',
  'power',
  'holders',
  'tablet-accessories',
  'smart-accessories',
  'utility'
]
```

## 9. Device Compatibility Strategy

Use a many-to-many conceptual relationship:

```text
DeviceModel
    |
    | compatibleDeviceIds
    v
Product
```

Example:

```text
Clear Case A
 -> iPhone 15
 -> iPhone 15 Plus
 -> iPhone 15 Pro
 -> iPhone 15 Pro Max
```

For large catalogs, prefer a compatibility map rather than duplicating product records.

## 10. Search Behavior

Search should match:

- Brand name.
- Model name.
- Series.
- Product name.
- Category.
- Product tags.

Example:

Searching `15 pro`

should find:

- iPhone 15 Pro case.
- iPhone 15 Pro tempered glass.
- iPhone 15 Pro camera protector.
- Compatible MagSafe accessories.

## 11. Future Database Tables

Phase 2 could use:

```text
brands
models
device_series
categories
products
product_variants
product_compatibility
orders
order_items
custom_requests
```

This preserves a clean migration path from static data to a dynamic catalog.
