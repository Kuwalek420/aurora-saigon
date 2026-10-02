"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FEATHER, GainFilter, Stage, useGain, type Slide } from "./graded-photo";
import { activeKarat, cutLabel, cardSubtitle, DEFAULT_KARAT, formatMoney, chainLabel, metalLabel, wasPrice, metalOptions, METAL_DOT, METAL_LABEL, unitPrice, useStore } from "@/lib/store";
import type { MetalKey, Product } from "@/lib/types";
import { siteConfig, warrantyFor } from "@/data/site-config";
import LoopVideo from "./loop-video";
import { compactNumber } from "@/lib/certificate";
import { useT } from "@/lib/use-t";
import { productDescription, productName, subtitleFor } from "@/lib/localize";

const EASE = [0.22, 1, 0.36, 1] as const;
const WHOLE = ["4", "5", "6", "7", "8", "9"];

/** Standard US ring-size chart (inner diameter / inner circumference). */
const SIZE_CHART: [string, string, string][] = [
  ["4", "14.9", "46.8"], ["4.5", "15.3", "48.0"], ["5", "15.7", "49.3"], ["5.5", "16.1", "50.6"], ["6", "16.5", "51.9"], ["6.5", "16.9", "53.1"],
  ["7", "17.3", "54.4"], ["7.5", "17.7", "55.7"], ["8", "18.2", "57.0"], ["8.5", "18.6", "58.3"], ["9", "18.9", "59.5"],
];

function Seal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <circle cx="12" cy="10" r="6" />
      <path d="M8.5 15 7 22l5-2.6L17 22l-1.5-7" />
      <path d="m9.6 10 1.7 1.7 3.1-3.3" />
    </svg>
  );
}

/** Same treatment as the stage, so a thumbnail has no tone difference from the panel around it. */
function Thumb({ src, grade }: { src: string; grade: boolean }) {
  const { gain } = useGain(src, grade);
  const fid = "t" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <>
      <GainFilter id={fid} gain={gain} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" style={{ filter: `url(#${fid})` }} className={`absolute inset-0 h-full w-full object-contain ${FEATHER}`} />
    </>
  );
}

/** Draw-your-own play mark over a video thumbnail. */
function PlayMark() {
  return (
    <span className="absolute inset-0 grid place-items-center" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" className="drop-shadow-[0_0_1px_rgba(0,0,0,0.6)]">
        <circle cx="12" cy="12" r="10.5" />
        <path d="M10 8.2v7.6l6-3.8z" fill="#fff" />
      </svg>
    </span>
  );
}

