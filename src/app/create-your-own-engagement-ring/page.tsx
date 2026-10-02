import type { Metadata } from "next";
import SiteShell from "@/components/site-shell";
import CustomRingView from "@/components/landing/custom-ring-view";
import lab from "@/data/lab-diamond-prices.json";
import type { LabDiamondPrices } from "@/lib/diamond-data";

export const metadata: Metadata = {
  title: "Create Your Own Engagement Ring",
  description: "Design and custom make your own engagement ring in Ho Chi Minh City: choose a setting and a stone, see real starting prices, and request a complimentary quote.",
};

export default function CreateYourOwnEngagementRingPage() {
  return (
    <SiteShell>
      <CustomRingView lab={lab as unknown as LabDiamondPrices} />
    </SiteShell>
  );
}
