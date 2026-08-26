import { motion } from 'framer-motion';
import { Eye, Plus } from 'lucide-react';
import type { Availability, Product, ResolvedDevice } from '../../types';
import { categoryName } from '../../data/categories';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/format';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { Badge } from '../ui/Badge';
import { ProductArt } from './ProductArt';

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

export function ProductCard({ product, device, onQuickView, onAdd }: ProductCardProps) {
  const { lift, tap, reduced } = useMotionPreference();
  const availability = AVAILABILITY[product.availability];
  const soldOut = product.availability === 'out-of-stock';
  const hasVariants = Boolean(product.variants?.length);

  return (
    <motion.article
      whileHover={lift}
      className="surface-card group relative flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
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
          <div
            className={cn(
              'aspect-square w-full transition-transform duration-500',
              !reduced && 'group-hover:scale-[1.03]',
            )}
          >
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
            'pointer-events-none absolute inset-x-3 bottom-3 hidden justify-end transition-all duration-300',
            '[@media(hover:hover)]:flex',
            reduced
              ? 'opacity-100 [@media(hover:hover)]:pointer-events-auto'
              : 'translate-y-1.5 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100',
          )}
        >
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface/95 px-3.5 text-xs font-semibold text-ink shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:text-accent-strong"
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

          <motion.button
            whileTap={tap}
            type="button"
            disabled={soldOut}
            onClick={() => (hasVariants ? onQuickView(product) : onAdd(product))}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors',
              soldOut
                ? 'cursor-not-allowed bg-surface-soft text-subtle'
                : 'bg-accent-soft text-accent-strong hover:bg-accent hover:text-white',
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
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
