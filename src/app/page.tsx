import { getCatalog } from "@/lib/catalog";
import { getFacets } from "@/lib/products";
import { getAnnouncement } from "@/lib/settings";
import { getRates } from "@/lib/fx";
import Providers from "@/components/providers";
import Header from "@/components/header";
import { Suspense } from "react";
import Hero from "@/components/hero";
import RingAnatomy from "@/components/ring-anatomy";
import AboutFounders from "@/components/about-founders";
import ClientExperience from "@/components/client-experience";
import Catalog from "@/components/catalog";
import CartDrawer from "@/components/cart-drawer";
import ProductModal from "@/components/product-modal";
import AppointmentModal from "@/components/appointment-modal";
import SeoContent from "@/components/seo-content";
import GoogleReviews from "@/components/google-reviews";
import Footer from "@/components/footer";

// the catalogue comes from Supabase (products.json only if that fails); re-rendered at most every minute so a recovered database is picked up
export const revalidate = 60;
export default async function Home() {
  const [{ products, asOf }, banner, { rates }] = await Promise.all([getCatalog(), getAnnouncement(), getRates()]);
  const facets = getFacets(products);
  return (
    <Providers rates={rates}>
      <Header facets={facets} announcement={banner.enabled ? { message: banner.message, link: banner.link } : undefined} />
      <main>
        <Hero />
        <RingAnatomy />
        <AboutFounders />
        <ClientExperience />
        <Suspense fallback={null}>
          <Catalog products={products} asOf={asOf} />
        </Suspense>
        <SeoContent />
        <GoogleReviews />
      </main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <AppointmentModal />
    </Providers>
  );
}
