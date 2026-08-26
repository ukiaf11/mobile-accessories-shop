import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, MessageSquarePlus, ShieldCheck, Star, Truck } from 'lucide-react';
import { useCallback } from 'react';
import { shop } from '../../config/shop';
import { devices } from '../../data/devices';
import { products } from '../../data/products';
import { brands } from '../../data/brands';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { ProductArt } from '../catalog/ProductArt';

/**
 * Hero. Blueprint 03_UI_UX_BLUEPRINT.md section 5: split composition, floating accessory
 * cards, staggered entrance, subtle pointer parallax — all disabled under reduced motion.
 */

const FLOATERS = [
  { art: 'case-magsafe', label: 'MagSafe Case', price: '₹899', className: 'left-[2%] top-[8%]', delay: 0.15, depth: 26 },
  { art: 'glass-privacy', label: 'Privacy Glass', price: '₹449', className: 'right-[0%] top-[24%]', delay: 0.3, depth: 18 },
  { art: 'earbuds', label: 'TWS Earbuds', price: '₹1,499', className: 'left-[-2%] bottom-[16%]', delay: 0.45, depth: 34 },
  { art: 'cable', label: '100W Cable', price: '₹299', className: 'right-[4%] bottom-[4%]', delay: 0.6, depth: 22 },
];

const STATS = [
  { value: `${brands.length}+`, label: 'Brands covered' },
  { value: `${Math.floor(devices.length / 10) * 10}+`, label: 'Phone & tablet models' },
  { value: `${Math.floor(products.length / 10) * 10}+`, label: 'Accessories in stock' },
];

const TRUST = [
  { icon: ShieldCheck, text: 'Model-specific fitting' },
  { icon: Truck, text: shop.deliveryEnabled ? 'Pickup or local delivery' : 'Shop pickup' },
  { icon: Star, text: 'Availability confirmed on call' },
];

export function HeroSection() {
  const { reduced } = useMotionPreference();
  const openCustomRequest = useUiStore((state) => state.openCustomRequest);

  // Pointer parallax: raw motion values -> springs, so the layers ease rather than snap.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 22, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 22, mass: 0.4 });

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduced || event.pointerType !== 'mouse') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
      pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    },
    [pointerX, pointerY, reduced],
  );

  const resetPointer = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Ambient gradient wash. Purely decorative. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-24 size-[34rem] rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute -bottom-52 -left-32 size-[30rem] rounded-full bg-[#4f7cff]/12 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-24">
        <div>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-ring/70 bg-accent-soft px-3.5 py-1.5 text-[11px] font-bold tracking-[0.16em] text-accent-strong uppercase"
          >
            Mobile Accessories
          </motion.p>

          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
            className="text-[2.15rem] leading-[1.08] font-extrabold sm:text-5xl lg:text-[3.5rem]"
          >
            Covers, glass &amp; accessories that{' '}
            <span className="accent-gradient-text">actually fit your phone</span>
          </motion.h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14 }}
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-lg"
          >
            Pick your exact model and we show only what fits it — no guessing, no wrong cut-outs.
            Send the list to the shop and we confirm availability and final price on a call.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => document.getElementById('device-finder')?.scrollIntoView({ block: 'start' })}
              iconRight={<ArrowRight className="size-4" aria-hidden />}
            >
              Find Accessories
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={openCustomRequest}
              iconLeft={<MessageSquarePlus className="size-4" aria-hidden />}
            >
              Custom Request
            </Button>
          </motion.div>

          <motion.ul
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
          >
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-[13px] font-medium text-muted">
                <Icon className="size-4 text-success" aria-hidden />
                {text}
              </li>
            ))}
          </motion.ul>

          <motion.dl
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-extrabold text-ink tabular-nums sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{stat.label}</span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Visual composition */}
        <div
          className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none"
          onPointerMove={onPointerMove}
          onPointerLeave={resetPointer}
        >
          <ParallaxLayer x={smoothX} y={smoothY} depth={12} reduced={reduced} className="absolute inset-[12%_18%]">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full"
            >
              <PhoneRender />
            </motion.div>
          </ParallaxLayer>

          {FLOATERS.map((floater) => (
            <ParallaxLayer
              key={floater.art}
              x={smoothX}
              y={smoothY}
              depth={floater.depth}
              reduced={reduced}
              className={`absolute w-[8.5rem] sm:w-40 ${floater.className}`}
            >
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 24, scale: 0.9 }}
                animate={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: 1, y: [0, -10, 0], scale: 1 }
                }
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        opacity: { duration: 0.5, delay: floater.delay },
                        scale: { duration: 0.5, delay: floater.delay },
                        y: {
                          duration: 5.5 + floater.depth / 20,
                          delay: floater.delay,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }
                }
                className="glass-panel flex items-center gap-2.5 rounded-2xl p-2.5 shadow-[var(--shadow-float)]"
              >
                <div className="size-11 shrink-0 overflow-hidden rounded-xl">
                  <ProductArt artKey={floater.art} label="" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] leading-tight font-bold text-ink">{floater.label}</p>
                  <p className="text-[11px] font-semibold text-accent-strong">{floater.price}</p>
                </div>
              </motion.div>
            </ParallaxLayer>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Translates a layer by a fraction of the pointer offset. Depth = pixels of travel. */
