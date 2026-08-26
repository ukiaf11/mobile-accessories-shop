import { Search, SlidersHorizontal, X } from 'lucide-react';
import { featureTags } from '../../data/categories';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/format';
import { PRICE_CEILING, type CatalogController, type SortKey } from '../../hooks/useCatalogFilters';
import { Button } from '../ui/Button';

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'name', label: 'Name (A–Z)' },
];

/** Filter rail. Blueprint FR-05: brand, model, category, price, availability, tags. */
export function ProductFilters({ catalog }: { catalog: CatalogController }) {
  const { filters, patch, toggleTag, reset, activeFilterCount } = catalog;

  return (
    <div className="surface-card sticky top-20 z-10 space-y-5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <SlidersHorizontal className="size-4 text-accent-strong" aria-hidden />
          Filters
          {activeFilterCount > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} iconLeft={<X className="size-3.5" aria-hidden />}>
            Clear
          </Button>
        )}
      </div>

      <div>
        <label htmlFor="catalog-search" className="mb-1.5 block text-xs font-semibold text-muted">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            id="catalog-search"
            type="search"
            value={filters.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder="Case, glass, 65W…"
            className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent-ring/40"
          />
        </div>
      </div>

      <div>
        <label htmlFor="catalog-sort" className="mb-1.5 block text-xs font-semibold text-muted">
          Sort by
        </label>
        <select
          id="catalog-sort"
          value={filters.sort}
          onChange={(event) => patch({ sort: event.target.value as SortKey })}
          className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent-ring/40"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>{sort.label}</option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-muted">Features</legend>
        <div className="flex flex-wrap gap-1.5">
          {featureTags.map((tag) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-surface text-muted hover:border-accent-ring hover:text-accent-strong',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="catalog-price" className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-muted">
          <span>Max price</span>
          <span className="font-bold text-ink tabular-nums">
            {filters.maxPrice === null ? 'Any' : formatPrice(filters.maxPrice)}
          </span>
        </label>
        <input
          id="catalog-price"
          type="range"
          min={100}
          max={PRICE_CEILING}
          step={100}
          value={filters.maxPrice ?? PRICE_CEILING}
          onChange={(event) => {
            const value = Number(event.target.value);
            patch({ maxPrice: value >= PRICE_CEILING ? null : value });
          }}
          className="w-full accent-[var(--color-accent)]"
        />
        <div className="mt-1 flex justify-between text-[11px] text-subtle tabular-nums">
          <span>{formatPrice(100)}</span>
          <span>{formatPrice(PRICE_CEILING)}+</span>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-surface-soft px-3 py-2.5 text-sm">
        <input
          type="checkbox"
          checked={filters.availableOnly}
          onChange={(event) => patch({ availableOnly: event.target.checked })}
          className="size-4 accent-[var(--color-accent)]"
        />
        <span className="font-medium text-ink">Hide sold-out items</span>
      </label>
    </div>
  );
}
