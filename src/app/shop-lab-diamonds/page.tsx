import type { Metadata } from "next";
import SiteShell from "@/components/site-shell";
import LabDiamondsView from "@/components/landing/lab-diamonds-view";
import lab from "@/data/lab-diamond-prices.json";
import type { LabDiamondPrices } from "@/lib/diamond-data";

export const metadata: Metadata = {
  title: "Shop Lab Diamonds & Pricing Guide",
  description: "Lab grown diamond prices by shape, carat, colour and clarity, from our live GIA and IGI certified inventory.",
};

export default function ShopLabDiamondsPage() {
  return (
    <SiteShell>
      <LabDiamondsView lab={lab as unknown as LabDiamondPrices} />
    </SiteShell>
  );
}
