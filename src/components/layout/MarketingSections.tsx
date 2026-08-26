import { motion } from 'framer-motion';
import {
  ArrowRight, Clock, HeartHandshake, Layers, MapPin, MessageCircle, MessageSquarePlus,
  Phone, Ruler, ShieldCheck, Timer,
} from 'lucide-react';
import type { Product } from '../../types';
import { shop, formattedAddress } from '../../config/shop';
import { brands } from '../../data/brands';
import { devices } from '../../data/devices';
import { featuredProducts } from '../../data/products';
import { track } from '../../lib/analytics';
import { pluralize } from '../../lib/format';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { toast } from '../../store/toastStore';
import type { CatalogController } from '../../hooks/useCatalogFilters';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import { ProductCard } from '../catalog/ProductCard';

/* ── Featured products ─────────────────────────────────────────────────────── */

export function FeaturedProducts({ catalog }: { catalog: CatalogController }) {
  const addToCart = useCartStore((state) => state.add);
  const { openQuickView } = useUiStore();
  const { reduced } = useMotionPreference();

  const handleAdd = (product: Product) => {
    addToCart(product, { device: catalog.selectedDevice });
    track('add_to_cart', { product: product.id, from: 'featured' });
    toast('success', 'Added to your request list', product.name);
  };

  return (
    <Section
      eyebrow="Most asked for"
      title="What people pick up most"
      description="The accessories that move fastest at the counter — available for most models we stock."
    >
      <ul className="catalog-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {featuredProducts.slice(0, 8).map((product, index) => (
          <motion.li
            key={product.id}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.35) }}
          >
            <ProductCard
              product={product}
              device={catalog.selectedDevice}
              onQuickView={(entry) => {
                track('product_viewed', { product: entry.id, from: 'featured' });
                openQuickView(entry);
              }}
              onAdd={handleAdd}
            />
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}

/* ── Compatibility explainer ───────────────────────────────────────────────── */

const STEPS = [
  {
    icon: Ruler,
    title: 'Tell us the exact model',
    body: 'A Galaxy A55 case does not fit an A54. We match on the model, not just the brand, so cut-outs line up the first time.',
  },
  {
    icon: Layers,
    title: 'We show only what fits',
    body: `Every product is mapped to the models it fits — ${devices.length} models across ${brands.length} brands, and growing as new phones land.`,
  },
  {
    icon: Timer,
    title: 'We confirm before you come',
    body: 'Send your list, we check the shelf and call you back with availability and final price. No wasted trip.',
  },
];

