"use client";

import { useState } from "react";
import { useT } from "@/lib/use-t";
import { useStore } from "@/lib/store";

type Category = { name: string; items: { question: string; answer: string[] }[] };

/** Category tabs over a one-at-a-time accordion. Panels collapse by height (not display:none) so the text stays in the page for crawlers. */
export default function FaqAccordion({ categories: en, categoriesVi }: { categories: Category[]; categoriesVi: Category[] }) {
  const t = useT();
  const vi = useStore((s) => s.lang) === "vi";
  const categories = vi ? categoriesVi : en;
  const [catIndex, setCatIndex] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const current = categories[catIndex] ?? categories[0];

  return (
    <div>
      <div className="flex gap-8" role="tablist" aria-label={t("FAQ category")}>
        {categories.map((c, ci) => (
          <button
            key={c.name}
            role="tab"
            aria-selected={catIndex === ci}
            onClick={() => { setCatIndex(ci); setOpen(null); }}
            className={`eyebrow relative pb-4 transition-colors duration-500 ${catIndex === ci ? "text-obsidian" : "text-muted-gray hover:text-obsidian"}`}
          >
            {c.name}
            <span className="ml-2 text-[0.6rem] tabular-nums text-muted-gray">{c.items.length}</span>
            {catIndex === ci && <span className="absolute inset-x-0 -bottom-px h-px bg-champagne" />}
          </button>
        ))}
      </div>

      <ul className="mt-10">
        {current.items.map((it, i) => {
          const id = `${current.name}-${i}`;
          const isOpen = open === id;
          return (
            <li key={id} className="border-b border-charcoal/10 first:border-t">
              <h3>
                <button
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${id}`}
                  className="flex w-full items-center justify-between gap-8 py-7 text-left"
                >
                  <span className={`font-display text-[clamp(1.35rem,2vw,1.75rem)] font-normal leading-snug transition-colors duration-500 ${isOpen ? "text-obsidian" : "text-obsidian/80 hover:text-obsidian"}`}>{it.question}</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden className="shrink-0 text-champagne-deep">
                    <path d="M0 7h14" />
                    <path d="M7 0v14" className={`origin-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "scale-y-0" : ""}`} style={{ transformBox: "fill-box" }} />
                  </svg>
                </button>
              </h3>
              <div id={`faq-${id}`} role="region" aria-hidden={!isOpen} className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="max-w-2xl space-y-4 pb-8 leading-[1.8] text-obsidian/65">
                    {it.answer.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
