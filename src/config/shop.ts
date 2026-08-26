/**
 * Single source of truth for shop identity.
 *
 * Everything the customer reads — navbar, hero, footer, emails, SEO tags — comes from here.
 * Replace the placeholder values below with the real shop details; nothing else needs editing.
 */
export const shop = {
  /** TODO(owner): replace with the real shop name. */
  name: 'Mobile Accessories Shop',
  /** Short form used in tight spaces such as the mobile navbar. */
  shortName: 'MAS',
  tagline: 'Covers, tempered glass & mobile accessories for almost every phone model.',
  description:
    'Model-specific phone cases, tempered glass, chargers, audio and everyday mobile ' +
    'accessories. Tell us your exact phone model and we confirm the right fit before you buy.',

  /** TODO(owner): replace with the shop phone number in international format. */
  phone: '+91 00000 00000',
  /** Digits only — used to build tel: and wa.me links. */
  phoneDigits: '910000000000',
  whatsapp: '910000000000',
  /** TODO(owner): where order request emails should land. Server-side only in production. */
  email: 'owner@example.com',

  address: {
    line1: 'Shop No. 00, Ground Floor',
    line2: 'Main Market Road',
    city: 'Your City',
    state: 'Your State',
    pincode: '000000',
    country: 'India',
    /** TODO(owner): paste the Google Maps share link for the shop. */
    mapsUrl: 'https://maps.google.com/',
  },

  hours: [
    { days: 'Monday – Saturday', time: '10:00 AM – 8:30 PM' },
    { days: 'Sunday', time: '11:00 AM – 6:00 PM' },
  ],

  social: {
    instagram: '',
    facebook: '',
  },

  /** Shown in the announcement bar. Set to an empty string to hide the bar. */
  announcement: 'Free fitting on tempered glass · Same-day pickup on most in-stock accessories',

  /** Currency for all prices. The catalog is authored in paise-free whole rupees. */
  currency: 'INR' as const,
  currencySymbol: '₹',
  locale: 'en-IN',

  /** Delivery is offered in addition to shop pickup. */
  deliveryEnabled: true,
  deliveryNote: 'Local delivery available. Charges confirmed on call.',

  /** Public site origin, used for canonical/OG tags. */
  siteUrl: 'https://www.yourshop.in',
} as const;

export type ShopConfig = typeof shop;

export const formattedAddress = [
  shop.address.line1,
  shop.address.line2,
  `${shop.address.city}, ${shop.address.state} ${shop.address.pincode}`,
].filter(Boolean).join(', ');
