import { memo } from 'react';
import { Eye, Plus } from 'lucide-react';
import type { Availability, Product, ResolvedDevice } from '../../types';
import { categoryName } from '../../data/categories';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/format';
import { Badge } from '../ui/Badge';
import { ProductArt } from './ProductArt';

/**
 * Product card.
 *
 * Deliberately contains NO Framer Motion. It used to sit inside three motion components
 * (`motion.li` for entrance, `motion.article` for the hover lift, `motion.button` for the
 * press), which across a 65-card grid meant ~195 VisualElements, ~280 undelegated pointer
 * listeners, and — because Framer cannot hardware-accelerate `y` — one main-thread rAF
 * animation per card. Hover and press are plain CSS transitions here, which the compositor
 * owns; the entrance is one CSS keyframe in globals.css that never gates visibility.
 *
 * `motion-safe:` gives the same reduced-motion behaviour the old `reduced` flag did, but
 * without reading a hook, so this component has no reason to re-render.
 *
 * Memoised, and `CatalogSection` passes stable callbacks — so opening the cart or toggling
 * an unrelated filter no longer re-renders 65 SVG subtrees.
 */

const AVAILABILITY: Record<Availability, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  'in-stock': { label: 'In stock', tone: 'success' },
  'low-stock': { label: 'Few left', tone: 'warning' },
  'made-to-order': { label: 'On order', tone: 'neutral' },
  'out-of-stock': { label: 'Sold out', tone: 'danger' },
};

interface ProductCardProps {
  product: Product;
  device: ResolvedDevice | null;
  onQuickView: (product: Product) => void;
  onAdd: (product: Product) => void;
}

function ProductCardImpl({ product, device, onQuickView, onAdd }: ProductCardProps) {
  const availability = AVAILABILITY[product.availability];
  const soldOut = product.availability === 'out-of-stock';
  const hasVariants = Boolean(product.variants?.length);

  return (
    <article
      className={cn(
        'surface-card group relative flex h-full flex-col overflow-hidden',
        'transition-[box-shadow,transform] duration-300 hover:shadow-[var(--shadow-lift)]',
        // hover:hover so a touch device never sticks in a hovered transform.
        'motion-safe:[@media(hover:hover)]:hover:-translate-y-1.5',
      )}
    >
      <div className="relative">
        {/* The whole image is a quick-view target, but it is a real button so it is
            reachable by keyboard — blueprint 03 section 16. */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="block w-full overflow-hidden rounded-t-[calc(var(--radius-card)-1px)] bg-surface-soft"
          aria-label={`Quick view ${product.name}`}
        >
          <div className="aspect-square w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.03]">
            <ProductArt artKey={product.images[0]} label={product.name} />
          </div>
        </button>

        {product.badges?.[0] && (
          <span className="absolute top-3 left-3">
            <Badge tone="accent">{product.badges[0]}</Badge>
          </span>
        )}

        <span className="absolute top-3 right-3">
          <Badge tone={availability.tone}>{availability.label}</Badge>
        </span>

        <div
          className={cn(
            // Hidden on touch: the image itself is already a quick-view button there,
            // and an invisible-but-tappable pill is worse than no pill.
            'pointer-events-none absolute inset-x-3 bottom-3 hidden justify-end',
            'transition-[opacity,transform] duration-300 [@media(hover:hover)]:flex',
            'opacity-0 motion-safe:translate-y-1.5',
            'group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100',
            'group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100',
          )}
        >
          <button
            type="button"
            onClick={() => onQuickView(product)}
            /* No backdrop-blur here: the fill is already 95% opaque so the blur was never
               visible, while still forcing a backdrop root on every one of the 65 cards. */
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface/95 px-3.5 text-xs font-semibold text-ink shadow-[var(--shadow-soft)] transition-colors hover:text-accent-strong"
          >
            <Eye className="size-3.5" aria-hidden />
            Quick view
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
          {categoryName(product.categoryId)}
        </p>
        <h3 className="mt-1 text-[15px] leading-snug font-bold text-ink">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="text-left transition-colors hover:text-accent-strong"
          >
            {product.name}
          </button>
        </h3>
        <p className="mt-1 truncate text-xs text-muted">
          {device ? `${device.brandName} ${device.name}` : 'Fits many models'}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-lg leading-none font-extrabold text-ink">
              {formatPrice(product.price, product.priceLabel ?? 'Ask price')}
            </p>
            {hasVariants && (
              <p className="mt-1 text-[11px] text-subtle">
                {product.variants!.length} options
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={soldOut}
            onClick={() => (hasVariants ? onQuickView(product) : onAdd(product))}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold',
              'transition-[background-color,color,transform] duration-150',
              soldOut
                ? 'cursor-not-allowed bg-surface-soft text-subtle'
                : 'bg-accent-soft text-accent-strong hover:bg-accent hover:text-white motion-safe:active:scale-[0.97]',
            )}
            aria-label={
              soldOut
                ? `${product.name} is sold out`
                : hasVariants
                  ? `Choose options for ${product.name}`
                  : `Add ${product.name} to request list`
            }
          >
            {soldOut ? 'Sold out' : (
              <>
                <Plus className="size-4" aria-hidden />
                {hasVariants ? 'Options' : 'Add'}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardImpl);
