import { shop } from '../config/shop';

const currencyFormatter = new Intl.NumberFormat(shop.locale, {
  style: 'currency',
  currency: shop.currency,
  maximumFractionDigits: 0,
});

/** `undefined` price means "ask the shop", never "free". */
export function formatPrice(value: number | undefined, fallback = 'Ask price'): string {
  if (value === undefined || Number.isNaN(value)) return fallback;
  return currencyFormatter.format(value);
}

export function formatPriceRange(min: number, max: number): string {
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}

/**
 * Display form for a phone number the customer typed. Keeps it recognisable
 * without pretending to be a full libphonenumber implementation.
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return raw.trim();
}

export function formatDateTime(date: Date, timeZone = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(date);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Escapes text that will be interpolated into an HTML email body. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
