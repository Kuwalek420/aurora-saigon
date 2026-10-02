"use client";

import { memo, useState } from "react";
import FadeImage from "./fade-image";
import { cardSubtitle, formatMoney, metalOptions, wasPrice, METAL_DOT as DOT, METAL_LABEL, unitPrice, useStore } from "@/lib/store";
import type { MetalKey, Product } from "@/lib/types";
import { useT } from "@/lib/use-t";
import { productName, subtitleFor } from "@/lib/localize";

function ProductCard({ p }: { p: Product }) {
  const currency = useStore((s) => s.currency);
  const lang = useStore((s) => s.lang);
  const t = useT();
  const name = productName(p, lang);
  const startPurchase = useStore((s) => s.startPurchase);
  const openDetail = useStore((s) => s.openDetail);
  const sold = p.isSold;
  const options = metalOptions(p);
  const [metal, setMetal] = useState<MetalKey>(options.includes(p.metal) ? p.metal : options[0]);
  const price = unitPrice(p, metal);
  const was = sold ? null : wasPrice(p, price);
  const src = p.metalImages?.[metal] ?? p.images[0];
  const preload = (m: MetalKey) => { const u = p.metalImages?.[m]; if (u) new Image().src = u; };

  return (
    <article className="group relative flex flex-col items-center text-center">
      {/* the original studio photo, untouched; it multiplies into the cream ground so the backdrop merges with the card */}
      <button onClick={() => openDetail(p, metal)} aria-label={t("View {title}", { title: name })} className="relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-cream">
        <span className={`absolute inset-0 mix-blend-multiply transition-[transform,opacity] ${sold ? "opacity-55" : ""} duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]`}>
          <FadeImage src={src} alt={`${name}, ${t(METAL_LABEL[metal])}`} />
        </span>
        {was && <span className="eyebrow absolute left-3 top-3 bg-alabaster px-3 py-1.5 text-[0.55rem] text-obsidian">{t("Sale")}</span>}
      </button>

      <div className="flex flex-col items-center pt-6">
        <h3 className="font-display text-[18px] font-normal leading-snug text-obsidian">
          <button onClick={() => openDetail(p, metal)} className="transition-colors duration-500 hover:text-champagne-deep">
            {name}
          </button>
        </h3>
        <p className="mt-2 text-[12px] uppercase tracking-wider text-muted-gray">{subtitleFor(cardSubtitle(p), t)}</p>
        <p className="mt-3 text-[13px] tabular-nums tracking-wide text-obsidian">{was && <s className="mr-2 text-muted-gray">{formatMoney(was, currency)}</s>}{formatMoney(price, currency)}</p>

        <div className="mt-5 flex h-5 items-center gap-2.5" role="radiogroup" aria-label={t("Metal")}>
          {!sold && options.length > 1 &&
            options.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={metal === m}
                aria-label={t(METAL_LABEL[m])}
                title={t(METAL_LABEL[m])}
                onClick={() => setMetal(m)}
                onMouseEnter={() => preload(m)}
                onFocus={() => preload(m)}
                className="flex h-5 w-5 items-center justify-center"
              >
                <span
                  className={`block h-2.5 w-2.5 rounded-full transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${metal === m ? "shadow-[0_0_0_3px_#F4F0EB,0_0_0_4px_rgba(13,14,14,0.55)]" : "shadow-[0_0_0_1px_rgba(31,32,32,0.18)] hover:scale-125"}`}
                  style={{ background: DOT[m] }}
                />
              </button>
            ))}
        </div>
        {sold ? (
          <p className="eyebrow mt-5 text-[0.6rem] text-muted-gray">{t("Sold / Atelier archive")}</p>
        ) : (
        <button
          onClick={() => startPurchase(p, metal)}
          className="eyebrow mt-5 text-[0.6rem] text-muted-gray underline decoration-charcoal/0 decoration-1 underline-offset-[6px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-obsidian hover:decoration-champagne max-md:decoration-charcoal/25 md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
        >
          {t("Quick add")}
        </button>
        )}
      </div>
    </article>
  );
}

export default memo(ProductCard);
