import { useCatalogFilters } from './hooks/useCatalogFilters';
import { AnnouncementBar, Navbar } from './components/layout/Navbar';
import {
  CompatibilitySection, ContactSection, CustomRequestSection, FeaturedProducts, Footer,
  WhyShopSection,
} from './components/layout/MarketingSections';
import { HeroSection } from './components/hero/HeroSection';
import { DeviceFinder } from './components/device-finder/DeviceFinder';
import { CategoryGrid } from './components/catalog/CategoryGrid';
import { CatalogSection } from './components/catalog/CatalogSection';
import { ProductQuickView } from './components/catalog/ProductQuickView';
import { CartDrawer } from './components/cart/CartDrawer';
import { OrderForm } from './components/order/OrderForm';
import { CustomRequestForm } from './components/order/CustomRequestForm';
import { Toaster } from './components/ui/Toaster';

/**
 * Page composition follows 03_UI_UX_BLUEPRINT.md section 3.
 *
 * One catalog controller is created here and passed down, so the device finder, the category
 * grid and the product grid all read and write the same filter state — and the same URL.
 */
export default function App() {
  const catalog = useCatalogFilters();

  return (
    <>
      <a
        href="#catalog"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-200 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to accessories
      </a>

      <AnnouncementBar />
      <Navbar />

      <main>
        <HeroSection />
        <DeviceFinder catalog={catalog} />
        <CategoryGrid catalog={catalog} />
        <CatalogSection catalog={catalog} />
        <FeaturedProducts catalog={catalog} />
        <CompatibilitySection />
        <WhyShopSection />
        <CustomRequestSection />
        <ContactSection />
      </main>

      <Footer />

      {/* Overlays live outside <main> so a screen reader is not left inside stale page content. */}
      <ProductQuickView device={catalog.selectedDevice} />
      <CartDrawer device={catalog.selectedDevice} />
      <OrderForm device={catalog.selectedDevice} />
      <CustomRequestForm />
      <Toaster />
    </>
  );
}
