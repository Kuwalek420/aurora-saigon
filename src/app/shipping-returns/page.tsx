import type { Metadata } from "next";
import policies from "@/data/policies.json";
import PolicyPage from "@/components/policy-page";
import { emphasize, type Block } from "@/components/article-body";
import { policyVi } from "@/lib/translations";

/** The live shipping policy has no bold of its own; these are the figures and terms a customer scans for. */
const SHIPPING_KEY_TERMS = [
  "Free international shipping",
  "No minimum purchase",
  "within Vietnam only",
  "1–3 business days",
  "20 business days",
  "International orders:",
  "5–10 business days",
  "Delivered Duties Paid",
  "no additional taxes or duties are payable upon delivery",
  "All shipments include tracking",
];

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "Delivery times, duties and taxes, and how to return a purchase from Aurora Saigon.",
};

export default function ShippingReturnsPage() {
  const { shipping, returns } = policies.pages;
  // the returns page opens with its own "Shipping & Returns" heading, which the page title already carries
  const returnsBlocks = (returns.blocks as Block[]).filter((b, i) => !(i === 0 && b.type === "h2"));
  return (
    <PolicyPage
      title={<>Shipping &amp; <em className="text-champagne-deep">returns</em></>}
      vi={{
        title: <>Vận chuyển &amp; <em className="text-champagne-deep">đổi trả</em></>,
        // the live Vietnamese page is a single combined policy; its own first heading repeats the title
        sections: [{ blocks: (policyVi.shippingReturns.blocks as Block[]).filter((b, i) => !(i === 0 && b.type === "h2")) }],
      }}
      sections={[
        { heading: "Shipping & delivery", blocks: emphasize(shipping.blocks as Block[], SHIPPING_KEY_TERMS) },
        { heading: "From our boutique, and returns", blocks: returnsBlocks },
      ]}
    />
  );
}
