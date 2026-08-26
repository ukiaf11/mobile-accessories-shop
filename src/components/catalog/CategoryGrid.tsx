import { motion } from 'framer-motion';
import { ArrowUpRight, MessageSquarePlus } from 'lucide-react';
import { categories } from '../../data/categories';
import { categoryIcon } from '../../lib/icons';
import { cn } from '../../lib/cn';
import { pluralize } from '../../lib/format';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { useUiStore } from '../../store/uiStore';
import type { CatalogController } from '../../hooks/useCatalogFilters';
import { Section } from '../ui/Section';

/** Category cards. Blueprint 03 section 7: lift on hover, accent glow, image scale. */
export function CategoryGrid({ catalog }: { catalog: CatalogController }) {
  const { filters, selectCategory, countsByCategory, selectedDevice } = catalog;
  const { lift, reduced } = useMotionPreference();
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);

  return (
    <Section
      id="categories"
      eyebrow="Browse"
      title="What do you need for it?"
      description={
        selectedDevice
          ? `Counts below are for the ${selectedDevice.brandName} ${selectedDevice.name}.`
          : 'Pick a category, or choose your model first so we only show what fits.'
      }
    >
      <ul className="card-enter grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.filter((category) => category.active).map((category) => {
          const Icon = categoryIcon(category.icon);
          const count = countsByCategory.get(category.id) ?? 0;
          const active = filters.categoryId === category.id;
          const empty = count === 0;

          return (
            <li key={category.id}>
              <motion.button
                whileHover={empty ? undefined : lift}
                type="button"
                onClick={() => selectCategory(category.id)}
                aria-pressed={active}
                disabled={empty}
                className={cn(
                  'group flex h-full w-full flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5',
                  active
                    ? 'border-accent bg-accent text-white shadow-[var(--shadow-float)]'
                    : empty
                      ? 'cursor-not-allowed border-line bg-surface-soft/60 text-subtle'
                      : 'border-line bg-surface text-ink hover:border-accent-ring hover:shadow-[var(--shadow-lift)]',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-11 place-items-center rounded-xl transition-transform duration-300',
                    active ? 'bg-white/20 text-white' : empty ? 'bg-surface-sunk text-subtle' : 'bg-accent-soft text-accent-strong',
                    !reduced && !empty && 'group-hover:scale-[1.06]',
                  )}
                >
                  <Icon className="size-5" />
                </span>

                <span className="flex-1">
                  <span className="block text-[15px] leading-tight font-bold">{category.name}</span>
                  <span
                    className={cn(
                      'mt-1 block text-xs leading-snug',
                      active ? 'text-white/70' : 'text-muted',
                    )}
                  >
                    {empty
                      ? 'Nothing for this device'
                      : `${count} ${pluralize(count, 'product')}`}
                  </span>
                </span>

                {!empty && (
                  <ArrowUpRight
                    aria-hidden
                    className={cn(
                      'size-4 transition-transform duration-300',
                      active ? 'text-white' : 'text-subtle',
                      !reduced && 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    )}
                  />
                )}
              </motion.button>
            </li>
          );
        })}

        {/* "Custom / Other" is a first-class category per FR-03, not an error fallback. */}
        <li>
          <motion.button
            whileHover={lift}
            type="button"
            onClick={openCustomRequest}
            className="group flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-dashed border-accent-ring bg-accent-soft/40 p-4 text-left transition-all duration-300 hover:border-accent hover:bg-accent-soft sm:p-5"
          >
            <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-white text-accent-strong">
              <MessageSquarePlus className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] leading-tight font-bold text-accent-strong">
                Something else
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted">
                Tell us the exact item you need
              </span>
            </span>
            <ArrowUpRight aria-hidden className="size-4 text-accent-strong" />
          </motion.button>
        </li>
      </ul>
    </Section>
  );
}