function ParallaxLayer({
  x, y, depth, reduced, className, children,
}: {
  x: ReturnType<typeof useSpring>;
  y: ReturnType<typeof useSpring>;
  depth: number;
  reduced: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const translateX = useTransform(x, (value) => (reduced ? 0 : value * depth));
  const translateY = useTransform(y, (value) => (reduced ? 0 : value * depth));

  return (
    <motion.div style={{ x: translateX, y: translateY }} className={className}>
      {children}
    </motion.div>
  );
}

/** Stylised phone render behind the floating cards. Decorative only. */
function PhoneRender() {
  return (
    <svg viewBox="0 0 260 400" aria-hidden className="h-full w-full drop-shadow-[0_40px_60px_rgb(81_67_217/0.28)]">
      <defs>
        <linearGradient id="hero-phone-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b7dff" />
          <stop offset="50%" stopColor="#6d5dfc" />
          <stop offset="100%" stopColor="#4132b8" />
        </linearGradient>
        <linearGradient id="hero-phone-screen" x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#1b1f3b" />
          <stop offset="100%" stopColor="#0b0d1c" />
        </linearGradient>
        <linearGradient id="hero-phone-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="24" y="14" width="212" height="372" rx="46" fill="url(#hero-phone-body)" />
      <rect x="34" y="24" width="192" height="352" rx="38" fill="url(#hero-phone-screen)" />

      {/* Dynamic-island style cutout */}
      <rect x="106" y="40" width="48" height="15" rx="7.5" fill="#000" opacity="0.85" />

      {/* Abstract app grid on the screen */}
      <g opacity="0.9">
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={54 + (i % 4) * 40}
            y={86 + Math.floor(i / 4) * 44}
            width="30"
            height="30"
            rx="9"
            fill="#ffffff"
            opacity={0.08 + (i % 5) * 0.045}
          />
        ))}
      </g>
      <rect x="54" y="238" width="152" height="10" rx="5" fill="#ffffff" opacity="0.14" />
      <rect x="54" y="258" width="104" height="10" rx="5" fill="#ffffff" opacity="0.1" />
      <rect x="66" y="318" width="128" height="42" rx="21" fill="#6d5dfc" opacity="0.85" />
      <rect x="86" y="334" width="88" height="10" rx="5" fill="#ffffff" opacity="0.75" />

      <rect x="34" y="24" width="96" height="180" rx="38" fill="url(#hero-phone-shine)" />
    </svg>
  );
}
