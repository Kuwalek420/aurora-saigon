import { Suspense } from "react";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { getFacets } from "@/lib/products";
import { getAnnouncement } from "@/lib/settings";
import { getRates } from "@/lib/fx";
import Providers from "@/components/providers";
import Header from "@/components/header";
import Catalog from "@/components/catalog";
import CartDrawer from "@/components/cart-drawer";
import ProductModal from "@/components/product-modal";
import AppointmentModal from "@/components/appointment-modal";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Engagement rings, wedding rings, pendants and ready-to-ship pieces from Aurora Saigon, with live pricing by metal.",
};
export const revalidate = 60;

/** The catalogue on its own page; /catalog?category=wedding-rings&gender=women opens the matching tab. */
export default async function CatalogPage() {
  const [{ products, asOf }, banner, { rates }] = await Promise.all([getCatalog(), getAnnouncement(), getRates()]);
  const facets = getFacets(products);
  return (
    <Providers rates={rates}>
      <Header facets={facets} announcement={banner.enabled ? { message: banner.message, link: banner.link } : undefined} />
      <main className="pt-16 md:pt-24">
        <Suspense fallback={null}>
          <Catalog products={products} asOf={asOf} />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <ProductModal />
      <AppointmentModal />
    </Providers>
  );
}
