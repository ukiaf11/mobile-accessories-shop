import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Phone, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { shop } from '../../config/shop';
import { cn } from '../../lib/cn';
import { cartTotals, useCartStore } from '../../store/cartStore';
import { useUiStore } from '../../store/uiStore';
import { useMotionPreference } from '../../hooks/useMotionPreference';
import { track } from '../../lib/analytics';
import { Button } from '../ui/Button';

const LINKS = [
  { href: '#device-finder', label: 'Find by Phone' },
  { href: '#categories', label: 'Accessories' },
  { href: '#catalog', label: 'Shop' },
  { href: '#custom-request', label: 'Custom Request' },
  { href: '#contact', label: 'Contact' },
];

export function AnnouncementBar() {
  if (!shop.announcement) return null;
  return (
    <div className="bg-ink text-white">
      <div className="container-page flex items-center justify-center gap-2 py-2 text-center text-xs sm:text-[13px]">
        <Sparkles className="size-3.5 shrink-0 text-accent-ring" aria-hidden />
        <p className="truncate">{shop.announcement}</p>
      </div>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const items = useCartStore((state) => state.items);
  const { count } = cartTotals(items);
  const { openCart, mobileNavOpen, setMobileNav } = useUiStore();
  const { reduced } = useMotionPreference();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet when the viewport grows past the breakpoint,
  // otherwise it stays mounted and traps taps on desktop.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = () => query.matches && setMobileNav(false);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [setMobileNav]);

  const handleCartClick = () => {
    track('cart_opened', { items: count });
    openCart();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300',
        scrolled
          ? 'glass-panel border-b shadow-[0_4px_24px_-16px_rgb(17_24_39/0.35)]'
          : 'border-b border-transparent bg-background/80 backdrop-blur-sm',
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 font-display">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-black text-white shadow-[0_8px_20px_-10px_rgb(109_93_252/0.9)]"
          >
            {shop.shortName}
          </span>
          <span className="hidden text-base leading-tight font-extrabold sm:block">
            {shop.name}
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={`tel:+${shop.phoneDigits}`}
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink md:inline-flex"
          >
            <Phone className="size-4" aria-hidden />
            <span className="hidden xl:inline">{shop.phone}</span>
            <span className="xl:hidden">Call</span>
          </a>

          <button
            type="button"
            onClick={handleCartClick}
            className="relative grid size-10 place-items-center rounded-xl border border-line-strong bg-surface text-ink transition-colors hover:border-accent hover:text-accent-strong"
            aria-label={count > 0 ? `Open request list, ${count} items` : 'Open request list'}
          >
            <ShoppingBag className="size-[18px]" aria-hidden />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white tabular-nums">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileNav(!mobileNavOpen)}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            className="grid size-10 place-items-center rounded-xl border border-line-strong bg-surface text-ink transition-colors hover:border-accent lg:hidden"
          >
            {mobileNavOpen ? <X className="size-[18px]" aria-hidden /> : <Menu className="size-[18px]" aria-hidden />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            id="mobile-nav"
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-surface lg:hidden"
          >
            <ul className="container-page flex flex-col py-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMobileNav(false)}
                    className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-surface-soft"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="px-3 py-3">
                <Button
                  fullWidth
                  iconLeft={<Phone className="size-4" aria-hidden />}
                  onClick={() => {
                    setMobileNav(false);
                    window.location.href = `tel:+${shop.phoneDigits}`;
                  }}
                >
                  Call {shop.phone}
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
