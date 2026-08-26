import type { Product, ProductSeed, ProductVariant } from '../types';
import { buildProducts } from './compatibility';

/**
 * Catalog seeds.
 *
 * `compatibility` is a rule, not a list — see `compatibility.ts`. A product line such as
 * "Clear Shockproof Case" genuinely exists for most models; the shop stocks the cut that fits
 * the customer's phone. Model-locked lines (MagSafe, foldables, tablets) restrict by brand or
 * series so the finder never offers something that cannot fit.
 */

const colors = (...values: string[]): ProductVariant[] =>
  values.map((value) => ({
    id: `color-${value.toLowerCase().replace(/\s+/g, '-')}`,
    name: 'Color',
    value,
    available: true,
  }));

const APPLE_MAGSAFE_SERIES = ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'];

const seeds: ProductSeed[] = [
  // ─────────────────────────────── Cases & Covers ───────────────────────────────
  {
    id: 'case-clear-shockproof',
    name: 'Clear Shockproof Case',
    categoryId: 'cases',
    description:
      'Crystal-clear TPU back with a raised camera lip and reinforced air-cushion corners. ' +
      'Anti-yellowing coating keeps it clear far longer than a plain silicone cover.',
    price: 299,
    images: ['case-clear'],
    badges: ['Best Seller'],
    tags: ['Transparent', 'Shockproof', 'Camera Protection'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'case-rugged-armor',
    name: 'Rugged Armor Defence Case',
    categoryId: 'cases',
    description:
      'Twin-layer polycarbonate shell over a shock-absorbing inner core. Rated for repeated ' +
      'drops onto hard floors — the cover to pick if the phone lives on a bike or a work site.',
    price: 549,
    images: ['case-rugged'],
    badges: ['Popular'],
    tags: ['Shockproof', 'Premium'],
    variants: colors('Matte Black', 'Navy', 'Olive'),
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'case-silicone-soft',
    name: 'Liquid Silicone Soft-Touch Case',
    categoryId: 'cases',
    description:
      'Smooth liquid-silicone exterior with a microfibre lining so the back glass never picks up ' +
      'scratches. Slim enough for a pocket, grippy enough for one-hand use.',
    price: 399,
    images: ['case-silicone'],
    tags: ['Premium'],
    variants: colors('Midnight', 'Sand', 'Sky Blue', 'Lavender', 'Red'),
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'case-magsafe-clear',
    name: 'MagSafe Clear Case',
    categoryId: 'cases',
    description:
      'Built-in magnet ring aligned to Apple MagSafe. Snaps to MagSafe chargers, car mounts and ' +
      'wallets without losing the clear finish.',
    price: 899,
    images: ['case-magsafe'],
    badges: ['New'],
    tags: ['MagSafe', 'Transparent', 'Wireless', 'Premium'],
    compatibility: { brandIds: ['apple'], series: APPLE_MAGSAFE_SERIES },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'case-magsafe-frosted',
    name: 'MagSafe Frosted Hard Case',
    categoryId: 'cases',
    description:
      'Matte frosted back that resists fingerprints, with a strong magnet array and metal camera ' +
      'ring. Slim profile that still clears wireless charging.',
    price: 999,
    images: ['case-magsafe'],
    tags: ['MagSafe', 'Wireless', 'Premium', 'Camera Protection'],
    variants: colors('Graphite', 'Deep Purple', 'Forest'),
    compatibility: { brandIds: ['apple'], series: APPLE_MAGSAFE_SERIES },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'case-wallet-leather',
    name: 'Leather Wallet Case',
    categoryId: 'cases',
    description:
      'PU leather folio with three card slots and a cash pocket. Magnetic flap closure and a ' +
      'fold-back stand for video.',
    price: 749,
    images: ['case-wallet'],
    tags: ['Premium'],
    variants: colors('Tan', 'Black', 'Coffee'),
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'case-flip-cover',
    name: 'Vintage Flip Cover',
    categoryId: 'cases',
    description:
      'Front-and-back flip cover with a soft inner lining and precise cut-outs. Protects the ' +
      'screen in a bag without adding a screen protector.',
    price: 449,
    images: ['case-flip'],
    tags: [],
    variants: colors('Brown', 'Black', 'Maroon'),
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'case-camera-guard',
    name: 'Camera-Guard Slide Case',
    categoryId: 'cases',
    description:
      'Sliding metal shutter covers the rear camera when it is not in use, plus a raised bezel ' +
      'that keeps the lens off the table.',
    price: 499,
    images: ['case-rugged'],
    badges: ['Popular'],
    tags: ['Camera Protection', 'Shockproof'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'case-fold-hinge',
    name: 'Foldable Hinge-Protect Case',
    categoryId: 'cases',
    description:
      'Two-piece shell shaped for a folding phone, with a hinge guard and an S-Pen loop where ' +
      'the model supports one.',
    price: 1299,
    images: ['case-rugged'],
    tags: ['Foldable', 'Shockproof', 'Premium'],
    compatibility: { series: ['Galaxy Z Fold', 'Galaxy Z Flip'] },
    availability: 'low-stock',
    active: true,
  },
  {
    id: 'case-bumper-metal',
    name: 'Metal Bumper Frame',
    categoryId: 'cases',
    description:
      'Aluminium alloy frame that guards the edges while leaving the back glass fully visible. ' +
      'Adds almost no thickness.',
    price: 649,
    images: ['case-clear'],
    tags: ['Premium', 'Transparent'],
    compatibility: {
      brandIds: ['apple', 'samsung', 'oneplus', 'google'],
      deviceTypes: ['smartphone'],
    },
    availability: 'made-to-order',
    active: true,
  },
  {
    id: 'case-back-skin',
    name: 'Textured Back Skin',
    categoryId: 'cases',
    description:
      'Self-adhesive carbon or leather-grain skin for the back panel. Adds grip and hides ' +
      'existing scuffs without any extra bulk.',
    price: 199,
    images: ['back-skin'],
    tags: [],
    variants: [
      { id: 'finish-carbon', name: 'Finish', value: 'Carbon Fibre', available: true },
      { id: 'finish-leather', name: 'Finish', value: 'Leather Grain', available: true },
      { id: 'finish-brushed', name: 'Finish', value: 'Brushed Metal', available: true },
    ],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },

  // ─────────────────────────────── Tempered Glass ───────────────────────────────
  {
    id: 'glass-full-glue',
    name: 'Full-Glue Tempered Glass',
    categoryId: 'screen-protection',
    description:
      '9H edge-to-edge glass with adhesive across the whole panel, so there are no rainbow edges ' +
      'and no lifting at the corners. Free fitting in shop.',
    price: 199,
    images: ['glass-standard'],
    badges: ['Best Seller'],
    tags: ['Anti-Glare'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'glass-privacy',
    name: 'Privacy Tempered Glass',
    categoryId: 'screen-protection',
    description:
      'Blocks side viewing angles beyond about 28°, so the person next to you sees a dark screen. ' +
      'Full-glue edges, 9H hardness.',
    price: 449,
    images: ['glass-privacy'],
    badges: ['Popular'],
    tags: ['Privacy', 'Premium'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'glass-matte',
    name: 'Matte Anti-Glare Glass',
    categoryId: 'screen-protection',
    description:
      'Frosted finish that kills reflections outdoors and leaves a smooth, paper-like feel for ' +
      'gaming. Slight softening of the display.',
    price: 349,
    images: ['glass-matte'],
    tags: ['Anti-Glare'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'glass-hydrogel',
    name: 'Hydrogel Screen Film',
    categoryId: 'screen-protection',
    description:
      'Flexible self-healing film that wraps a curved display where rigid glass cannot sit ' +
      'flat. The right pick for curved-edge flagships.',
    price: 249,
    images: ['glass-hydrogel'],
    tags: [],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'glass-camera-lens',
    name: 'Camera Lens Protector',
    categoryId: 'screen-protection',
    description:
      'Individual tempered rings over each rear lens. Keeps sand and key scratches off the ' +
      'camera glass without affecting photos.',
    price: 179,
    images: ['lens-ring'],
    badges: ['Popular'],
    tags: ['Camera Protection'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'glass-tablet',
    name: 'Tablet Tempered Glass',
    categoryId: 'screen-protection',
    description:
      '9H glass cut for tablet displays, with an oleophobic layer that keeps fingerprints down ' +
      'on a large screen.',
    price: 599,
    images: ['glass-standard'],
    tags: [],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'glass-paperlike-tablet',
    name: 'Paper-Feel Drawing Film',
    categoryId: 'screen-protection',
    description:
      'Textured film that gives a pencil real resistance on a tablet screen. Removable, so the ' +
      'glossy display comes back when you want it.',
    price: 699,
    images: ['glass-matte'],
    tags: ['Anti-Glare', 'Premium'],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'low-stock',
    active: true,
  },

  // ─────────────────────────────────── Audio ────────────────────────────────────
  {
    id: 'audio-tws-pro',
    name: 'TWS Earbuds Pro (ENC)',
    categoryId: 'audio',
    description:
      'True wireless earbuds with environmental noise cancellation on calls, ~40 hours total ' +
      'with the case, and a low-latency gaming mode.',
    price: 1499,
    images: ['earbuds'],
    badges: ['Best Seller'],
    tags: ['Premium', 'Wireless'],
    variants: colors('White', 'Black'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'audio-tws-lite',
    name: 'TWS Earbuds Lite',
    categoryId: 'audio',
    description:
      'Everyday true-wireless buds with touch controls and a USB-C case. Comfortable enough for ' +
      'a full commute, priced for a spare pair.',
    price: 899,
    images: ['earbuds'],
    tags: ['Wireless'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'audio-neckband',
    name: 'Bluetooth Neckband',
    categoryId: 'audio',
    description:
      'Magnetic-bud neckband with around 30 hours of playback and fast pairing. Harder to lose ' +
      'than earbuds and better for long calls.',
    price: 799,
    images: ['neckband'],
    badges: ['Popular'],
    tags: ['Wireless'],
    variants: colors('Black', 'Blue', 'Red'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'audio-wired-typec',
    name: 'USB-C Wired Earphones',
    categoryId: 'audio',
    description:
      'In-line mic and volume controls over a USB-C plug, for phones with no headphone jack. ' +
      'No pairing, no charging.',
    price: 349,
    images: ['wired-earphone'],
    tags: [],
    compatibility: {
      deviceTypes: ['smartphone', 'tablet'],
      excludeDeviceIds: [
        'apple-iphone-11', 'apple-iphone-11-pro', 'apple-iphone-11-pro-max',
        'apple-iphone-12-mini', 'apple-iphone-12', 'apple-iphone-12-pro', 'apple-iphone-12-pro-max',
        'apple-iphone-13-mini', 'apple-iphone-13', 'apple-iphone-13-pro', 'apple-iphone-13-pro-max',
        'apple-iphone-14', 'apple-iphone-14-plus', 'apple-iphone-14-pro', 'apple-iphone-14-pro-max',
        'apple-iphone-se-2020', 'apple-iphone-se-2022',
        'apple-ipad-9th-gen',
      ],
    },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'audio-wired-lightning',
    name: 'Lightning Wired Earphones',
    categoryId: 'audio',
    description:
      'Lightning-plug earphones for iPhone models up to the 14 series, with an in-line remote.',
    price: 499,
    images: ['wired-earphone'],
    tags: [],
    compatibility: {
      brandIds: ['apple'],
      series: ['iPhone SE', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14'],
    },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'audio-wired-35mm',
    name: '3.5mm Wired Earphones',
    categoryId: 'audio',
    description:
      'Classic 3.5mm earphones with a braided cable and in-line mic. Works with any phone that ' +
      'still has a jack, and with an OTG dongle where it does not.',
    price: 249,
    images: ['wired-earphone'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'audio-speaker-mini',
    name: 'Mini Bluetooth Speaker',
    categoryId: 'audio',
    description:
      'Pocket speaker with a surprisingly full low end, IPX5 splash resistance and a wrist strap. ' +
      'Around 8 hours per charge.',
    price: 1199,
    images: ['speaker'],
    tags: ['Wireless'],
    variants: colors('Black', 'Teal', 'Orange'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'audio-speaker-party',
    name: 'Party Bluetooth Speaker 20W',
    categoryId: 'audio',
    description:
      '20W stereo speaker with RGB lighting, TWS pairing for a second unit, and an aux/SD input.',
    price: 2799,
    images: ['speaker'],
    badges: ['New'],
    tags: ['Wireless', 'Premium'],
    compatibility: { universal: true },
    availability: 'low-stock',
    active: true,
  },

  // ────────────────────────────────── Charging ──────────────────────────────────
  {
    id: 'charge-cable-typec',
    name: 'USB-C to USB-C Braided Cable',
    categoryId: 'charging',
    description:
      '100W braided cable rated for 10,000+ bends, with reinforced strain relief at both ends. ' +
      '1 m and 2 m lengths.',
    price: 299,
    images: ['cable'],
    badges: ['Best Seller'],
    tags: ['Fast Charging'],
    variants: [
      { id: 'len-1m', name: 'Length', value: '1 metre', available: true },
      { id: 'len-2m', name: 'Length', value: '2 metres', priceAdjustment: 80, available: true },
    ],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'charge-cable-lightning',
    name: 'USB-C to Lightning Cable',
    categoryId: 'charging',
    description:
      'Fast-charge cable for iPhone models up to the 14 series and Lightning iPads. Nylon braid, ' +
      '1 m.',
    price: 449,
    images: ['cable'],
    tags: ['Fast Charging'],
    compatibility: {
      brandIds: ['apple'],
      series: ['iPhone SE', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14'],
      deviceIds: ['apple-ipad-9th-gen'],
    },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-cable-micro',
    name: 'Micro-USB Fast Cable',
    categoryId: 'charging',
    description:
      '2.4A micro-USB cable with a thick copper core, for older phones, speakers and power banks.',
    price: 149,
    images: ['cable'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-adapter-33w',
    name: '33W Fast Charger',
    categoryId: 'charging',
    description:
      'Single-port fast adapter that covers most mid-range Android phones. Compact enough to ' +
      'leave in a bag.',
    price: 899,
    images: ['adapter'],
    badges: ['Popular'],
    tags: ['Fast Charging'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-adapter-pd-65w',
    name: '65W USB-C PD GaN Charger',
    categoryId: 'charging',
    description:
      'Gallium-nitride charger with two USB-C ports and one USB-A. Charges a phone and a laptop ' +
      'from one plug, and runs cool.',
    price: 1999,
    images: ['adapter'],
    badges: ['New'],
    tags: ['Fast Charging', 'Premium'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'charge-adapter-20w',
    name: '20W USB-C Power Adapter',
    categoryId: 'charging',
    description:
      'The right adapter for fast-charging an iPhone or iPad — around 50% in half an hour.',
    price: 799,
    images: ['adapter'],
    tags: ['Fast Charging'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-car-dual',
    name: 'Dual-Port Car Charger',
    categoryId: 'charging',
    description:
      '38W car charger with one USB-C PD port and one Quick Charge USB-A port, plus a low-profile ' +
      'housing that sits flush in the socket.',
    price: 649,
    images: ['car-charger'],
    tags: ['Fast Charging'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-wireless-pad',
    name: '15W Wireless Charging Pad',
    categoryId: 'charging',
    description:
      'Qi pad with a non-slip surface and foreign-object detection. Works through most cases up ' +
      'to about 4 mm.',
    price: 999,
    images: ['wireless-pad'],
    tags: ['Wireless', 'Fast Charging'],
    compatibility: {
      deviceTypes: ['smartphone'],
      brandIds: ['apple', 'samsung', 'google', 'oneplus', 'xiaomi', 'oppo', 'vivo', 'motorola', 'nothing', 'honor', 'huawei', 'asus'],
    },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-magsafe-puck',
    name: 'MagSafe Magnetic Charger',
    categoryId: 'charging',
    description:
      'Magnetically aligned 15W charger that snaps to the back of a MagSafe iPhone or a MagSafe ' +
      'case. Braided 1.5 m lead.',
    price: 1699,
    images: ['wireless-pad'],
    badges: ['New'],
    tags: ['MagSafe', 'Wireless', 'Premium'],
    compatibility: { brandIds: ['apple'], series: APPLE_MAGSAFE_SERIES },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'charge-magsafe-stand',
    name: '3-in-1 Magnetic Charging Stand',
    categoryId: 'charging',
    description:
      'Folding stand that charges phone, earbuds and a watch at once. Angle adjusts for ' +
      'StandBy-style bedside use.',
    price: 2999,
    images: ['wireless-pad'],
    tags: ['MagSafe', 'Wireless', 'Premium'],
    compatibility: { brandIds: ['apple'], series: APPLE_MAGSAFE_SERIES },
    availability: 'made-to-order',
    active: true,
  },
  {
    id: 'charge-travel-kit',
    name: 'Travel Charging Kit',
    categoryId: 'charging',
    description:
      'Zip case holding a 20W adapter, a 1 m USB-C cable, a Lightning tip and a universal travel ' +
      'plug. One thing to grab before a trip.',
    price: 1299,
    images: ['adapter'],
    tags: ['Fast Charging'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },

  // ────────────────────────────────── Power ─────────────────────────────────────
  {
    id: 'power-10000',
    name: '10,000 mAh Slim Power Bank',
    categoryId: 'power',
    description:
      'Pocket-size 22.5W pack with USB-C in/out and a battery-percentage display. Roughly two ' +
      'full phone charges.',
    price: 1499,
    images: ['power-bank'],
    badges: ['Best Seller'],
    tags: ['Fast Charging'],
    variants: colors('Black', 'White'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'power-20000',
    name: '20,000 mAh Fast Power Bank',
    categoryId: 'power',
    description:
      '20,000 mAh with 22.5W output across three ports, so a phone, buds and a tablet can charge ' +
      'together on a long day out.',
    price: 2299,
    images: ['power-bank'],
    tags: ['Fast Charging'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'power-magsafe-bank',
    name: 'Magnetic Wireless Power Bank',
    categoryId: 'power',
    description:
      '5,000 mAh pack that clings to the back of a MagSafe iPhone and charges without a cable. ' +
      'Doubles as a kickstand.',
    price: 2499,
    images: ['power-bank'],
    badges: ['New'],
    tags: ['MagSafe', 'Wireless', 'Premium'],
    compatibility: { brandIds: ['apple'], series: APPLE_MAGSAFE_SERIES },
    availability: 'low-stock',
    active: true,
  },
  {
    id: 'power-mini-cable-bank',
    name: 'Mini Power Bank with Built-in Cable',
    categoryId: 'power',
    description:
      '5,000 mAh emergency pack with the USB-C cable built into the body — nothing extra to ' +
      'carry or forget.',
    price: 1099,
    images: ['power-bank'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },

  // ─────────────────────────── Holders & Stands ─────────────────────────────────
  {
    id: 'holder-foldable-stand',
    name: 'Foldable Aluminium Stand',
    categoryId: 'holders',
    description:
      'Folds flat to the size of a card and opens into a stable desk stand at any angle. Silicone ' +
      'pads keep the phone from sliding.',
    price: 399,
    images: ['stand'],
    badges: ['Popular'],
    tags: ['Premium'],
    variants: colors('Silver', 'Space Grey'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'holder-car-vent',
    name: 'Car Vent Phone Holder',
    categoryId: 'holders',
    description:
      'Spring-clamp mount that grips the AC vent without blocking it, and rotates between ' +
      'portrait and landscape.',
    price: 449,
    images: ['car-mount'],
    tags: [],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'holder-car-magnetic',
    name: 'Magnetic Car Mount',
    categoryId: 'holders',
    description:
      'Strong N52 magnet array on a ball joint. Pairs with a MagSafe phone or with the metal ' +
      'plate included in the box.',
    price: 799,
    images: ['car-mount'],
    tags: ['MagSafe'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'holder-ring-grip',
    name: 'Metal Ring Holder',
    categoryId: 'holders',
    description:
      '360° rotating finger ring with 3M adhesive. Works as a one-hand grip and a landscape ' +
      'kickstand, and clips onto a magnetic car mount.',
    price: 149,
    images: ['ring-holder'],
    tags: [],
    variants: colors('Silver', 'Black', 'Rose Gold'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'holder-popgrip',
    name: 'Collapsible Pop Grip',
    categoryId: 'holders',
    description:
      'Expanding grip that presses flat when not in use. Swappable top so the design can change ' +
      'without replacing the base.',
    price: 249,
    images: ['ring-holder'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'holder-selfie-tripod',
    name: 'Selfie Stick Tripod with Remote',
    categoryId: 'holders',
    description:
      'Extends to about 1 m, folds into three tripod legs, and includes a detachable Bluetooth ' +
      'shutter remote.',
    price: 899,
    images: ['tripod'],
    badges: ['Popular'],
    tags: ['Wireless'],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'holder-tripod-desk',
    name: 'Desk Tripod with Phone Clamp',
    categoryId: 'holders',
    description:
      'Short aluminium tripod with a ball head and a spring clamp — for recording, video calls ' +
      'and product photos.',
    price: 749,
    images: ['tripod'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'holder-tablet-stand',
    name: 'Adjustable Tablet Stand',
    categoryId: 'holders',
    description:
      'Weighted aluminium stand with a wide cradle sized for tablets, adjustable through a broad ' +
      'range of angles.',
    price: 1099,
    images: ['stand'],
    tags: ['Premium'],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'in-stock',
    active: true,
  },

  // ─────────────────────── Tablet Accessories ───────────────────────────────────
  {
    id: 'tablet-folio-case',
    name: 'Tablet Folio Smart Case',
    categoryId: 'tablet-accessories',
    description:
      'Tri-fold folio with auto sleep/wake, a pencil holder and multiple standing angles for ' +
      'typing or watching.',
    price: 1299,
    images: ['tablet-folio'],
    badges: ['Popular'],
    tags: ['Premium'],
    variants: colors('Black', 'Navy', 'Grey'),
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'in-stock',
    active: true,
    featured: true,
  },
  {
    id: 'tablet-rugged-case',
    name: 'Rugged Tablet Case with Handle',
    categoryId: 'tablet-accessories',
    description:
      'Heavy-duty shell with a rotating hand strap and a built-in stand. Made for site work, ' +
      'classrooms and kids.',
    price: 1699,
    images: ['tablet-folio'],
    tags: ['Shockproof'],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'low-stock',
    active: true,
  },
  {
    id: 'tablet-sleeve',
    name: 'Padded Tablet Sleeve',
    categoryId: 'tablet-accessories',
    description:
      'Water-resistant sleeve with a fleece lining and a front pocket for a charger and cable. ' +
      '11-inch and 13-inch sizes.',
    price: 899,
    images: ['sleeve'],
    tags: [],
    variants: [
      { id: 'size-11', name: 'Size', value: '11-inch', available: true },
      { id: 'size-13', name: 'Size', value: '13-inch', priceAdjustment: 150, available: true },
    ],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'tablet-stylus',
    name: 'Universal Capacitive Stylus',
    categoryId: 'tablet-accessories',
    description:
      'Rechargeable stylus with a 1.5 mm tip and palm rejection on supported tablets. Magnetic ' +
      'body sticks to the side of the device.',
    price: 1499,
    images: ['stylus'],
    badges: ['New'],
    tags: ['Premium'],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'tablet-keyboard-case',
    name: 'Keyboard Folio Case',
    categoryId: 'tablet-accessories',
    description:
      'Detachable Bluetooth keyboard with a trackpad and backlit keys, in a folio that props the ' +
      'tablet at a laptop angle.',
    priceLabel: 'Ask price',
    images: ['tablet-folio'],
    tags: ['Premium', 'Wireless'],
    compatibility: { deviceTypes: ['tablet'] },
    availability: 'made-to-order',
    active: true,
  },

  // ─────────────────────── Smart Accessories ────────────────────────────────────
  {
    id: 'smart-watch-strap-silicone',
    name: 'Silicone Smartwatch Strap',
    categoryId: 'smart-accessories',
    description:
      'Soft sport strap in the common 20 mm and 22 mm lug widths, plus Apple Watch fittings. ' +
      'Sweat-resistant and quick to swap.',
    price: 299,
    images: ['watch-strap'],
    badges: ['Popular'],
    tags: [],
    variants: [
      { id: 'fit-20mm', name: 'Fitting', value: '20 mm', available: true },
      { id: 'fit-22mm', name: 'Fitting', value: '22 mm', available: true },
      { id: 'fit-apple', name: 'Fitting', value: 'Apple Watch 42/44/45 mm', available: true },
    ],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'smart-watch-strap-metal',
    name: 'Stainless Steel Watch Strap',
    categoryId: 'smart-accessories',
    description:
      'Milanese-style magnetic mesh strap that adjusts anywhere along its length. Dresses a ' +
      'sport watch up instantly.',
    price: 799,
    images: ['watch-strap'],
    tags: ['Premium'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'smart-watch-glass',
    name: 'Smartwatch Screen Guard',
    categoryId: 'smart-accessories',
    description:
      'Curved-edge film for round and square watch faces, sold as a pack of two.',
    price: 199,
    images: ['glass-standard'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'smart-tag-tracker',
    name: 'Bluetooth Item Tracker',
    categoryId: 'smart-accessories',
    description:
      'Keyring tracker that rings from your phone and shows its last known location. Around a ' +
      'year on a replaceable coin cell.',
    price: 1299,
    images: ['tracker'],
    badges: ['New'],
    tags: ['Wireless'],
    compatibility: { universal: true },
    availability: 'low-stock',
    active: true,
  },

  // ────────────────────────────────── Utility ───────────────────────────────────
  {
    id: 'util-otg-adapter',
    name: 'USB-C OTG Adapter',
    categoryId: 'utility',
    description:
      'Plugs a pen drive, keyboard or wired headset into a USB-C phone. Aluminium shell, keyring ' +
      'loop so it does not get lost.',
    price: 199,
    images: ['otg'],
    badges: ['Popular'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-typec-hub',
    name: '6-in-1 USB-C Hub',
    categoryId: 'utility',
    description:
      'HDMI, two USB-A, USB-C power delivery, SD and microSD from a single port — for tablets and ' +
      'phones with desktop modes.',
    price: 2199,
    images: ['hub'],
    tags: ['Premium'],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-card-reader',
    name: 'SD / microSD Card Reader',
    categoryId: 'utility',
    description:
      'Dual-slot reader with USB-C and USB-A ends. Pulls photos off a camera card straight into ' +
      'a phone.',
    price: 449,
    images: ['card-reader'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-sim-tool',
    name: 'SIM Ejector Tool (Pack of 5)',
    categoryId: 'utility',
    description:
      'Stainless ejector pins in a small holder, so there is always one in the drawer when a SIM ' +
      'needs changing.',
    price: 49,
    images: ['sim-tool'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-cleaning-kit',
    name: 'Screen Cleaning Kit',
    categoryId: 'utility',
    description:
      'Alcohol-free spray, microfibre cloth and a port brush. Safe on oleophobic coatings, unlike ' +
      'household cleaners.',
    price: 299,
    images: ['cleaning-kit'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-hand-fan',
    name: 'Mini Rechargeable Hand Fan',
    categoryId: 'utility',
    description:
      'Three-speed folding fan that stands on a desk or clips to a bag. USB-C charging, several ' +
      'hours per charge.',
    price: 599,
    images: ['hand-fan'],
    badges: ['Popular'],
    tags: [],
    variants: colors('White', 'Pink', 'Blue'),
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-cable-organizer',
    name: 'Cable Organiser Pouch',
    categoryId: 'utility',
    description:
      'Elastic-loop pouch that holds a charger, two cables, earbuds and a power bank without ' +
      'them tangling.',
    price: 449,
    images: ['sleeve'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-phone-holder-neck',
    name: 'Neck Phone Holder',
    categoryId: 'utility',
    description:
      'Bendable neck mount for hands-free video in bed or in the kitchen. Holds most phone sizes ' +
      'with a case on.',
    price: 549,
    images: ['stand'],
    tags: [],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'made-to-order',
    active: true,
  },
  {
    id: 'util-gaming-triggers',
    name: 'Mobile Gaming Trigger Buttons',
    categoryId: 'utility',
    description:
      'Metal shoulder triggers that clip to the top edge of the phone for shooters. No battery, ' +
      'no pairing.',
    price: 399,
    images: ['triggers'],
    tags: [],
    compatibility: { deviceTypes: ['smartphone'] },
    availability: 'in-stock',
    active: true,
  },
  {
    id: 'util-audio-splitter',
    name: 'USB-C Audio + Charge Splitter',
    categoryId: 'utility',
    description:
      'Charge the phone and use wired headphones at the same time on a single USB-C port.',
    price: 649,
    images: ['otg'],
    tags: [],
    compatibility: { universal: true },
    availability: 'in-stock',
    active: true,
  },
];

export const products: Product[] = buildProducts(seeds);

export const productById = new Map(products.map((product) => [product.id, product]));

export const featuredProducts = products.filter((product) => product.featured && product.active);

export const activeProducts = products.filter((product) => product.active);
