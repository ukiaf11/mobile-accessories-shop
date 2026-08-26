import { Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Product, ProductVariant, ResolvedDevice } from '../../types';
import { categoryName } from '../../data/categories';
import { deviceById } from '../../data/devices';
import { brandName } from '../../data/brands';
import { shop } from '../../config/shop';
import { cn } from '../../lib/cn';
import { formatPrice, pluralize } from '../../lib/format';
import { track } from '../../lib/analytics';
import { LIMITS } from '../../../shared/validation';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { toast } from '../../store/toastStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Overlay } from '../ui/Overlay';
import { ProductArt } from './ProductArt';

/**
 * Quick view. Blueprint FR-06: inspect a product without leaving the SPA.
 * Variant choice and quantity live here so the card stays simple.
 */
export function ProductQuickView({ device }: { device: ResolvedDevice | null }) {
  const { overlay, quickViewProduct, closeOverlay, openCart } = useUiStore();
  const addToCart = useCartStore((state) => state.add);
  const open = overlay === 'quickview' && quickViewProduct !== null;

  return (
    <Overlay
      open={open}
      onClose={closeOverlay}
      variant="modal"
      title={quickViewProduct?.name ?? 'Product'}
      hideTitle
      className="sm:max-h-[88dvh]"
    >
      {quickViewProduct && (
        <QuickViewBody
          key={quickViewProduct.id}
          product={quickViewProduct}
          device={device}
          onAdd={(variant, quantity) => {
            addToCart(quickViewProduct, { variant, quantity, device });
            track('add_to_cart', {
              product: quickViewProduct.id,
              quantity,
              variant: variant?.id,
              device: device?.id,
            });
            toast('success', 'Added to your request list', `${quantity} × ${quickViewProduct.name}`);
            closeOverlay();
            openCart();
          }}
        />
      )}
    </Overlay>
  );
}

function QuickViewBody({
  product, device, onAdd,
}: {
  product: Product;
  device: ResolvedDevice | null;
  onAdd: (variant: ProductVariant | undefined, quantity: number) => void;
}) {
  /*
   * There used to be a reset effect here keyed on `product.variants`. Because
   * `product.variants ?? []` allocates a new array on every render, that effect re-ran
   * constantly and snapped the quantity back to 1 — the stepper did not work. The parent
   * already passes `key={product.id}`, so the component remounts per product and plain
   * initial state is both correct and simpler.
   */
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const [variantId, setVariantId] = useState(() => variants[0]?.id);
  const [quantity, setQuantity] = useState(1);

  const variant = variants.find((entry) => entry.id === variantId);
  const unitPrice =
    product.price === undefined ? undefined : product.price + (variant?.priceAdjustment ?? 0);
  const soldOut = product.availability === 'out-of-stock';

  // Show a handful of compatible models as proof, not all 200.
  const compatiblePreview = useMemo(() => {
    const names = product.compatibleDeviceIds
      .slice(0, 6)
      .map((id) => deviceById.get(id))
      .filter((entry) => entry !== undefined)
      .map((entry) => `${brandName(entry.brandId)} ${entry.name}`);
    return { names, total: product.compatibleDeviceIds.length };
  }, [product.compatibleDeviceIds]);

  const fitsSelected = device ? product.compatibleDeviceIds.includes(device.id) : null;

  // Group variants by axis ("Color", "Size") so multi-axis products render sensibly.
  const variantGroups = useMemo(() => {
    const groups = new Map<string, ProductVariant[]>();
    for (const entry of variants) {
      const list = groups.get(entry.name) ?? [];
      list.push(entry);
      groups.set(entry.name, list);
    }
    return [...groups.entries()];
  }, [variants]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
      <div>
        <div className="overflow-hidden rounded-2xl bg-surface-soft">
          <div className="aspect-square w-full">
            <ProductArt artKey={product.images[0]} label={product.name} />
          </div>
        </div>

        <ul className="mt-4 grid gap-2 text-xs text-muted">
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
            Fitted and checked in shop before you leave
          </li>
          {shop.deliveryEnabled && (
            <li className="flex items-center gap-2">
              <Truck className="size-4 shrink-0 text-success" aria-hidden />
              {shop.deliveryNote}
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{categoryName(product.categoryId)}</Badge>
          {product.badges?.map((badge) => (
            <Badge key={badge} tone="accent">{badge}</Badge>
          ))}
          {soldOut && <Badge tone="danger">Sold out</Badge>}
        </div>

        <h2 className="mt-3 text-xl leading-tight font-extrabold sm:text-2xl">{product.name}</h2>

        <p className="mt-2 text-2xl font-extrabold text-ink">
          {formatPrice(unitPrice, product.priceLabel ?? 'Ask price')}
          {unitPrice === undefined && (
            <span className="ml-2 align-middle text-xs font-medium text-muted">
              confirmed on call
            </span>
          )}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted">{product.description}</p>

        {/* Compatibility is the whole point of the site, so state it plainly. */}
        <div
          className={cn(
            'mt-4 rounded-xl border p-3 text-xs',
            fitsSelected === false
              ? 'border-danger/30 bg-danger-soft/50 text-danger'
              : 'border-line bg-surface-soft text-muted',
          )}
        >
          {fitsSelected === true && (
            <p className="flex items-center gap-2 font-semibold text-success">
              <Check className="size-4" aria-hidden />
              Fits your {device!.brandName} {device!.name}
            </p>
          )}
          {fitsSelected === false && (
            <p className="font-semibold">
              This does not fit the {device!.brandName} {device!.name} you selected.
            </p>
          )}
          <p className={cn(fitsSelected === true && 'mt-1.5')}>
            Also fits {compatiblePreview.names.slice(0, 3).join(', ')}
            {compatiblePreview.total > 3 &&
              ` and ${compatiblePreview.total - 3} other ${pluralize(compatiblePreview.total - 3, 'model')}`}
            .
          </p>
        </div>

        {variantGroups.map(([axis, options]) => (
          <fieldset key={axis} className="mt-5">
            <legend className="mb-2 text-xs font-semibold text-muted">{axis}</legend>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const active = option.id === variantId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!option.available}
                    onClick={() => setVariantId(option.id)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                      !option.available && 'cursor-not-allowed line-through opacity-45',
                      active
                        ? 'border-accent bg-accent-soft text-accent-strong'
                        : 'border-line-strong bg-surface text-ink hover:border-accent',
                    )}
                  >
                    {option.value}
                    {option.priceAdjustment ? (
                      <span className="ml-1.5 text-xs text-muted">
                        +{formatPrice(option.priceAdjustment)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="mt-6 flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-line-strong">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid size-10 place-items-center rounded-l-xl text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span
              aria-live="polite"
              className="w-10 text-center text-sm font-bold tabular-nums"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(LIMITS.quantityMax, value + 1))}
              disabled={quantity >= LIMITS.quantityMax}
              aria-label="Increase quantity"
              className="grid size-10 place-items-center rounded-r-xl text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>

          <Button
            fullWidth
            disabled={soldOut}
            data-autofocus
            onClick={() => onAdd(variant, quantity)}
            iconLeft={<ShoppingBag className="size-4" aria-hidden />}
          >
            {soldOut ? 'Sold out' : 'Add to request'}
          </Button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-subtle">
          Adding to the list does not place an order. The shop confirms availability and the final
          price before anything is reserved.
        </p>
      </div>
    </div>
  );
}
