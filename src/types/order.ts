export type RequestType = 'order' | 'custom';
export type Fulfillment = 'pickup' | 'delivery';

export interface CartItem {
  /** Stable key: productId + variantId + deviceId. */
  key: string;
  productId: string;
  productName: string;
  productImage?: string;
  deviceId?: string;
  deviceName?: string;
  quantity: number;
  unitPrice?: number;
  variantId?: string;
  variantName?: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface OrderDevice {
  type?: string;
  brand?: string;
  model?: string;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  variant?: string;
  deviceName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface OrderRequestPayload {
  requestType: 'order';
  customer: OrderCustomer;
  device: OrderDevice;
  items: OrderLineItem[];
  fulfillment: Fulfillment;
  address?: string;
  notes?: string;
  requestId: string;
  /** Hidden anti-spam field. Always empty for real humans. */
  company?: string;
}

export interface CustomRequestPayload {
  requestType: 'custom';
  customer: OrderCustomer;
  device: OrderDevice & { otherModel?: string };
  item: string;
  quantity: number;
  description: string;
  fulfillment: Fulfillment;
  address?: string;
  requestId: string;
  company?: string;
}

export interface ApiSuccess {
  success: true;
  requestId: string;
}

export interface ApiFailure {
  success: false;
  error: string;
  /** Machine-readable reason so the UI can pick the right recovery copy. */
  code:
    | 'validation_error'
    | 'rate_limited'
    | 'email_failed'
    | 'not_configured'
    | 'payload_too_large'
    | 'server_error'
    | 'network_error';
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
}

export type ApiResult = ApiSuccess | ApiFailure;
