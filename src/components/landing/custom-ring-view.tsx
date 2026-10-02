"use client";

import { useMemo, useState } from "react";
import { siteConfig } from "@/data/site-config";
import { CUSTOM_RING, RING_MAKING, type Bi } from "@/data/landing-content";
import type { LabDiamondPrices } from "@/lib/diamond-data";
import { stoneFrom } from "@/lib/diamond-data";
import { formatMoney } from "@/lib/store";
import { useStore } from "@/lib/store";
import { useBi, useT } from "@/lib/use-t";
import InquiryForm from "../inquiry-form";
import LoopVideo from "../loop-video";
import { BandIcon, SettingIcon, ShapeIcon } from "../icons";

const SETTINGS = ["Solitaire", "Halo", "Trilogy", "Pavé"] as const;
const SHAPES = ["Round", "Oval", "Emerald", "Radiant"] as const;
const STEPS = ["Setting", "Stone", "Enquiry"] as const;
const fillPrices = (s: string, from: string, to: string) => s.replace("{from}", from).replace("{to}", to);

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex flex-col items-center gap-3 border px-3 py-6 text-center transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-obsidian text-obsidian" : "border-charcoal/15 text-obsidian/70 hover:border-obsidian/50 hover:text-obsidian"}`}
    >
      {children}
    </button>
  );
}

