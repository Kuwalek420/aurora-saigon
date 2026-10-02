"use client";

import { useState } from "react";
import { STATIC_VI } from "@/lib/translations";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";

type B = { type: "p" | "h3"; text: string };

/** English copy: the client's own text (raw-assets/docs/Engagement Rings.txt), unchanged. */
const EN = {
  title: "Ready to Buy Engagement Rings — Your Moment, Without the Wait",
  intro: "Planning to propose soon, or simply found the one you can’t wait to give? Our ready to buy engagement rings are designed for exactly that moment.",
  blocks: [
    { type: "p", text: "At Aurora Saigon, we offer a carefully curated selection of engagement rings, available immediately without the wait for custom production. From timeless solitaires to refined halo and vintage-inspired designs, each piece is chosen for its balance, beauty, and enduring style." },
    { type: "p", text: "Each ring is crafted using premium materials and set with carefully selected natural diamonds, natural sapphires, or lab-grown diamonds, and finished by skilled artisans with the same level of care we bring to our bespoke pieces. While these rings are ready to buy, they are never rushed — each one reflects our commitment to precision, proportion, and lasting quality." },
    { type: "h3", text: "A Ring You Can Choose With Confidence" },
    { type: "p", text: "Our ready to buy collection allows you to experience the process in a more immediate way — explore, select, and receive a ring that feels right, without compromise." },
    { type: "p", text: "If you would like guidance, we are always here to help. Whether you visit our boutique or speak with us directly, we can walk you through the details — from gemstone quality to design proportions — so you feel completely confident in your choice." },
    { type: "p", text: "Every piece is created with a focus on quality, craftsmanship, and responsible sourcing, offering a modern yet considered approach to fine jewelry." },
    { type: "h3", text: "Visit Us or Explore Online" },
    { type: "p", text: "You are welcome to explore our collection online or visit our boutique for a more personal experience. If you would like to refine a design or create something entirely bespoke, we are always happy to guide you through a custom process as well." },
    { type: "p", text: "However you choose to begin, we are here to help you find a ring that feels considered, personal, and ready for the moment that matters most." },
  ] as B[],
};

/**
 * "Ready to Buy Engagement Rings" block. The whole text is always in the document: when collapsed it is clipped by
 * height only (never display:none / hidden), so crawlers read all of it while visitors see the headline and first sentence.
 * Vietnamese: the live ready-to-buy page's own text (scripts/scrape-static-translations.js).
 */
export default function SeoContent() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const vi = useStore((s) => s.lang) === "vi";
  const d = vi ? { title: STATIC_VI.seo.title, intro: STATIC_VI.seo.intro, blocks: STATIC_VI.seo.blocks as B[] } : EN;
  return (
    <section id="the-aurora-standard" aria-labelledby="seo-heading" className="bg-alabaster py-28 md:py-36">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="max-w-[46rem]">
          <h2 id="seo-heading" className="font-display text-[clamp(2rem,3.6vw,3.2rem)] font-light leading-[1.08] text-balance">{d.title}</h2>
          <p className="mt-6 text-[0.98rem] leading-[1.8] text-obsidian/70">{d.intro}</p>

          <button
            id="seo-trigger"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="seo-more"
            className="group mt-8 flex w-full items-center justify-between gap-6 border-y border-charcoal/10 py-5 text-left transition-colors duration-500 hover:border-champagne/60"
          >
            <span className="font-display text-[1.25rem] font-normal leading-tight">{t("The Aurora Standard — Ready to Ship Collection")}</span>
            <span className="relative block h-3 w-3 shrink-0 text-champagne-deep" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
              <span className={`absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "scale-y-0" : ""}`} />
            </span>
          </button>

          <div id="seo-more" role="region" aria-labelledby="seo-trigger" className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <div className="space-y-6 pt-8 text-[0.98rem] leading-[1.8] text-obsidian/70">
                {d.blocks.map((b, i) => b.type === "h3" ? <h3 key={i} className="font-display pt-4 text-[1.6rem] font-normal leading-tight text-obsidian">{b.text}</h3> : <p key={i}>{b.text}</p>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
