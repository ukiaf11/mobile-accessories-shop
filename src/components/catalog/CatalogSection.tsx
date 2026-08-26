import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquarePlus, PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { Product } from '../../types';
import { categoryName } from '../../data/categories';
import { cn } from '../../lib/cn';
import { pluralize } from '../../lib/format';
import { track } from '../../lib/analytics';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import type { CatalogController } from '../../hooks/useCatalogFilters';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { toast } from '../../store/toastStore';
import { Button } from '../ui/Button';
import { ProductCard } from './ProductCard';
import { ProductFilters } from './ProductFilters';

export function CatalogSection({ catalog }: { catalog: CatalogController }) {
  const { filters, results, selectedDevice, selectCategory, reset, activeFilterCount } = catalog;
  const { reduced } = useMotionPreference();
  const addToCart = useCartStore((state) => state.add);
  /*
   * One selector per action. `useUiStore()` with no selector snapshots the entire state
   * object, so every set() anywhere in the store — including opening the mobile menu —
   * changed the snapshot and re-rendered this component and all 65 cards beneath it.
   * Zustand actions are stable references, so these never cause a re-render.
   */
  const openQuickView = useUiStore((state) => state.openQuickView);
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);
  const openCart = useUiStore((state) => state.openCart);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /*
   * There is no async work behind this grid — the catalog is local, typed data. A skeleton
   * phase and a fade-in therefore could not represent loading; they only delayed content
   * that was already available. A 120 ms timer used to swap 8 skeletons for 65 real cards
   * in one commit, and every filter change dimmed the finished grid to 60% for 160 ms.
   * Both were removed: the grid renders its real content in the first commit.
   */

  // Stable identities, so the memoised ProductCard actually stays memoised.
  const handleAdd = useCallback(
    (product: Product) => {
      addToCart(product, { device: selectedDevice });
      track('add_to_cart', { product: product.id, device: selectedDevice?.id });
      toast('success', 'Added to your request list', `${product.name} · tap the cart to review.`);
    },
    [addToCart, selectedDevice],
  );

  const handleQuickView = useCallback(
    (product: Product) => {
      track('product_viewed', { product: product.id });
      openQuickView(product);
    },
    [openQuickView],
  );

  return (
    <section id="catalog" className="scroll-mt-24 py-12 sm:py-16">
      <div className="container-page">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent-strong uppercase">
              Catalog
            </p>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {selectedDevice
                ? `Accessories for ${selectedDevice.brandName} ${selectedDevice.name}`
                : filters.deviceType === 'tablet'
                  ? 'Tablet accessories'
                  : 'All phone accessories'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {results.length} {pluralize(results.length, 'product')}
              {filters.categoryId && ` in ${categoryName(filters.categoryId)}`}
              {!selectedDevice && ' · pick your model above for an exact fit'}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
            iconLeft={<SlidersHorizontal className="size-4" aria-hidden />}
          >
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </div>

        {/* Active filter chips, so what is applied is never hidden behind a drawer. */}
        {(filters.categoryId || filters.tags.length > 0) && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {filters.categoryId && (
              <FilterChip label={categoryName(filters.categoryId)} onRemove={() => selectCategory(filters.categoryId!)} />
            )}
            {filters.tags.map((tag) => (
              <FilterChip key={tag} label={tag} onRemove={() => catalog.toggleTag(tag)} />
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
          <aside className="hidden lg:block">
            <ProductFilters catalog={catalog} />
          </aside>

          <div>
            {results.length > 0 ? (
              <ul className="catalog-grid card-enter grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {results.map((product) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      device={selectedDevice}
                      onQuickView={handleQuickView}
                      onAdd={handleAdd}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                hasFilters={activeFilterCount > 0}
                deviceLabel={selectedDevice ? `${selectedDevice.brandName} ${selectedDevice.name}` : null}
                onReset={reset}
                onCustomRequest={openCustomRequest}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-90 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-label="Filters"
              initial={reduced ? { opacity: 0 } : { y: '100%' }}
              animate={reduced ? { opacity: 1 } : { y: 0 }}
              exit={reduced ? { opacity: 0 } : { y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line-strong" aria-hidden />
              <ProductFilters catalog={catalog} />
              <Button fullWidth className="mt-4" onClick={() => setFiltersOpen(false)}>
                Show {results.length} {pluralize(results.length, 'result')}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating cart pill / sticky mobile bar */}
      <FloatingCart onOpen={openCart} />
    </section>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft py-1 pr-1.5 pl-3 text-xs font-semibold text-accent-strong">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="grid size-5 place-items-center rounded-full transition-colors hover:bg-accent hover:text-white"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}

/** Blueprint 03 section 14 — the empty state routes into a custom request. */
function EmptyState({
  hasFilters, deviceLabel, onReset, onCustomRequest,
}: {
  hasFilters: boolean;
  deviceLabel: string | null;
  onReset: () => void;
  onCustomRequest: () => void;
}) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-16 text-center">
      <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
        <PackageSearch className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-bold">No matching accessories yet.</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {deviceLabel
          ? `We may still be able to source it for your ${deviceLabel}. Tell us your exact requirement and we will check.`
          : 'Tell us your exact requirement and we will help you find it.'}
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={onCustomRequest} iconLeft={<MessageSquarePlus className="size-4" aria-hidden />}>
          Send Custom Request
        </Button>
        {hasFilters && (
          <Button variant="secondary" onClick={onReset}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

/** Blueprint 03 section 9: desktop pill bottom-right, mobile sticky bar. */
function FloatingCart({ onOpen }: { onOpen: () => void }) {
  const items = useCartStore((state) => state.items);
  const { reduced } = useMotionPreference();

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.unitPrice ?? 0) * item.quantity, 0);
  const estimate = items.some((item) => item.unitPrice === undefined);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className={cn(
            'fixed z-80',
            'inset-x-0 bottom-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            'sm:inset-x-auto sm:right-6 sm:bottom-6 sm:p-0',
          )}
        >
          <button
            type="button"
            onClick={onOpen}
            className="flex w-full items-center justify-between gap-4 rounded-2xl bg-ink px-4 py-3.5 text-white shadow-[0_20px_50px_-20px_rgb(17_24_39/0.9)] transition-transform duration-200 hover:scale-[1.01] sm:w-auto sm:rounded-full sm:px-5"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-bold tabular-nums">
                {count}
              </span>
              <span className="text-sm font-semibold">
                {pluralize(count, 'item')} in request
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums">
                {estimate && '~'}₹{subtotal.toLocaleString('en-IN')}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">View</span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
