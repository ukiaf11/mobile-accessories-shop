import type { Category } from '../types';

/** Icon values are Lucide component names, mapped in `src/lib/icons.ts`. */
export const categories: Category[] = [
  {
    id: 'cases',
    name: 'Cases & Covers',
    slug: 'cases',
    description: 'Clear, rugged, MagSafe, wallet and flip covers cut for your exact model.',
    icon: 'Smartphone',
    active: true,
  },
  {
    id: 'screen-protection',
    name: 'Tempered Glass',
    slug: 'tempered-glass',
    description: 'Full-glue, privacy, matte and hydrogel protection — fitted free in shop.',
    icon: 'ShieldCheck',
    active: true,
  },
  {
    id: 'audio',
    name: 'Audio',
    slug: 'audio',
    description: 'TWS earbuds, neckbands, wired earphones and Bluetooth speakers.',
    icon: 'Headphones',
    active: true,
  },
  {
    id: 'charging',
    name: 'Charging',
    slug: 'charging',
    description: 'Fast chargers, USB-C PD adapters, car chargers and durable cables.',
    icon: 'Zap',
    active: true,
  },
  {
    id: 'power',
    name: 'Power Banks',
    slug: 'power',
    description: 'Pocket 10,000 mAh packs up to 20,000 mAh fast-charging power banks.',
    icon: 'BatteryCharging',
    active: true,
  },
  {
    id: 'holders',
    name: 'Holders & Stands',
    slug: 'holders',
    description: 'Car mounts, foldable stands, ring grips, tripods and selfie sticks.',
    icon: 'Move3d',
    active: true,
  },
  {
    id: 'tablet-accessories',
    name: 'Tablet Accessories',
    slug: 'tablet-accessories',
    description: 'Tablet folios, glass, sleeves and stands for iPad and Galaxy Tab.',
    icon: 'Tablet',
    active: true,
  },
  {
    id: 'smart-accessories',
    name: 'Smart Accessories',
    slug: 'smart-accessories',
    description: 'Smartwatch straps, watch glass and everyday wearables.',
    icon: 'Watch',
    active: true,
  },
  {
    id: 'utility',
    name: 'Utility',
    slug: 'utility',
    description: 'OTG adapters, hubs, card readers, cleaning kits and hand fans.',
    icon: 'Wrench',
    active: true,
  },
];

export const categoryById = new Map(categories.map((category) => [category.id, category]));

export function categoryName(id: string | undefined): string {
  return (id && categoryById.get(id)?.name) || 'Other';
}

/** Feature tags surfaced as filter chips. Blueprint FR-05. */
export const featureTags = [
  'MagSafe',
  'Shockproof',
  'Transparent',
  'Privacy',
  'Fast Charging',
  'Wireless',
  'Foldable',
  'Premium',
  'Anti-Glare',
  'Camera Protection',
] as const;

export type FeatureTag = (typeof featureTags)[number];
