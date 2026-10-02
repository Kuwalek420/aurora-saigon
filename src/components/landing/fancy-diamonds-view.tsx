"use client";

import { useEffect, useState } from "react";
import { FANCY_DIAMONDS } from "@/data/landing-content";
import type { FancyDiamonds, FancyStone } from "@/lib/diamond-data";
import { formatMoney, useStore } from "@/lib/store";
import { useBi, useT } from "@/lib/use-t";
import { InquiryDialog } from "../inquiry-form";
import DiamondInspectorModal from "../diamond-inspector-modal";
import { loadLooseDiamonds, type LooseStone } from "@/lib/diamond-data";
import { ShapeIcon } from "../icons";

/** Swatch fill for each colour name the live site uses. A selector aid only; a real stone's colour is whatever its certificate states. */
const SWATCH: Record<string, string> = { Pink: "#E8A3B8", Yellow: "#E6C34A", Blue: "#5E8BD2", Green: "#6DA27E", Orange: "#E48A3C", Purple: "#8C63BE", Grey: "#9C9C9C", Brown: "#8A6344" };
const fmtDate = (iso: string, lang: "en" | "vi") => new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function FancyDiamondsView({ data }: { data: FancyDiamonds }) {
  const bi = useBi();
  const t = useT();
  const lang = useStore((s) => s.lang);
  const currency = useStore((s) => s.currency);
  const first = data.colours.find((c) => c.count > 0)?.name ?? data.colours[0].name;
  const [sel, setSel] = useState(first);
  const [inspect, setInspect] = useState<LooseStone | null>(null);
  const [ask, setAsk] = useState<{ title: string; summary: string; context: string } | null>(null);
  const colour = data.colours.find((c) => c.name === sel)!;
  const shapes = Object.entries(colour.byShape).sort((a, b) => a[1].from - b[1].from);

  const enquireStone = (s: FancyStone) => setAsk({
    title: t("Inquire about this gem"),
    summary: t("{what}. {price}.", { what: `${s.desc}, ${t(s.shape)}, ${s.carat.toFixed(2)} ct, ${s.clarity}`, price: formatMoney(s.price, currency) }),
    context: `Fancy coloured lab diamond (fancy-coloured-lab-diamonds)\n${s.desc}, ${s.shape}, ${s.carat.toFixed(2)} ct, clarity ${s.clarity}, ${s.cert}\nListed ${s.price.toLocaleString("en")} VND; snapshot ${data.scrapedAt.slice(0, 10)}`,
  });
  /** The inspector needs the stone's full record; it is matched by shape, carat and clarity, and the button only shows when it is found. */
  const [loose, setLoose] = useState<Record<string, LooseStone[]> | null>(null);
  useEffect(() => { loadLooseDiamonds().then((d) => setLoose(d.fancy)); }, []);
  const detail = (s: FancyStone) => loose?.[colour.name]?.find((x) => x.shape.toLowerCase() === s.shape.toLowerCase() && x.carat === s.carat && x.clarity === s.clarity && x.price === s.price) ?? null;
  const enquireFull = (x: LooseStone) => {
    setInspect(null);
    setAsk({
      title: t("Inquire about this gem"),
      summary: t("{what}. {price}.", { what: `${x.colourDesc ?? colour.name}, ${t(x.shape)}, ${(x.carat ?? 0).toFixed(2)} ct, ${x.clarity}`, price: formatMoney(x.price, currency) }),
      context: `Fancy coloured lab diamond (fancy-coloured-lab-diamonds)\n${x.colourDesc}, ${x.shape}, ${(x.carat ?? 0).toFixed(2)} ct, clarity ${x.clarity}\n${x.cert ?? ""} report ${x.certNo ?? "n/a"}; stone id ${x.id}; ${x.price.toLocaleString("en")} VND; snapshot ${data.scrapedAt.slice(0, 10)}`,
    });
  };
  const enquireColour = () => setAsk({
    title: t("Ask us to source a {colour} diamond", { colour: t(colour.name) }),
    summary: t("We have none in stock right now. Tell us the shape and size you want."),
    context: `Fancy coloured lab diamond (fancy-coloured-lab-diamonds)\nColour: ${colour.name}. Not in stock at the snapshot of ${data.scrapedAt.slice(0, 10)}; customer asks us to source one.`,
  });

  return (
    <main className="bg-alabaster pt-36 md:pt-44">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <h1 className="font-display max-w-[20ch] text-[clamp(2.8rem,6.2vw,5.8rem)] font-light leading-[1]">{bi(FANCY_DIAMONDS.title)}</h1>
        <p className="mt-10 max-w-2xl text-[1.02rem] leading-[1.85] text-obsidian/72">{bi(FANCY_DIAMONDS.intro)}</p>

        <section aria-labelledby="colour-heading" className="mt-24 md:mt-32">
          <h2 id="colour-heading" className="font-display text-[clamp(1.9rem,3.2vw,2.8rem)] font-light leading-[1.1]">{t("Choose a colour")}</h2>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-6" role="radiogroup" aria-label={t("Colour")}>
            {data.colours.map((c) => {
              const on = sel === c.name;
              return (
                <button key={c.code} type="button" role="radio" aria-checked={on} onClick={() => setSel(c.name)} className="group flex flex-col items-center gap-3">
                  <span className={`block h-14 w-14 rounded-full transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "shadow-[0_0_0_5px_#F4F0EB,0_0_0_6px_rgba(13,14,14,0.75)]" : "shadow-[0_0_0_1px_rgba(31,32,32,0.2)] group-hover:scale-105"} ${c.count === 0 ? "opacity-40" : ""}`} style={{ background: SWATCH[c.name] }} />
                  <span className={`eyebrow text-[0.6rem] transition-colors duration-500 ${on ? "text-obsidian" : "text-muted-gray group-hover:text-obsidian"}`}>{t(c.name)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-16 max-w-4xl" aria-live="polite">
            <h3 className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-light">{t(colour.name)}</h3>
            {colour.count > 0 ? (
              <>
                <p className="mt-4 text-[0.95rem] text-obsidian/75">{t("{n} stones in stock, from {price}.", { n: colour.count, price: formatMoney(colour.from!, currency) })}</p>

                <ul className="mt-10 divide-y divide-charcoal/10 border-y border-charcoal/10">
                  {colour.stones.map((s, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5">
                      <div className="flex items-center gap-4">
                        <ShapeIcon name={s.shape.charAt(0) + s.shape.slice(1).toLowerCase()} className="h-8 w-8 shrink-0 text-obsidian/70" />
                        <div>
                          <p className="font-display text-xl">{s.desc}</p>
                          <p className="mt-0.5 text-[0.78rem] tabular-nums text-muted-gray">{t(s.shape.charAt(0) + s.shape.slice(1).toLowerCase())} · {s.carat.toFixed(2)} ct · {s.clarity} · {s.cert}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="tabular-nums">{formatMoney(s.price, currency)}</p>
                        {detail(s) && <button type="button" onClick={() => setInspect(detail(s))} className="eyebrow border-b border-obsidian pb-1 text-[0.58rem] transition-colors duration-500 hover:border-champagne">{t("View details")}</button>}
                        <button type="button" onClick={() => enquireStone(s)} className="eyebrow border border-obsidian px-5 py-3 text-[0.58rem] transition-colors duration-500 hover:bg-obsidian hover:text-alabaster">{t("Inquire about this gem")}</button>
                      </div>
                    </li>
                  ))}
                </ul>

                {shapes.length > 0 && (
                  <div className="mt-12">
                    <p className="eyebrow mb-4 text-[0.58rem] text-muted-gray">{t("Lowest price by shape")}</p>
                    <ul className="grid grid-cols-2 gap-x-10 gap-y-3 text-[0.88rem] sm:grid-cols-3">
                      {shapes.map(([shape, v]) => (
                        <li key={shape} className="flex items-baseline justify-between gap-4 border-b border-charcoal/10 pb-2">
                          <span>{t(shape)}</span>
                          <span className="tabular-nums text-obsidian/75">{formatMoney(v.from, currency)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6 max-w-lg">
                <p className="text-[0.95rem] leading-[1.8] text-obsidian/75">{t("We have no {colour} stones in stock right now.", { colour: t(colour.name) })}</p>
                <button type="button" onClick={enquireColour} className="eyebrow mt-8 border border-obsidian px-8 py-4 text-[0.6rem] transition-colors duration-500 hover:bg-obsidian hover:text-alabaster">{t("Ask us to source one")}</button>
              </div>
            )}
          </div>

          <div className="mt-14 max-w-2xl space-y-3 text-[0.8rem] leading-relaxed text-muted-gray">
            <p>{t("Stock and prices are from our live fancy colour inventory on {date} and change as stones sell. Every stone carries GIA or IGI certification, and its exact colour grade is stated on that report.", { date: fmtDate(data.scrapedAt, lang) })}</p>
            {currency !== "VND" && <p>{t("Stones are priced in VND; other currencies are converted at an indicative rate.")}</p>}
          </div>
        </section>
      </div>
      <div className="h-32 md:h-44" />
      <DiamondInspectorModal stone={inspect} title={inspect ? `${inspect.colourDesc ?? colour.name} · ${t(inspect.shape)} · ${(inspect.carat ?? 0).toFixed(2)} ct` : ""} onClose={() => setInspect(null)} onEnquire={enquireFull} />
      <InquiryDialog open={!!ask} title={ask?.title ?? ""} summary={ask?.summary} context={ask?.context ?? ""} onClose={() => setAsk(null)} />
    </main>
  );
}
