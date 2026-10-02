import type { Metadata } from "next";
import SiteShell from "@/components/site-shell";
import FancyDiamondsView from "@/components/landing/fancy-diamonds-view";
import fancy from "@/data/fancy-diamonds.json";
import type { FancyDiamonds } from "@/lib/diamond-data";

export const metadata: Metadata = {
  title: "Fancy Coloured Lab Diamonds",
  description: "Loose fancy coloured lab grown diamonds in pink, yellow, blue and more, ethically created with GIA or IGI certification.",
};

export default function FancyColouredLabDiamondsPage() {
  return (
    <SiteShell>
      <FancyDiamondsView data={fancy as unknown as FancyDiamonds} />
    </SiteShell>
  );
}