export function CompatibilitySection() {
  const { entrance, reduced } = useMotionPreference();

  return (
    <section className="py-14 sm:py-20">
      <div className="container-page">
        <motion.div
          {...entrance}
          className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-10 sm:py-16"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-16 size-80 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 size-72 rounded-full bg-[#4f7cff]/20 blur-3xl" />
          </div>

          <div className="relative max-w-2xl">
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-accent-ring uppercase">
              Why model matters
            </p>
            <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">
              A cover that “nearly fits” is a cover you will replace
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              Camera islands, button positions and curve radii change between models in the same
              family. This site is built around that: pick the model, see the fit.
            </p>
          </div>

          <ul className="relative mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <motion.li
                key={title}
                initial={reduced ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-white/10 text-accent-ring">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Trust / why shop ──────────────────────────────────────────────────────── */

const BENEFITS = [
  { icon: Ruler, title: 'Model-specific fitting', body: 'We check the fit against your handset before you leave the counter.' },
  { icon: Layers, title: 'Wide range in one place', body: 'Cases, glass, audio, charging, power and everyday utility — one trip, one list.' },
  { icon: HeartHandshake, title: 'Local support', body: 'A real shop with a real number. If something is wrong, bring it back and talk to a person.' },
  { icon: MessageSquarePlus, title: 'Easy order request', body: 'Build a list online, send it, and skip the back-and-forth on what is available.' },
  { icon: ShieldCheck, title: 'Free tempered-glass fitting', body: 'Applied dust-free in shop, with a re-do if a bubble appears on the first fit.' },
  { icon: Timer, title: 'Quick confirmation', body: 'Most requests are confirmed the same working day during shop hours.' },
];

export function WhyShopSection() {
  const { reduced } = useMotionPreference();

  return (
    <Section
      eyebrow="Why buy here"
      title="A shop, not a marketplace"
      description="You get the accessory that fits, checked by someone who handles these models every day."
    >
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, body }, index) => (
          <motion.li
            key={title}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
            className="surface-card flex gap-4 p-5"
          >
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong">
              <Icon className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}

/* ── Custom request invitation ─────────────────────────────────────────────── */

export function CustomRequestSection() {
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);
  const { entrance } = useMotionPreference();

  return (
    <section id="custom-request" className="scroll-mt-24 py-14 sm:py-20">
      <div className="container-page">
        <motion.div
          {...entrance}
          className="surface-card grid items-center gap-8 overflow-hidden bg-linear-to-br from-accent-soft/80 via-surface to-surface p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]"
        >
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.18em] text-accent-strong uppercase">
              Custom request
            </p>
            <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-[2.1rem]">
              Can&apos;t find your model or accessory?
            </h2>
            <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Tell us what you need. We&apos;ll check availability for your exact phone model — and
              if we do not stock it, we will tell you honestly rather than sell you a near-fit.
            </p>

            <blockquote className="mt-6 rounded-2xl border border-line bg-surface p-4 text-sm text-muted italic">
              “I need a transparent camera-protection case for Samsung Galaxy A55. I cannot find
              the model in the catalog.”
              <footer className="mt-2 text-xs font-semibold text-subtle not-italic">
                — the kind of request that works best
              </footer>
            </blockquote>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={openCustomRequest}
                iconLeft={<MessageSquarePlus className="size-4" aria-hidden />}
              >
                Send a Custom Request
              </Button>
              <a
                href={`https://wa.me/${shop.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-13 items-center justify-center gap-2.5 rounded-2xl border border-line-strong bg-surface px-7 text-base font-semibold text-ink transition-colors hover:border-accent hover:text-accent-strong"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp us
              </a>
            </div>
          </div>

          <ul className="grid gap-3">
            {[
              'Any brand, including models not listed here',
              'Bulk or repeat orders for an office or a shop',
              'Hard-to-find cuts: foldables, older models, tablets',
              'Colour or finish you have already seen elsewhere',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 rounded-xl bg-surface p-3.5 text-sm">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
                <span className="text-muted">{line}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Contact ───────────────────────────────────────────────────────────────── */

export function ContactSection() {
  const { entrance } = useMotionPreference();

  return (
    <Section
      id="contact"
      eyebrow="Visit or call"
      title="Come in, or send your list first"
      description="Shop hours, address and the fastest way to reach us."
    >
      <motion.div {...entrance} className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-6">
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-strong">
            <MapPin className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-bold">Shop address</h3>
          <address className="mt-2 text-sm leading-relaxed text-muted not-italic">
            {formattedAddress}
          </address>
          <a
            href={shop.address.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline"
          >
            Open in Maps
            <ArrowRight className="size-3.5" aria-hidden />
          </a>
        </div>

        <div className="surface-card p-6">
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-strong">
            <Clock className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-bold">Opening hours</h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            {shop.hours.map((slot) => (
              <div key={slot.days} className="flex justify-between gap-3">
                <dt className="text-muted">{slot.days}</dt>
                <dd className="font-medium text-ink">{slot.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="surface-card p-6">
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-strong">
            <Phone className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-bold">Talk to us</h3>
          <p className="mt-2 text-sm text-muted">
            Fastest for stock checks and unusual models.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={`tel:+${shop.phoneDigits}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              <Phone className="size-4" aria-hidden />
              {shop.phone}
            </a>
            <a
              href={`https://wa.me/${shop.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-strong"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

export function Footer() {
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-black text-white"
            >
              {shop.shortName}
            </span>
            <span className="font-display text-base font-extrabold">{shop.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{shop.tagline}</p>
          <p className="mt-4 text-xs text-subtle">
            {devices.length} {pluralize(devices.length, 'model')} across {brands.length} brands, with
            new models added as they launch.
          </p>
        </div>

        <nav aria-label="Shop">
          <h2 className="text-xs font-bold tracking-wide text-ink uppercase">Shop</h2>
          <ul className="mt-3.5 space-y-2.5 text-sm">
            {[
              { href: '#device-finder', label: 'Find by phone' },
              { href: '#categories', label: 'Categories' },
              { href: '#catalog', label: 'All accessories' },
            ].map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-muted transition-colors hover:text-accent-strong">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={openCustomRequest}
                className="text-muted transition-colors hover:text-accent-strong"
              >
                Custom request
              </button>
            </li>
          </ul>
        </nav>

        <nav aria-label="Visit">
          <h2 className="text-xs font-bold tracking-wide text-ink uppercase">Visit</h2>
          <ul className="mt-3.5 space-y-2.5 text-sm text-muted">
            <li>{shop.address.line1}</li>
            <li>{shop.address.line2}</li>
            <li>{shop.address.city}, {shop.address.state} {shop.address.pincode}</li>
            <li>
              <a href={shop.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-strong">
                Directions
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Contact">
          <h2 className="text-xs font-bold tracking-wide text-ink uppercase">Contact</h2>
          <ul className="mt-3.5 space-y-2.5 text-sm">
            <li>
              <a href={`tel:+${shop.phoneDigits}`} className="text-muted transition-colors hover:text-accent-strong">
                {shop.phone}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${shop.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-accent-strong"
              >
                WhatsApp
              </a>
            </li>
            {shop.hours.map((slot) => (
              <li key={slot.days} className="text-muted">
                {slot.days}: {slot.time}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {shop.name}. All rights reserved.</p>
          <p>
            Prices are indicative and confirmed by the shop before any order is finalised.
          </p>
        </div>
      </div>
    </footer>
  );
}
