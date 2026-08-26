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
  phone: '+91 79911 52081',
  /** Digits only — used to build tel: and wa.me links. */
  phoneDigits: '917991152081',
  whatsapp: '917991152081',
  /** TODO(owner): where order request emails should land. Server-side only in production. */
  email: 'satya995587@gmail.com',

  address: {
    line1: '17, Raipur Khadar Main Rd, Raipur Khadar, Sector 126, Noida, Uttar Pradesh 201313',
    line2: 'Noida Sector 126',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201313',
    country: 'India',
    /** TODO(owner): paste the Google Maps share link for the shop. */
    mapsUrl: 'https://maps.app.goo.gl/Ahabx9TPCii4QUhJ6?g_st=ac',
  },

  hours: [
    { days: 'Monday – Saturday', time: '10:00 AM – 8:30 PM' },
    // { days: 'Saturday', time: '11:00 AM – 6:00 PM' },
  ],

  social: {
    instagram: 'https://www.instagram.com/satya_kuswaha04?igsi=Y2l0cnJqMThiaG1m',
    facebook: 'https://www.facebook.com/share/1E9k43Rx2Q/',
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
  siteUrl: 'https://mobile-accessories-shop.vercel.app',
} as const;

export type ShopConfig = typeof shop;

export const formattedAddress = [
  shop.address.line1,
  shop.address.line2,
  `${shop.address.city}, ${shop.address.state} ${shop.address.pincode}`,
].filter(Boolean).join(', ');
