import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant, ResolvedDevice } from '../types';
import { LIMITS } from '../../shared/validation';

/**
 * Cart state.
 *
 * Persisted to localStorage because a customer who reloads mid-shop should not lose
 * their list. Only cart lines are stored — never contact details (blueprint 01 NFR
 * "no customer-sensitive data in localStorage beyond temporary cart information").
 */

function lineKey(productId: string, variantId?: string, deviceId?: string): string {
  return [productId, variantId ?? '-', deviceId ?? '-'].join('::');
}

interface CartState {
  items: CartItem[];
  add: (
    product: Product,
    options?: { quantity?: number; variant?: ProductVariant; device?: ResolvedDevice | null },
  ) => CartItem;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product, options = {}) => {
        const { quantity = 1, variant, device } = options;
        const key = lineKey(product.id, variant?.id, device?.id);
        const unitPrice =
          product.price === undefined
            ? undefined
            : product.price + (variant?.priceAdjustment ?? 0);

        const existing = get().items.find((item) => item.key === key);
        const nextQuantity = Math.min(
          LIMITS.quantityMax,
          (existing?.quantity ?? 0) + Math.max(1, quantity),
        );

        const line: CartItem = {
          key,
          productId: product.id,
          productName: product.name,
          productImage: product.images[0],
          deviceId: device?.id,
          deviceName: device ? `${device.brandName} ${device.name}` : undefined,
          quantity: nextQuantity,
          unitPrice,
          variantId: variant?.id,
          variantName: variant ? `${variant.name}: ${variant.value}` : undefined,
        };

        set((state) => ({
          items: existing
            ? state.items.map((item) => (item.key === key ? line : item))
            : [...state.items, line],
        }));

        return line;
      },

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.key !== key)
              : state.items.map((item) =>
                  item.key === key
                    ? { ...item, quantity: Math.min(LIMITS.quantityMax, quantity) }
                    : item,
                ),
        })),

      increment: (key) => {
        const item = get().items.find((entry) => entry.key === key);
        if (item) get().setQuantity(key, item.quantity + 1);
      },

      decrement: (key) => {
        const item = get().items.find((entry) => entry.key === key);
        if (item) get().setQuantity(key, item.quantity - 1);
      },

      remove: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'mas-cart-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      version: 1,
    },
  ),
);

/** Derived totals. `hasAskPrice` means the subtotal is an estimate, not a quote. */
export function cartTotals(items: CartItem[]) {
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + (item.unitPrice ?? 0) * item.quantity,
    0,
  );
  const hasAskPrice = items.some((item) => item.unitPrice === undefined);
  return { count, subtotal, hasAskPrice };
}