/** Three steps: setting, stone, enquiry. The stone step shows what the live inventory really starts at for that shape and size. */
function Builder({ lab }: { lab: LabDiamondPrices }) {
  const t = useT();
  const currency = useStore((s) => s.currency);
  const [step, setStep] = useState(0);
  const [setting, setSetting] = useState<(typeof SETTINGS)[number] | null>(null);
  const [shape, setShape] = useState<(typeof SHAPES)[number] | null>(null);
  const [band, setBand] = useState<number | null>(null);

  const bandLabel = (i: number) => `${lab.bands[i][0].toFixed(2)} – ${lab.bands[i][1].toFixed(2)} ct`;
  const stone = useMemo(() => (shape !== null && band !== null ? stoneFrom(lab, shape, band) : null), [lab, shape, band]);
  const done = [setting !== null, shape !== null && band !== null, false];
  const [g0, g1] = RING_MAKING.gold18;

  const context = [
    "Custom ring builder (create-your-own-engagement-ring)",
    `Setting: ${setting ?? "not chosen"}`,
    `Stone: ${shape ?? "not chosen"}${band !== null ? `, ${bandLabel(band)}` : ""}`,
    stone ? `Lab diamond, D-F colour, VS or better: lowest in stock ${stone.p.toLocaleString("en")} VND (${stone.n} stones), snapshot ${lab.scrapedAt.slice(0, 10)}` : "",
    `Ring making (18k gold), as published: ${g0.toLocaleString("en")} - ${g1.toLocaleString("en")} VND`,
  ].filter(Boolean).join("\n");

  return (
    <section aria-labelledby="builder-heading" className="mt-28 md:mt-40">
      <h2 id="builder-heading" className="font-display text-[clamp(2rem,3.6vw,3.2rem)] font-light leading-[1.08]">{t("Design your ring in three steps")}</h2>
      <p className="mt-5 max-w-xl text-[0.95rem] leading-[1.8] text-obsidian/70">{t("Choose a setting and a stone, then send us your idea. We reply with a complimentary quote.")}</p>

      <ol className="mt-12 flex gap-8 border-b border-charcoal/10" aria-label={t("Steps")}>
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => (i === 0 || done[i - 1]) && setStep(i)}
              aria-current={step === i ? "step" : undefined}
              disabled={i > 0 && !done[i - 1]}
              className={`eyebrow relative pb-4 text-[0.62rem] transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-40 ${step === i ? "text-obsidian" : "text-muted-gray hover:text-obsidian"}`}
            >
              {i + 1}. {t(s)}
              {step === i && <span className="absolute inset-x-0 -bottom-px h-px bg-obsidian" />}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-12 min-h-[22rem]">
        {step === 0 && (
          <div>
            <h3 className="font-display text-2xl font-light">{t("Select a setting")}</h3>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {SETTINGS.map((s) => (
                <Choice key={s} on={setting === s} onClick={() => setSetting(s)}>
                  {s === "Pavé" ? <BandIcon name="Pavé" className="h-7 w-11" /> : <SettingIcon name={s} className="h-7 w-11" />}
                  <span className="text-[0.9rem]">{t(s)}</span>
                </Choice>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="font-display text-2xl font-light">{t("Select a diamond shape and size")}</h3>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {SHAPES.map((s) => (
                <Choice key={s} on={shape === s} onClick={() => setShape(s)}>
                  <ShapeIcon name={s} className="h-8 w-8" />
                  <span className="text-[0.9rem]">{t(s)}</span>
                </Choice>
              ))}
            </div>
            <p className="eyebrow mb-3 mt-10 text-[0.58rem] text-muted-gray">{t("Carat weight")}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Carat weight")}>
              {lab.bands.map((_, i) => (
                <button key={i} type="button" role="radio" aria-checked={band === i} onClick={() => setBand(i)} className={`h-11 border px-4 text-[0.85rem] tabular-nums transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${band === i ? "border-obsidian text-obsidian" : "border-charcoal/15 text-obsidian/65 hover:border-obsidian/50 hover:text-obsidian"}`}>
                  {bandLabel(i)}
                </button>
              ))}
            </div>
            {shape && band !== null && (
              <p aria-live="polite" className="mt-8 max-w-lg text-[0.9rem] leading-[1.7] text-obsidian/75">
                {stone
                  ? t("In our current lab diamond stock, {shape} stones of this size (D–F colour, VS or better) start from {price}. {n} in stock.", { shape: t(shape), price: formatMoney(stone.p, currency), n: stone.n })
                  : t("We have no {shape} lab diamond of this size in stock right now. Tell us what you want and we will source one.", { shape: t(shape) })}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-16 md:grid-cols-[1fr_1.1fr]">
            <div>
              <h3 className="font-display text-2xl font-light">{t("Your idea")}</h3>
              <dl className="mt-8 space-y-4 text-[0.92rem]">
                <div className="flex justify-between gap-6 border-b border-charcoal/10 pb-3"><dt className="text-muted-gray">{t("Setting")}</dt><dd>{setting ? t(setting) : "—"}</dd></div>
                <div className="flex justify-between gap-6 border-b border-charcoal/10 pb-3"><dt className="text-muted-gray">{t("Stone")}</dt><dd className="text-right">{shape && band !== null ? `${t(shape)}, ${bandLabel(band)}` : "—"}</dd></div>
                <div className="flex justify-between gap-6 border-b border-charcoal/10 pb-3"><dt className="text-muted-gray">{t("Ring making, 18k gold")}</dt><dd className="text-right tabular-nums">{formatMoney(g0, currency)} – {formatMoney(g1, currency)}</dd></div>
                {stone && <div className="flex justify-between gap-6 border-b border-charcoal/10 pb-3"><dt className="text-muted-gray">{t("Lab diamond from")}</dt><dd className="tabular-nums">{formatMoney(stone.p, currency)}</dd></div>}
              </dl>
              <p className="mt-6 max-w-sm text-[0.78rem] leading-relaxed text-muted-gray">{t("These are published starting figures, not a quote. Design and weight change the ring-making price, and the stone is yours to choose.")}</p>
            </div>
            <div>
              <h3 className="font-display text-2xl font-light">{t("Send us your idea")}</h3>
              <div className="mt-8"><InquiryForm context={context} submitLabel={t("Request my quote")} /></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-6">
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="text-[0.85rem] text-muted-gray underline underline-offset-[5px] hover:text-obsidian">{t("Back")}</button>}
        {step < 2 && (
          <button type="button" onClick={() => setStep(step + 1)} disabled={!done[step]} className="eyebrow border border-obsidian px-10 py-4 text-[0.62rem] transition-colors duration-500 hover:bg-obsidian hover:text-alabaster disabled:cursor-not-allowed disabled:border-charcoal/20 disabled:text-obsidian/40 disabled:hover:bg-transparent disabled:hover:text-obsidian/40">
            {t("Continue")}
          </button>
        )}
      </div>
    </section>
  );
}

export default function CustomRingView({ lab }: { lab: LabDiamondPrices }) {
  const bi = useBi();
  const t = useT();
  const currency = useStore((s) => s.currency);
  const fmt = (n: number) => formatMoney(n, currency);
  const para = (b: Bi, prices?: readonly [number, number]) => (prices ? fillPrices(bi(b), fmt(prices[0]), fmt(prices[1])) : bi(b));
  const C = CUSTOM_RING;
  const H = "font-display text-[clamp(1.9rem,3.2vw,2.8rem)] font-light leading-[1.1]";
  const P = "mt-6 max-w-[34rem] text-[0.98rem] leading-[1.85] text-obsidian/72";

  return (
    <main className="bg-alabaster pt-36 md:pt-44">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <h1 className="font-display max-w-[20ch] text-[clamp(2.8rem,6.2vw,5.8rem)] font-light leading-[1]">{bi(C.title)}</h1>
        <p className="mt-10 max-w-2xl text-[1.02rem] leading-[1.85] text-obsidian/72">{bi(C.intro)}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/content/custom-ring/emerald-cut.webp" alt={t("An emerald-cut engagement ring made at the Aurora Saigon atelier")} className="mt-16 aspect-[3/2] w-full object-cover md:mt-24 md:aspect-[21/9]" />

        <Builder lab={lab} />

        <div className="mt-32 grid gap-x-24 gap-y-28 md:mt-44 md:grid-cols-2">
          <section aria-labelledby="gem-heading" className="md:self-center">
            <h2 id="gem-heading" className={H}>{bi(C.gemstone.heading)}</h2>
            {C.gemstone.body.map((b, i) => <p key={i} className={P}>{bi(b)}</p>)}
          </section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/content/custom-ring/blue-sapphire.webp" alt={t("A blue sapphire engagement ring")} loading="lazy" className="aspect-[3/2] w-full object-cover" />

          <section aria-labelledby="cost-heading" className="md:order-4 md:self-center">
            <h2 id="cost-heading" className={H}>{bi(C.cost.heading)}</h2>
            {C.cost.body.map((b, i) => <p key={i} className={P}>{para(b, i === 1 ? RING_MAKING.gold18 : i === 2 ? RING_MAKING.platinum : undefined)}</p>)}
            {currency !== "VND" && <p className="mt-4 max-w-[34rem] text-[0.75rem] text-muted-gray">{t("Converted from VND at an indicative rate; the ring is priced in VND.")}</p>}
          </section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/content/custom-ring/custom-design.webp" alt={t("Custom-designed engagement rings by Aurora Saigon")} loading="lazy" className="aspect-[3/2] w-full object-cover md:order-3" />
        </div>

        <div className="mt-32 grid items-center gap-16 md:mt-44 md:grid-cols-[1fr_20rem] md:gap-28">
          <section aria-labelledby="design-heading">
            <h2 id="design-heading" className={H}>{bi(C.design.heading)}</h2>
            {C.design.body.map((b, i) => <p key={i} className={P}>{bi(b)}</p>)}
          </section>
          <figure className="mx-auto w-full max-w-[20rem]">
            <LoopVideo src="/assets/custom-ring/3d-creation.mp4" poster="/assets/custom-ring/3d-creation-poster.jpg" label={t("A ring taking shape: the 3D model that is shown to the client before casting")} className="aspect-[9/16] object-cover" />
          </figure>
        </div>

        <div className="mt-32 grid gap-x-24 gap-y-16 md:mt-44 md:grid-cols-2">
          <section aria-labelledby="time-heading">
            <h2 id="time-heading" className={H}>{bi(C.time.heading)}</h2>
            {C.time.body.map((b, i) => <p key={i} className={P}>{bi(b)}</p>)}
          </section>
          <section aria-labelledby="start-heading">
            <h2 id="start-heading" className={H}>{bi(C.start.heading)}</h2>
            {C.start.body.map((b, i) => <p key={i} className={P}>{bi(b)}</p>)}
            <p className="mt-8 text-[0.95rem] leading-[1.9]">
              <a href={`mailto:${siteConfig.brand.email}`} className="transition-colors duration-500 hover:text-champagne-deep">{siteConfig.brand.email}</a>
              <span aria-hidden className="mx-3 text-obsidian/30">|</span>
              <a href={`tel:${siteConfig.brand.phone.replace(/\s/g, "")}`} className="transition-colors duration-500 hover:text-champagne-deep">{siteConfig.brand.phone}</a>
            </p>
          </section>
        </div>
      </div>
      <div className="h-32 md:h-44" />
    </main>
  );
}
