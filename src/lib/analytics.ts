/**
 * Analytics is optional (blueprint 01_REQUIREMENTS.md section 4). Events are emitted as
 * DOM CustomEvents and forwarded to `window.dataLayer` if a tag manager is present.
 * No personal information is ever included — only ids and counts.
 */
export type AnalyticsEvent =
  | 'device_selected'
  | 'category_selected'
  | 'product_viewed'
  | 'add_to_cart'
  | 'cart_opened'
  | 'order_started'
  | 'order_submitted'
  | 'custom_request_submitted';

type Payload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: AnalyticsEvent, payload: Payload = {}): void {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event, ...payload });
  window.dispatchEvent(new CustomEvent(`mas:${event}`, { detail: payload }));
}
