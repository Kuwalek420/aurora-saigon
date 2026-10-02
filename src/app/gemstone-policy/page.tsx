import type { Metadata } from "next";
import policies from "@/data/policies.json";
import PolicyPage from "@/components/policy-page";
import type { Block } from "@/components/article-body";
import { policyVi } from "@/lib/translations";

export const metadata: Metadata = {
  title: "Customer-Supplied Gemstone Policy",
  description: "How Aurora Saigon inspects, handles and takes responsibility for gemstones you supply.",
};

/**
 * The live policy numbers two different clauses "2." (Emerald and Mounted Gemstones, then Responsibility).
 * The clause titles are kept as published; only the numbers are made sequential.
 */
function renumber(blocks: Block[]): Block[] {
  let n = 0;
  return blocks.map((b) => (b.type === "h2" && b.text ? { ...b, text: `${++n}. ${b.text.replace(/^\d+\.\s*/, "")}` } : b));
}

export default function GemstonePolicyPage() {
  return (
    <PolicyPage
      title={<>Customer-supplied <em className="text-champagne-deep">gemstones</em></>}
      vi={{ title: <>Chính sách nhận <em className="text-champagne-deep">đá từ khách hàng</em></>, sections: [{ blocks: policyVi.gemstone.blocks as Block[] }] }}
      sections={[{ blocks: renumber(policies.pages.gemstone.blocks as Block[]) }]}
      closing
    />
  );
}
