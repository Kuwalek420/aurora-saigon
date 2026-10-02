import type { Metadata } from "next";
import policies from "@/data/policies.json";
import { siteConfig } from "@/data/site-config";
import PolicyPage from "@/components/policy-page";
import type { Block } from "@/components/article-body";
import { policyVi, WARRANTY_INTRO_VI } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Warranty & Care Policy",
  description: `${siteConfig.warranty.rings} on rings and a ${siteConfig.warranty.fineJewellery} on pendants, earrings and bracelets.`,
};

export default function LifetimeWarrantyPage() {
  return (
    <PolicyPage
      title={<>Warranty &amp; <em className="text-champagne-deep">care</em></>}
      intro={`Rings: ${siteConfig.warranty.rings}. Pendants, earrings, bracelets and chains: ${siteConfig.warranty.fineJewellery}.`}
      vi={{ title: <>Bảo hành &amp; <em className="text-champagne-deep">chăm sóc</em></>, intro: WARRANTY_INTRO_VI, sections: [{ blocks: policyVi.warranty.blocks as Block[] }] }}
      sections={[{ blocks: policies.pages.warranty.blocks as Block[] }]}
      closing
    />
  );
}
