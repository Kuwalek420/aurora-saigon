import type { Metadata } from "next";
import faq from "@/data/faq.json";
import { siteConfig } from "@/data/site-config";
import SiteShell from "@/components/site-shell";
import { T } from "@/components/t";
import FaqAccordion from "@/components/faq-accordion";
import { faqVi } from "@/lib/translations";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about our materials, manufacturing, shipping and payment.",
};

const pay = siteConfig.paymentGateways;
/**
 * The live answer names only Stripe for online checkout. The privacy policy names AlePay for domestic cards and Stripe
 * for international ones, so the answer is reconciled to site-config and says this storefront is a demo.
 */
const PAYMENT_ONLINE = `Online: ${pay.domestic} (domestic Vietnam cards), direct bank transfer, and ${pay.international} (international payments; Demo Mode on this storefront). ${pay.demoNote}`;
const categories = faq.categories.map((c) => ({
  ...c,
  items: c.items.map((it) =>
    /payment/i.test(it.question)
      ? { ...it, answer: [...it.answer.map((p) => p.replace(/s*Alternatively, you can complete your purchase online[^.]*./i, "")), PAYMENT_ONLINE] }
      : it,
  ),
}));

export default function FaqPage() {
  return (
    <SiteShell>
      <main className="bg-alabaster pb-28 pt-36 md:pb-36 md:pt-44">
        <div className="mx-auto max-w-[56rem] px-5 md:px-10">
          <h1 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-light leading-[1]"><T>Frequently asked</T> <em className="text-champagne-deep"><T>questions</T></em></h1>
          <div className="mt-16 md:mt-24">
            <FaqAccordion categories={categories} categoriesVi={faqVi} />
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
