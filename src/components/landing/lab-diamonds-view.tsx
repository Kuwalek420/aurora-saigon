"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { LAB_DIAMONDS } from "@/data/landing-content";
import { labCell, loadLooseDiamonds, type LabDiamondPrices, type LooseStone } from "@/lib/diamond-data";
import { formatMoney, useStore } from "@/lib/store";
import { useBi, useT } from "@/lib/use-t";
import { InquiryDialog } from "../inquiry-form";
import DiamondInspectorModal from "../diamond-inspector-modal";
import { ShapeIcon } from "../icons";

const fmtDate = (iso: string, lang: "en" | "vi") => new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
const bandText = (b: number[]) => `${b[0].toFixed(2)} – ${b[1].toFixed(2)} ct`;

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`h-11 min-w-14 border px-4 text-[0.85rem] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-obsidian text-obsidian" : "border-charcoal/15 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian"}`}>
      {children}
    </button>
  );
}

export default function LabDiamondsView({ lab }: { lab: LabDiamondPrices }) {
  const bi = useBi();
  const t = useT();
  const lang = useStore((s) => s.lang);
  const currency = useStore((s) => s.currency);

  const shapes = Object.keys(lab.shapes);
  const [shape, setShape] = useState(shapes.includes("Round") ? "Round" : shapes[0]);
  const [colours, setColours] = useState<string[]>([...lab.colours]);
  const [clarities, setClarities] = useState<string[]>([...lab.clarities]);
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(lab.bands.length - 1);
  const [inspect, setInspect] = useState<LooseStone | null>(null);
  const [ask, setAsk] = useState<{ title: string; summary: string; context: string } | null>(null);

  // functional update, so quick successive clicks never work from a stale list; at least one option always stays on
  const toggle = (set: Dispatch<SetStateAction<string[]>>, v: string, order: string[]) =>
    set((prev) => {
      const next = prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v];
      return next.length ? order.filter((x) => next.includes(x)) : prev;
    });
  const rows = useMemo(() => lab.bands.map((b, i) => ({ b, i })).filter(({ i }) => i >= lo && i <= hi), [lab.bands, lo, hi]);
  const cols = useMemo(() => lab.colours.filter((c) => colours.includes(c)).flatMap((c) => lab.clarities.filter((cl) => clarities.includes(cl)).map((cl) => ({ c, cl }))), [lab, colours, clarities]);
  const inView = rows.flatMap(({ i }) => cols.map(({ c, cl }) => labCell(lab, shape, i, c, cl))).filter((x): x is NonNullable<typeof x> => !!x);
  const cheapest = inView.length ? Math.min(...inView.map((x) => x.p)) : null;
  const stones = inView.reduce((n, x) => n + x.n, 0);

  const enquire = (bandIdx: number, c: string, cl: string) => {
    const x = labCell(lab, shape, bandIdx, c, cl)!;
    const what = `${t(shape)}, ${bandText(lab.bands[bandIdx])}, ${c} ${cl}`;
    setAsk({
      title: t("Enquire about this stone"),
      summary: t("{what}. Lowest in stock: {price}.", { what, price: formatMoney(x.p, currency) }),
      context: `Lab diamond price guide (shop-lab-diamonds)\n${shape}, ${bandText(lab.bands[bandIdx])}, colour ${c}, clarity ${cl}\nLowest in stock ${x.p.toLocaleString("en")} VND, ${x.n} stones, ${x.cert}; snapshot ${lab.scrapedAt.slice(0, 10)}`,
    });
  };

  /** Opens the stone inspector for the cheapest stone of a cell; falls back to the plain enquiry if its details are not in the snapshot. */
  const inspectCell = async (bandIdx: number, c: string, cl: string) => {
    const s = (await loadLooseDiamonds()).lab[`${shape}|${bandIdx}|${c}|${cl}`];
    if (s) setInspect(s); else enquire(bandIdx, c, cl);
  };
  const enquireStone = (s: LooseStone) => {
    setInspect(null);
    setAsk({
      title: t("Enquire about this stone"),
      summary: t("{what}. Lowest in stock: {price}.", { what: `${t(shape)}, ${(s.carat ?? 0).toFixed(2)} ct, ${s.colour} ${s.clarity}`, price: formatMoney(s.price, currency) }),
      context: `Lab diamond price guide (shop-lab-diamonds)\n${shape}, ${(s.carat ?? 0).toFixed(2)} ct, colour ${s.colour}, clarity ${s.clarity}\n${s.cert ?? ""} report ${s.certNo ?? "n/a"}; stone id ${s.id}; ${s.price.toLocaleString("en")} VND; snapshot ${lab.scrapedAt.slice(0, 10)}`,
    });
  };

  const H = "eyebrow mb-3 text-[0.58rem] text-muted-gray";
  return (
    <main className="bg-alabaster pt-36 md:pt-44">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <h1 className="font-display max-w-[20ch] text-[clamp(2.8rem,6.2vw,5.8rem)] font-light leading-[1]">{bi(LAB_DIAMONDS.title)}</h1>
        <p className="mt-10 max-w-2xl text-[1.02rem] leading-[1.85] text-obsidian/72">{bi(LAB_DIAMONDS.intro)}</p>

        <section aria-labelledby="matrix-heading" className="mt-24 md:mt-32">
          <h2 id="matrix-heading" className="font-display text-[clamp(1.9rem,3.2vw,2.8rem)] font-light leading-[1.1]">{t("Lab diamond price matrix")}</h2>
          <p className="mt-5 max-w-xl text-[0.95rem] leading-[1.8] text-obsidian/70">{t("Choose a shape, carat range, colour and clarity. Each price is the lowest-priced stone in our stock for that combination.")}</p>

          <div className="mt-12 grid gap-x-16 gap-y-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <p className={H}>{t("Shape")}</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Shape")}>
                {shapes.map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={shape === s} onClick={() => setShape(s)} className={`flex h-11 items-center gap-2 border px-3 text-[0.82rem] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${shape === s ? "border-obsidian text-obsidian" : "border-charcoal/15 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian"}`}>
                    <ShapeIcon name={s} className="h-5 w-5" />
                    {t(s)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={H}>{t("Colour")}</p>
              <div className="flex gap-2" role="group" aria-label={t("Colour")}>
                {lab.colours.map((c) => <Toggle key={c} on={colours.includes(c)} onClick={() => toggle(setColours, c, lab.colours)}>{c}</Toggle>)}
              </div>
            </div>
            <div>
              <p className={H}>{t("Clarity")}</p>
              <div className="flex gap-2" role="group" aria-label={t("Clarity")}>
                {lab.clarities.map((c) => <Toggle key={c} on={clarities.includes(c)} onClick={() => toggle(setClarities, c, lab.clarities)}>{c}</Toggle>)}
              </div>
            </div>
            <div>
              <p className={H}>{t("Carat weight")}</p>
              <div className="flex items-center gap-3">
                <label className="sr-only" htmlFor="ct-lo">{t("From")}</label>
                <select id="ct-lo" value={lo} onChange={(e) => { const v = Number(e.target.value); setLo(v); if (v > hi) setHi(v); }} className="h-11 border border-charcoal/15 bg-transparent px-3 text-[0.85rem] tabular-nums outline-none focus:border-obsidian">
                  {lab.bands.map((b, i) => <option key={i} value={i}>{b[0].toFixed(2)} ct</option>)}
                </select>
                <span aria-hidden className="h-px w-3 bg-charcoal/40" />
                <label className="sr-only" htmlFor="ct-hi">{t("To")}</label>
                <select id="ct-hi" value={hi} onChange={(e) => { const v = Number(e.target.value); setHi(v); if (v < lo) setLo(v); }} className="h-11 border border-charcoal/15 bg-transparent px-3 text-[0.85rem] tabular-nums outline-none focus:border-obsidian">
                  {lab.bands.map((b, i) => <option key={i} value={i}>{b[1].toFixed(2)} ct</option>)}
                </select>
              </div>
            </div>
          </div>

          <p aria-live="polite" className="mt-12 text-[0.9rem] text-obsidian/75">
            {cheapest !== null
              ? t("{n} stones in view. Lowest price: {price}.", { n: stones, price: formatMoney(cheapest, currency) })
              : t("No {shape} stones in stock for this selection.", { shape: t(shape) })}
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left tabular-nums">
              <caption className="sr-only">{t("Lowest price in stock by carat range, colour and clarity")}</caption>
              <thead>
                <tr className="eyebrow border-b border-charcoal/15 text-[0.58rem] text-muted-gray">
                  <th scope="col" className="py-4 pr-6 font-medium">{t("Carat")}</th>
                  {cols.map(({ c, cl }) => <th key={`${c}${cl}`} scope="col" className="px-3 py-4 font-medium">{c} · {cl}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ b, i }) => (
                  <tr key={i} className="border-b border-charcoal/10">
                    <th scope="row" className="py-5 pr-6 text-[0.88rem] font-normal">{bandText(b)}</th>
                    {cols.map(({ c, cl }) => {
                      const x = labCell(lab, shape, i, c, cl);
                      return (
                        <td key={`${c}${cl}`} className="px-3 py-3 align-top">
                          {x ? (
                            <button type="button" onClick={() => inspectCell(i, c, cl)} aria-label={t("Inspect {what}", { what: `${t(shape)} ${bandText(b)} ${c} ${cl}` })} className="group block text-left">
                              <span className="block text-[0.95rem] transition-colors duration-500 group-hover:text-champagne-deep">{formatMoney(x.p, currency)}</span>
                              <span className="block text-[0.7rem] text-muted-gray">{t("{n} in stock", { n: x.n })}</span>
                            </button>
                          ) : (
                            <span className="text-obsidian/35" aria-label={t("none in stock")}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 max-w-2xl space-y-3 text-[0.8rem] leading-relaxed text-muted-gray">
            <p>{t("Prices are taken from our live lab diamond inventory on {date} and change as stones sell. All stones carry GIA or IGI certification. Select a price to inspect that stone.", { date: fmtDate(lab.scrapedAt, lang) })}</p>
            {currency !== "VND" && <p>{t("Stones are priced in VND; other currencies are converted at an indicative rate.")}</p>}
          </div>
        </section>
      </div>
      <div className="h-32 md:h-44" />
      <DiamondInspectorModal stone={inspect} title={inspect ? `${t(inspect.shape)} · ${(inspect.carat ?? 0).toFixed(2)} ct · ${inspect.colour} ${inspect.clarity}` : ""} onClose={() => setInspect(null)} onEnquire={enquireStone} />
      <InquiryDialog open={!!ask} title={ask?.title ?? ""} summary={ask?.summary} context={ask?.context ?? ""} onClose={() => setAsk(null)} />
    </main>
  );
}
