import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { ResolvedDevice } from '../../types';
import { cartTotals, useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { formatPrice, pluralize } from '../../lib/format';
import { track } from '../../lib/analytics';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { LIMITS } from '../../../shared/validation';
import { Button } from '../ui/Button';
import { Overlay } from '../ui/Overlay';
import { ProductArt } from '../catalog/ProductArt';

/** Request list. Blueprint FR-07 — deliberately never called a "checkout". */
export function CartDrawer({ device }: { device: ResolvedDevice | null }) {
  const overlay = useUiStore((state) => state.overlay);
  const closeOverlay = useUiStore((state) => state.closeOverlay);
  const openOrder = useUiStore((state) => state.openOrder);
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  const { count, subtotal, hasAskPrice } = cartTotals(items);
  const { reduced } = useMotionPreference();

  const open = overlay === 'cart';

  return (
    <Overlay
      open={open}
      onClose={closeOverlay}
      title="Your request list"
      description={
        count > 0
          ? `${count} ${pluralize(count, 'item')}${device ? ` for ${device.brandName} ${device.name}` : ''}`
          : undefined
      }
      footer={
        items.length > 0 ? (
          <div className="space-y-3">
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-muted">Estimated subtotal</dt>
                <dd className="text-lg font-extrabold text-ink tabular-nums">
                  {hasAskPrice && <span className="mr-1 text-xs font-medium text-muted">from</span>}
                  {formatPrice(subtotal, '—')}
                </dd>
              </div>
              {hasAskPrice && (
                <p className="text-xs text-muted">
                  Some items are priced on request, so the real total will be higher.
                </p>
              )}
            </dl>

            <Button
              fullWidth
              size="lg"
              data-autofocus
              onClick={() => {
                track('order_started', { items: count });
                openOrder();
              }}
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              Continue to details
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-subtle">
              No payment is taken here. The shop confirms availability and final price on a call.
            </p>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-14 text-center">
          <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-surface-soft text-subtle">
            <ShoppingBag className="size-7" />
          </span>
          <h3 className="mt-4 text-base font-bold">Your request list is empty</h3>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Pick your phone model, add what you need, and send the list to the shop in one go.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={closeOverlay}>Continue shopping</Button>
            <Button variant="secondary" onClick={openCustomRequest}>
              Custom request
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.key}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 py-4">
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-surface-soft">
                      <ProductArt artKey={item.productImage} label="" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm leading-snug font-bold text-ink">{item.productName}</p>
                          {item.variantName && (
                            <p className="mt-0.5 text-xs text-muted">{item.variantName}</p>
                          )}
                          <p className="mt-0.5 text-xs text-accent-strong">
                            {item.deviceName ?? 'Model to be confirmed'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.key)}
                          aria-label={`Remove ${item.productName}`}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-lg border border-line-strong">
                          <button
                            type="button"
                            onClick={() => decrement(item.key)}
                            aria-label={`Decrease quantity of ${item.productName}`}
                            className="grid size-8 place-items-center rounded-l-lg text-muted transition-colors hover:bg-surface-soft hover:text-ink"
                          >
                            <Minus className="size-3.5" aria-hidden />
                          </button>
                          <label className="sr-only" htmlFor={`qty-${item.key}`}>
                            Quantity of {item.productName}
                          </label>
                          <input
                            id={`qty-${item.key}`}
                            type="number"
                            min={1}
                            max={LIMITS.quantityMax}
                            value={item.quantity}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (Number.isFinite(next)) setQuantity(item.key, next);
                            }}
                            className="w-10 border-x border-line-strong bg-transparent py-1 text-center text-sm font-bold tabular-nums outline-none [appearance:textfield] focus:bg-accent-soft [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => increment(item.key)}
                            disabled={item.quantity >= LIMITS.quantityMax}
                            aria-label={`Increase quantity of ${item.productName}`}
                            className="grid size-8 place-items-center rounded-r-lg text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-40"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-ink tabular-nums">
                          {item.unitPrice === undefined
                            ? 'Ask price'
                            : formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="flex items-center justify-between gap-3 pt-4">
            <Button variant="ghost" size="sm" onClick={closeOverlay}>
              Continue shopping
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} className="text-danger hover:bg-danger-soft">
              Clear list
            </Button>
          </div>
        </>
      )}
    </Overlay>
  );
}
