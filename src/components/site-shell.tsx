import { getProducts } from "@/lib/catalog";
import { getFacets } from "@/lib/products";
import { getAnnouncement } from "@/lib/settings";
import { getRates } from "@/lib/fx";
import Providers from "./providers";
import Header from "./header";
import Footer from "./footer";
import CartDrawer from "./cart-drawer";
import ProductModal from "./product-modal";
import AppointmentModal from "./appointment-modal";

/** Header, footer and the cart/viewing overlays shared by every content route (the home page composes the same pieces). */
export default async function SiteShell({ children }: { children: React.ReactNode }) {
  const [products, banner, { rates }] = await Promise.all([getProducts(), getAnnouncement(), getRates()]);
  const facets = getFacets(products);
  return (
    <Providers rates={rates}>
      <Header facets={facets} announcement={banner.enabled ? { message: banner.message, link: banner.link } : undefined} />
      {children}
      <Footer />
      <CartDrawer />
      <ProductModal />
      <AppointmentModal />
    </Providers>
  );
}
