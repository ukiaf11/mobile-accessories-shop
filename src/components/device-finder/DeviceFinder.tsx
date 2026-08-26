import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, HelpCircle, RotateCcw, Search, Smartphone, Tablet } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DeviceType } from '../../types';
import { brands } from '../../data/brands';
import { brandHasType, devicesForBrand } from '../../data/devices';
import { cn } from '../../lib/cn';
import { pluralize } from '../../lib/format';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { useUiStore } from '../../store/uiStore';
import type { CatalogController } from '../../hooks/useCatalogFilters';
import { Button } from '../ui/Button';

/**
 * Device finder — blueprint 03_UI_UX_BLUEPRINT.md section 6, "the most important
 * conversion section". Three steps: type → brand → model, each revealed as the
 * previous one is answered so the customer is never shown 200 models at once.
 */

const TYPES: Array<{ id: DeviceType; label: string; icon: typeof Smartphone }> = [
  { id: 'smartphone', label: 'Smartphone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
];

export function DeviceFinder({ catalog }: { catalog: CatalogController }) {
  const { filters, selectDeviceType, selectBrand, selectDevice, selectedDevice, compatibleCount } = catalog;
  const { entrance, reduced } = useMotionPreference();
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);
  const [modelQuery, setModelQuery] = useState('');

  const availableBrands = useMemo(
    () => brands.filter((brand) => brand.active && brandHasType(brand.id, filters.deviceType)),
    [filters.deviceType],
  );

  const models = useMemo(
    () => (filters.brandId ? devicesForBrand(filters.brandId, filters.deviceType) : []),
    [filters.brandId, filters.deviceType],
  );

  const visibleModels = useMemo(() => {
    const needle = modelQuery.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((model) =>
      `${model.name} ${model.series} ${model.aliases?.join(' ') ?? ''}`.toLowerCase().includes(needle),
    );
  }, [models, modelQuery]);

  const step = selectedDevice ? 3 : filters.brandId ? 2 : 1;

  return (
    <section id="device-finder" className="scroll-mt-24 py-12 sm:py-16">
      <div className="container-page">
        <motion.div {...entrance} className="surface-card overflow-hidden">
          <div className="border-b border-line bg-linear-to-br from-accent-soft/70 to-surface px-5 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-accent-strong uppercase">
                  Step {step} of 3
                </p>
                <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-[2.1rem]">
                  Find the right accessory for your phone
                </h2>
                <p className="mt-2.5 text-sm text-muted sm:text-base">
                  Tell us what you have. We will only show what is cut for that exact model.
                </p>
              </div>

              {(filters.brandId || selectedDevice) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setModelQuery('');
                    selectBrand(null);
                  }}
                  iconLeft={<RotateCcw className="size-3.5" aria-hidden />}
                >
                  Start over
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
            {/* Step 1 — device type */}
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-ink">1. What kind of device?</legend>
              <div className="flex flex-wrap gap-2.5">
                {TYPES.map(({ id, label, icon: Icon }) => {
                  const active = filters.deviceType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setModelQuery('');
                        selectDeviceType(id);
                      }}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                        active
                          ? 'border-accent bg-accent text-white shadow-[0_10px_24px_-14px_rgb(109_93_252/0.9)]'
                          : 'border-line-strong bg-surface text-muted hover:border-accent hover:text-accent-strong',
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Step 2 — brand */}
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-ink">2. Which brand?</legend>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((brand) => {
                  const active = filters.brandId === brand.id;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => {
                        setModelQuery('');
                        selectBrand(active ? null : brand.id);
                      }}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200',
                        active
                          ? 'border-accent bg-accent-soft text-accent-strong'
                          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
                      )}
                    >
                      {brand.logo && (
                        <span aria-hidden className="text-[11px] font-black opacity-60">{brand.logo}</span>
                      )}
                      {brand.name}
                      {active && <Check className="size-3.5" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Step 3 — model */}
            <AnimatePresence initial={false}>
              {filters.brandId && (
                <motion.fieldset
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <legend className="mb-3 text-sm font-semibold text-ink">
                    3. Which model?{' '}
                    <span className="font-normal text-muted">
                      ({models.length} {pluralize(models.length, 'model')})
                    </span>
                  </legend>

                  {models.length > 8 && (
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
                      <input
                        type="search"
                        value={modelQuery}
                        onChange={(event) => setModelQuery(event.target.value)}
                        placeholder="Type your model, e.g. 15 pro or A55"
                        aria-label="Search models"
                        className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pr-3.5 pl-10 text-sm outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent-ring/40"
                      />
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface-soft/50 p-2">
                    {visibleModels.length > 0 ? (
                      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {visibleModels.map((model) => {
                          const active = filters.deviceId === model.id;
                          return (
                            <li key={model.id}>
                              <button
                                type="button"
                                onClick={() => selectDevice(active ? null : model.id)}
                                aria-pressed={active}
                                className={cn(
                                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                                  active
                                    ? 'bg-accent font-semibold text-white'
                                    : 'bg-surface text-ink hover:bg-accent-soft hover:text-accent-strong',
                                )}
                              >
                                <span className="truncate">{model.name}</span>
                                {active
                                  ? <Check className="size-4 shrink-0" aria-hidden />
                                  : <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="px-3 py-8 text-center">
                        <p className="text-sm font-medium text-ink">No model matches “{modelQuery}”.</p>
                        <p className="mt-1 text-xs text-muted">
                          We can still source it — send us the exact model name.
                        </p>
                        <Button
                          size="sm"
                          variant="subtle"
                          className="mt-3"
                          onClick={openCustomRequest}
                          iconLeft={<HelpCircle className="size-3.5" aria-hidden />}
                        >
                          Send a custom request
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.fieldset>
              )}
            </AnimatePresence>
          </div>

          {/* Result summary — blueprint asks for an explicit "Accessories for X" confirmation. */}
          <AnimatePresence initial={false}>
            {selectedDevice && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-ink px-5 py-4 text-white sm:px-8"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success/20 text-success">
                    <Check className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-bold">
                      Accessories for {selectedDevice.brandName} {selectedDevice.name}
                    </p>
                    <p className="text-xs text-white/60">
                      {compatibleCount} compatible {pluralize(compatibleCount, 'product')} in the catalog
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => document.getElementById('catalog')?.scrollIntoView({ block: 'start' })}
                  iconRight={<ChevronRight className="size-4" aria-hidden />}
                >
                  Show compatible accessories
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="mt-4 text-center text-sm text-muted">
          Cannot see your model?{' '}
          <button
            type="button"
            onClick={openCustomRequest}
            className="font-semibold text-accent-strong underline decoration-accent-ring underline-offset-4 hover:decoration-accent-strong"
          >
            Tell us what you need
          </button>{' '}
          and we will check availability for you.
        </p>
      </div>
    </section>
  );
}