function Gallery({ slides }: { slides: Slide[] }) {
  const t = useT();
  // selection is tracked by view, not position, so switching metal keeps you on the same angle
  const [sel, setSel] = useState("front");
  const i = Math.max(0, slides.findIndex((s) => s.key === sel));
  const slide = slides[i];
  return (
    <div className="flex flex-col items-center gap-5 px-5 pb-4 pt-20 lg:sticky lg:top-0 lg:h-[100dvh] lg:justify-center lg:self-start lg:px-12 lg:pb-8 lg:pt-16">
      <div className="w-full lg:w-[min(100%,calc(100dvh-18rem))]">
        {slide.video ? (
          <div className="relative aspect-square w-full overflow-hidden bg-alabaster">
            <LoopVideo key={slide.video} src={slide.video} poster={slide.src} label={t("On-hand video of the ring")} className="h-full object-cover" />
          </div>
        ) : (
          <Stage slide={slide} />
        )}
        <p className="eyebrow mt-4 h-3 text-center text-[0.52rem] text-obsidian/60" aria-hidden>{slide.zone && !slide.video ? t("Hover the stone to magnify") : ""}</p>
      </div>
      <div className="hide-scroll flex max-w-full gap-3 overflow-x-auto pb-1" role="tablist" aria-label={t("Product views")}>
        {slides.map((s, n) => (
          <button key={s.key} role="tab" aria-selected={n === i} aria-label={s.label} onClick={() => setSel(s.key)} className="group shrink-0 text-center">
            <span className={`relative block h-16 w-16 overflow-hidden transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${n === i ? "opacity-100" : "opacity-55 group-hover:opacity-100"}`}>
              {s.video ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  <PlayMark />
                </>
              ) : (
                <Thumb src={s.src} grade={s.grade !== false} />
              )}
            </span>
            <span className={`eyebrow mt-1.5 block w-16 whitespace-nowrap border-b pb-1 text-center text-[0.58rem]! tracking-[0.08em]! transition-colors duration-500 ${n === i ? "border-obsidian text-obsidian" : "border-transparent text-muted-gray"}`}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FourCs({ p }: { p: Product }) {
  const t = useT();
  const carat = p.carat && p.carat !== "0" ? p.carat.replace(/ct/i, " ct") : "—";
  const cells: [string, string, boolean][] = [
    [t("Carat"), carat, false],
    [t("Cut"), p.cutGrade ? `${subtitleFor(cutLabel(p), t)}, ${p.cutGrade}` : subtitleFor(cutLabel(p), t), false],
    [t("Clarity"), p.clarity || t("Stated on certificate"), !p.clarity],
    [t("Colour"), p.colour || t("Stated on certificate"), !p.colour],
  ];
  return (
    <section aria-label={t("Diamond 4Cs")} className="border-t border-charcoal/10 pt-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="eyebrow text-[0.62rem] text-obsidian">{t("The 4Cs")}</h3>
        <span className="flex items-center gap-2 border border-champagne/50 px-3 py-1.5 text-champagne-deep">
          <Seal />
          <span className="eyebrow text-[0.55rem]">{t("IGI / GIA Certified")}</span>
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-charcoal/10">
        {cells.map(([k, v, soft]) => (
          <div key={k} className="bg-alabaster p-4">
            <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{k}</dt>
            <dd className={soft ? "text-[0.78rem] leading-snug text-obsidian/60" : "font-display text-[1.35rem] leading-tight"}>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[0.7rem] leading-relaxed text-muted-gray">{t("Complete grading is set out on the IGI or GIA report that accompanies the stone.")}</p>
      <figure className="mt-8">
        <LoopVideo src="/assets/showroom/carat-size-gauge.mp4" poster="/assets/showroom/carat-size-gauge-poster.jpg" label={t("A carat size gauge on a real hand: oval stones from 0.75 ct to 4 ct, each labelled with its dimensions")} />
        <figcaption className="mt-3 text-[0.7rem] leading-relaxed text-muted-gray">{t("Carat size reference: oval cuts from 0.75 ct to 4 ct on a real hand.")}</figcaption>
      </figure>
    </section>
  );
}

function StoneDetails({ p }: { p: Product }) {
  const t = useT();
  const rows: [string, string][] = [
    [t("Stone"), t(/lab[- ]grown diamond/i.test(p.gemstone) ? "Lab Diamond" : p.gemstone)],
    [t("Shape"), subtitleFor(cutLabel(p), t)],
    [t("Weight"), p.carat && p.carat !== "0" ? p.carat.replace(/ct/i, " ct") : "—"],
    [t("Size"), p.isPendant ? "—" : p.stoneSize || "—"],
  ].filter(([, v]) => v !== "None" && v !== "—") as [string, string][];
  if (!rows.length) return null;
  return (
    <section aria-label={t("Stone details")} className="border-t border-charcoal/10 pt-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="eyebrow text-[0.62rem] text-obsidian">{t("Stone details")}</h3>
        <span className="flex items-center gap-2 border border-charcoal/15 px-3 py-1.5 text-obsidian/60">
          <Seal />
          <span className="eyebrow text-[0.55rem]">{t("Authenticity card included")}</span>
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-charcoal/10">
        {rows.map(([k, v]) => (
          <div key={k} className="bg-alabaster p-4">
            <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{k}</dt>
            <dd className="font-display text-[1.25rem] leading-tight">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Detail({ p, initialMetal }: { p: Product; initialMetal: MetalKey }) {
  const { currency, addItem, closeDetail, openViewing } = useStore();
  const lang = useStore((s) => s.lang);
  const t = useT();
  const options = metalOptions(p);
  const [metalPick, setMetal] = useState<MetalKey>(options.includes(initialMetal) ? initialMetal : options[0]);
  // a live edit can remove a metal the shopper had selected
  const metal = options.includes(metalPick) ? metalPick : options[0];
  const [karatPick, setKaratPick] = useState(DEFAULT_KARAT);
  const [chain, setChain] = useState(p.chainLengths[0] ?? "");
  const [whole, setWhole] = useState<string | null>(null);
  const [half, setHalf] = useState(false);
  const [guide, setGuide] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const sold = p.isSold;

  const metalLabelT = (m: MetalKey, k?: number | null) => (k ? t("{n}k {metal}", { n: k, metal: t(METAL_LABEL[m]) }) : t(METAL_LABEL[m]));
  const size = whole ? (half && whole !== "9" ? `${whole}.5` : whole) : null;
  const karat = activeKarat(p, metal, karatPick);
  const price = unitPrice(p, metal, karat ?? undefined);

  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [{ key: "front", label: t("Front"), src: p.metalImages?.[metal] ?? p.images[0], zone: p.stone }];
    const det = p.detail?.[metal] ?? p.detail?.[p.metal] ?? (p.detail ? Object.values(p.detail)[0] : undefined);
    // on-hand video straight after the main photo (labelled for what it is: a video of the ring on a hand)
    if (p.video) list.push({ key: "video", label: t("On-Hand Video"), src: p.video.poster, video: p.video.src });
    // every view follows the selected metal: angle photos swap to their recoloured twin, and any photo
    // that has no twin (it shows a hand or model) is left out rather than shown in the wrong finish
    const swapped = !!p.metalImages && metal !== p.metal;
    let shown = 0;
    p.angles.forEach((src, n) => {
      const s2 = swapped ? p.angleVariants?.[metal]?.[n] ?? null : src;
      if (s2) list.push({ key: `a${n}`, label: t("Angle {n}", { n: ++shown }), src: s2 });
    });
    // the macro stone close-up always comes last
    if (det) list.push({ key: "detail", label: t("Detail"), src: det, zone: { x: 0.5, y: 0.5, r: 0.42 }, grade: false });
    return list;
  }, [p, metal, t]);

  useEffect(() => {
    closeBtn.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !useStore.getState().viewing.open && closeDetail();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [closeDetail]);

  const add = () => {
    if (sold || (p.isRing && !size)) return;
    addItem(p, { size: p.isRing ? size : null, metal, karat: karat ?? undefined, chain: p.isPendant ? chain : undefined });
    closeDetail();
  };

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Gallery slides={slides} />

      <div className="px-5 pb-20 pt-6 lg:px-16 lg:pb-28 lg:pt-28">
        <div className="mx-auto max-w-[34rem]">
          <h2 className="font-display text-[clamp(2rem,3.4vw,2.9rem)] font-normal leading-[1.08]">{productName(p, lang)}</h2>
          <p className="mt-3 text-[12px] uppercase tracking-wider text-muted-gray">{subtitleFor(cardSubtitle(p), t)}</p>

          <div className="mt-7 flex items-baseline gap-4">
            <p className="font-display text-[1.9rem] font-normal tabular-nums">{!sold && wasPrice(p, price) && <s className="mr-3 text-[1.3rem] text-muted-gray">{formatMoney(wasPrice(p, price)!, currency)}</s>}{formatMoney(price, currency)}</p>
            {currency !== "VND" && <p className="text-xs tabular-nums text-muted-gray">{formatMoney(price, "VND")}</p>}
          </div>
          <p className="mt-1 text-[0.7rem] text-muted-gray">{t("Free insured delivery within Ho Chi Minh City.")}</p>
          <p className="mt-5">
            <span className="eyebrow inline-block rounded-full border border-charcoal/15 px-4 py-2 text-[0.58rem] text-obsidian/75">{t(warrantyFor(p))}</span>
          </p>
          {p.cert && (
            <p className="mt-4 text-[0.8rem] text-obsidian/80">
              {t("{lab} report {number}", { lab: p.cert.lab, number: compactNumber(p.cert.lab, p.cert.number) })}
              {p.cert.verifyUrl && <> <span className="text-muted-gray">&middot;</span> <a href={p.cert.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-champagne-deep underline underline-offset-[5px] transition-colors hover:text-obsidian">{t("Verify on {lab}", { lab: p.cert.lab })}</a></>}
            </p>
          )}
          {p.certificateUrl && (
            <p className="mt-4 text-[0.8rem]"><a href={p.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-champagne-deep underline underline-offset-[5px] transition-colors hover:text-obsidian">{t("View the GIA / IGI certificate (PDF)")}</a></p>
          )}

          {p.readyToShip ? (
            <div className="mt-9 border-y border-charcoal/10 py-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-[0.6rem] text-muted-gray">{t("Metal")}</span>
                <span className="eyebrow text-[0.6rem]">{metalLabelT(p.metal, parseInt(p.karat, 10) || null)}</span>
              </div>
              <p className="mt-4 flex items-start gap-3 text-[0.8rem] leading-snug">
                <span aria-hidden className="mt-[0.4rem] block h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                {sold ? (
                  <span>{t("Sold")} <span className="text-muted-gray">/</span> <span className="text-obsidian/70">{t("Atelier archive")}</span></span>
                ) : (
                <span>
                  {t("In Stock at Thảo Điền Showroom")} <span className="text-muted-gray">•</span> <span className="text-obsidian/70">{t("Available for Immediate Delivery")}</span>
                </span>
                )}
              </p>
            </div>
          ) : (
            <div className="mt-9">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow text-[0.6rem] text-muted-gray">{t("Metal")}</span>
                <span className="eyebrow text-[0.6rem]">{t(options.length > 1 || p.metalImages ? METAL_LABEL[metal] : METAL_LABEL[p.metal])}</span>
              </div>
              {options.length > 1 && (
                <div className="flex items-center gap-4" role="radiogroup" aria-label={t("Metal")}>
                  {options.map((m) => (
                    <button key={m} role="radio" aria-checked={metal === m} aria-label={t(METAL_LABEL[m])} title={t(METAL_LABEL[m])} onClick={() => setMetal(m)} className="flex h-8 w-8 items-center justify-center">
                      <span
                        className={`block h-[18px] w-[18px] rounded-full transition-[box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${metal === m ? "shadow-[0_0_0_4px_#F4F0EB,0_0_0_5px_rgba(13,14,14,0.7)]" : "shadow-[0_0_0_1px_rgba(31,32,32,0.2)]"}`}
                        style={{ background: METAL_DOT[m] }}
                      />
                    </button>
                  ))}
                </div>
              )}
              {karat !== null && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow text-[0.6rem] text-muted-gray">{t("Karat")}</span>
                    <span className="eyebrow text-[0.6rem]">{t("{n}k gold", { n: karat })}</span>
                  </div>
                  <div className="flex gap-2" role="radiogroup" aria-label={t("Karat")}>
                    {p.karats.map((k) => (
                      <button
                        key={k}
                        role="radio"
                        aria-checked={karat === k}
                        onClick={() => setKaratPick(k)}
                        className={`h-11 min-w-16 border px-4 text-sm tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${karat === k ? "border-obsidian text-obsidian" : "border-charcoal/12 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian"}`}
                      >
                        {k}k
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {p.isPendant && (
            <section aria-label={t("Chain and dimensions")} className="mt-9">
              {p.chainLengths.length > 0 && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow text-[0.6rem] text-muted-gray">{t("Chain length")}</span>
                    <span className="eyebrow text-[0.6rem]">{chainLabel(chain)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Chain length")}>
                    {p.chainLengths.map((len) => (
                      <button
                        key={len}
                        role="radio"
                        aria-checked={chain === len}
                        onClick={() => setChain(len)}
                        className={`h-11 border px-4 text-sm tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${chain === len ? "border-obsidian text-obsidian" : "border-charcoal/12 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian"}`}
                      >
                        {chainLabel(len)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[0.72rem] text-muted-gray">{t("One chain, adjustable between the two lengths.")}</p>
                </>
              )}
              {p.pendantSize && (
                <dl className="mt-7 flex items-baseline justify-between gap-4 border-t border-charcoal/10 pt-6">
                  <div>
                    <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{t("Pendant dimensions")}</dt>
                    <dd className="text-[0.7rem] text-muted-gray">{t("Centre stone")}</dd>
                  </div>
                  <dd className="font-display text-[1.25rem] leading-tight">{p.pendantSize.replace(/s*xs*/gi, " × ")}</dd>
                </dl>
              )}
            </section>
          )}

          {productDescription(p, lang) && <p className="mt-9 text-[0.88rem] leading-[1.75] text-obsidian/65">{productDescription(p, lang)}</p>}

          <div className="mt-10">{p.isDiamond ? <FourCs p={p} /> : <StoneDetails p={p} />}</div>

          {p.isRing && (
            <section aria-label={t("Ring size")} className="mt-10 border-t border-charcoal/10 pt-7">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="eyebrow text-[0.62rem]">{t("Ring size (US)")}</h3>
                <button onClick={() => setGuide((g) => !g)} aria-expanded={guide} className="eyebrow -my-3.5 py-3.5 text-[0.58rem] text-champagne-deep underline underline-offset-[6px] transition-colors hover:text-obsidian">{t("Ring Size Guide")}</button>
              </div>
              <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label={t("Ring size")}>
                {WHOLE.map((w) => {
                  const on = whole === w;
                  return (
                    <button key={w} role="radio" aria-checked={on} onClick={() => setWhole(w)} className={`h-12 border text-sm tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-obsidian text-obsidian" : "border-charcoal/12 text-obsidian/60 hover:border-obsidian/50 hover:text-obsidian"}`}>
                      {on && half && w !== "9" ? `${w}½` : w}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setHalf((h) => !h)} disabled={whole === "9"} aria-pressed={half} className={`eyebrow py-3.5 text-[0.56rem] transition-colors disabled:opacity-30 ${half ? "text-champagne-deep" : "text-muted-gray hover:text-obsidian"}`}>{t("+ half size")}</button>

              <div className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${guide ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`} aria-hidden={!guide}>
                <div className="overflow-hidden">
                  <p className="mb-4 text-[0.78rem] leading-relaxed text-obsidian/60">{t("Measure the inside diameter of a ring that already fits the same finger, or wrap a strip of paper around the base of the finger and mark where it overlaps. Match the closest figure below.")}</p>
                  <table className="w-full text-left text-[0.76rem] tabular-nums">
                    <thead>
                      <tr className="eyebrow border-b border-charcoal/15 text-[0.55rem] text-muted-gray">
                        <th className="py-2 font-medium">{t("US size")}</th><th className="py-2 font-medium">{t("Diameter (mm)")}</th><th className="py-2 font-medium">{t("Circumference (mm)")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_CHART.map(([s, d, c]) => (
                        <tr key={s} className="border-b border-charcoal/8">
                          <td className="py-2">{s}</td><td className="py-2 text-obsidian/70">{d}</td><td className="py-2 text-obsidian/70">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <div className="mt-10 space-y-3">
            <button
              onClick={add}
              disabled={sold || (p.isRing && !size)}
              className="eyebrow w-full bg-obsidian py-5 text-alabaster transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-champagne hover:text-obsidian active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-obsidian disabled:hover:text-alabaster"
            >
              {sold ? t("Sold / Atelier archive") : p.isRing && !size ? t("Select a size to add") : t("Add to Bag — {price}", { price: formatMoney(price, currency) })}
            </button>
            <button onClick={() => openViewing(p)} className="eyebrow w-full border border-charcoal/25 py-5 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne hover:text-champagne-deep">
              {t("Book Private Viewing in Thao Dien")}
            </button>
          </div>

          <ul className="mt-9 space-y-2 text-[0.72rem] text-muted-gray">
            <li>{t("Free insured delivery within Ho Chi Minh City")}</li>
            <li>{t(siteConfig.origin.short)}</li>
          </ul>
        </div>
      </div>

      <button ref={closeBtn} onClick={closeDetail} aria-label={t("Close product view")} className="fixed right-5 top-5 z-10 flex items-center gap-3 bg-alabaster/80 px-4 py-3 backdrop-blur-md transition-colors duration-500 hover:text-champagne-deep lg:right-8 lg:top-7">
        <span className="eyebrow text-[0.6rem]">{t("Close")}</span>
        <span className="relative block h-3 w-3" aria-hidden>
          <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
          <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
        </span>
      </button>
    </div>
  );
}

export default function ProductModal() {
  const detail = useStore((s) => s.detail);
  // the open piece follows live edits (price, metals, karats, sold) made in Supabase
  const fresh = useStore((s) => (detail ? s.live[detail.product.id] : undefined)) ?? undefined; // null (archived) keeps the copy that is open
  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          key={detail.product.id}
          role="dialog"
          aria-modal="true"
          aria-label={detail.product.title}
          data-lenis-prevent
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-alabaster"
        >
          <Detail p={fresh ?? detail.product} initialMetal={detail.metal} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
