import { create } from 'zustand';
import type { Product } from '../types';

export type OverlayView = 'none' | 'cart' | 'order' | 'custom' | 'quickview';

interface UiState {
  overlay: OverlayView;
  quickViewProduct: Product | null;
  mobileNavOpen: boolean;
  openCart: () => void;
  openOrder: () => void;
  openCustomRequest: () => void;
  openQuickView: (product: Product) => void;
  closeOverlay: () => void;
  setMobileNav: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  overlay: 'none',
  quickViewProduct: null,
  mobileNavOpen: false,
  openCart: () => set({ overlay: 'cart', mobileNavOpen: false }),
  openOrder: () => set({ overlay: 'order', mobileNavOpen: false }),
  openCustomRequest: () => set({ overlay: 'custom', mobileNavOpen: false }),
  openQuickView: (product) => set({ overlay: 'quickview', quickViewProduct: product }),
  closeOverlay: () => set({ overlay: 'none' }),
  setMobileNav: (open) => set({ mobileNavOpen: open }),
}));
