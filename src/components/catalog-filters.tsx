"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney, METAL_LABEL, PRICE_CEILING, useStore } from "@/lib/store";
import type { Filters, MetalKey, Product } from "@/lib/types";
import { useT } from "@/lib/use-t";
import Dropdown from "./dropdown";
import { BandIcon, Chevron, MetalDot, ResetIcon, SETTING_NAMES, SettingIcon, SHAPE_NAMES, ShapeIcon } from "./icons";

type Group = "shape" | "metal" | "setting" | "band" | "more" | "gem" | "style";

/** Pendant Gem dropdown, in the order the live site lists it. Only gems that are in stock are offered. */
const PENDANT_GEMS = ["Ruby", "Pink Topaz", "Citrine", "Garnet", "Emerald", "Aquamarine", "White Topaz", "Lapis Lazuli", "Green Agate", "Moissanite", "Blue Topaz", "Black Sapphire", "Peridot", "Amethyst", "Opal", "Moonstone", "Green Onyx", "Rose Quartz", "NA", "Black Onyx"];
/** Pendant Style dropdown = the cut. [label, value stored in the data] (the data spells it "Trillant"). */
const PENDANT_STYLES: [string, string][] = [["Round", "Round"], ["Oval", "Oval"], ["Trilliant", "Trillant"], ["Pear", "Pear"], ["Emerald", "Emerald"], ["Heart", "Heart"], ["Cushion", "Cushion"]];
const EASE = [0.22, 1, 0.36, 1] as const;
const METALS: MetalKey[] = ["yellow", "white", "rose", "platinum", "silver"];
const BANDS = ["Plain", "Pavé", "Twisted", "Cathedral"];

/** A slim, sticky, horizontal filter bar. Each group opens a small panel of fine line icons. */
export default function CatalogFilters({ products, count }: { products: Product[]; count: number }) {
  const { filters, setFilter, applyFilters, currency } = useStore();
  const t = useT();
  const [open, setOpen] = useState<Group | null>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !bar.current?.contains(e.target as Node) && setOpen(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const shapes = useMemo(() => SHAPE_NAMES.filter((s) => products.some((p) => p.shape === s)), [products]);
  const gemstones = useMemo(() => [...new Set(products.map((p) => p.gemstone))].filter((v) => v && v !== "None").sort(), [products]);

  // pendants: Gem and Style (the cut) replace the ring filters; each option shows how many pieces it has
  const pendantList = useMemo(() => products.filter((p) => p.isPendant), [products]);
  const gemOptions = useMemo(() => PENDANT_GEMS.map((g) => [g, pendantList.filter((p) => p.gemstone.toLowerCase().includes(g.toLowerCase())).length] as const).filter(([, n]) => n > 0), [pendantList]);
  const styleOptions = useMemo(() => PENDANT_STYLES.map(([label, v]) => [label, v, pendantList.filter((p) => p.shape === v).length] as const).filter(([, , n]) => n > 0), [pendantList]);

  const pick = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilter(k, filters[k] === v ? ("All" as Filters[K]) : v); // choosing the active option again clears it
    setOpen(null);
  };

  const priceOn = filters.price[1] < PRICE_CEILING;
  // setting style and band type only describe rings
  const pendants = filters.category === "Pendants & Necklaces";
  const moreOn = (!pendants && filters.gemstone !== "All") || priceOn;
  const active = (pendants ? (["shape"] as const) : (["shape", "metal", "setting", "band"] as const)).filter((k) => filters[k] !== "All").length + (pendants && filters.gemstone !== "All" ? 1 : 0) + (moreOn ? 1 : 0);
  const reset = () => { applyFilters({ category: filters.category, gender: filters.gender }); setOpen(null); };

  const GroupButton = ({ id, label, value, on }: { id: Group; label: string; value?: string; on: boolean }) => (
    <button
      onClick={() => setOpen((o) => (o === id ? null : id))}
      aria-expanded={open === id}
      aria-haspopup="true"
      className={`flex shrink-0 items-center gap-2.5 border px-4 py-2.5 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-champagne/40 text-obsidian" : "border-transparent text-obsidian/70 hover:border-charcoal/15 hover:text-obsidian"}`}
    >
      <span className="eyebrow whitespace-nowrap">{t(label)}</span>
      {on && value && <span className="whitespace-nowrap text-[0.78rem] normal-case tracking-normal text-champagne-deep">{t(value)}</span>}
      <Chevron className={`transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open === id ? "rotate-180" : ""}`} />
    </button>
  );

  const Panel = ({ id, children, wide = false }: { id: Group; children: React.ReactNode; wide?: boolean }) => (
    <AnimatePresence>
      {open === id && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: EASE }}
          data-lenis-prevent
          className={`z-40 border border-charcoal/10 bg-alabaster p-5 shadow-[0_28px_48px_-30px_rgba(13,14,14,0.28)] max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[70dvh] max-md:overflow-y-auto max-md:border-x-0 max-md:border-b-0 max-md:pb-10 md:absolute md:left-0 md:top-full md:mt-px ${wide ? "md:w-[22rem]" : "md:w-[19rem]"}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const tile = (on: boolean) => `flex flex-col items-center gap-2 border px-2 py-3 text-center transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-champagne/40 text-obsidian" : "border-transparent text-obsidian/70 hover:border-charcoal/15 hover:text-obsidian"}`;

  return (
    <div ref={bar} className="sticky top-16 z-30 -mx-5 border-y border-charcoal/10 bg-alabaster px-5 md:-mx-10 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <div className="hide-scroll flex items-center gap-1 py-2 max-md:overflow-x-auto">
          {pendants ? (
            <>
          <div className="md:relative">
            <GroupButton id="gem" label="Gem" value={filters.gemstone} on={filters.gemstone !== "All"} />
            <Panel id="gem">
              <div className="max-h-72 overflow-y-auto" data-lenis-prevent role="group" aria-label={t("Gem")}>
                {gemOptions.map(([g, n]) => (
                  <button key={g} onClick={() => pick("gemstone", g)} aria-pressed={filters.gemstone === g} className={`flex w-full items-center justify-between border px-3 py-2.5 text-left text-sm transition-colors duration-500 ${filters.gemstone === g ? "border-champagne/40 text-obsidian" : "border-transparent text-obsidian/75 hover:border-charcoal/15 hover:text-obsidian"}`}>
                    {t(g)}
                    <span className="text-[0.7rem] tabular-nums text-muted-gray">{n}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="md:relative">
            <GroupButton id="style" label="Style" value={PENDANT_STYLES.find(([, v]) => v === filters.shape)?.[0]} on={filters.shape !== "All"} />
            <Panel id="style">
              <div className="flex flex-col" role="group" aria-label={t("Style")}>
                {styleOptions.map(([label, v, n]) => (
                  <button key={v} onClick={() => pick("shape", v)} aria-pressed={filters.shape === v} className={`flex items-center gap-3 border px-3 py-2.5 text-left text-sm transition-colors duration-500 ${filters.shape === v ? "border-champagne/40 text-obsidian" : "border-transparent text-obsidian/75 hover:border-charcoal/15 hover:text-obsidian"}`}>
                    <ShapeIcon name={v} className="h-5 w-5" />
                    {t(label)}
                    <span className="ml-auto text-[0.7rem] tabular-nums text-muted-gray">{n}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
            </>
          ) : (
            <>
          <div className="md:relative">
            <GroupButton id="shape" label="Shape" value={filters.shape} on={filters.shape !== "All"} />
            <Panel id="shape" wide>
              <div className="grid grid-cols-4 gap-1" role="group" aria-label={t("Shape")}>
                {shapes.map((s) => (
                  <button key={s} onClick={() => pick("shape", s)} aria-pressed={filters.shape === s} className={tile(filters.shape === s)}>
                    <ShapeIcon name={s} />
                    <span className="text-[0.72rem]">{t(s)}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <div className="md:relative">
            <GroupButton id="metal" label="Metal type" value={filters.metal} on={filters.metal !== "All"} />
            <Panel id="metal">
              <div className="flex flex-col" role="group" aria-label={t("Metal type")}>
                {METALS.map((m) => (
                  <button key={m} onClick={() => pick("metal", METAL_LABEL[m])} aria-pressed={filters.metal === METAL_LABEL[m]} className={`flex items-center gap-3 border px-3 py-2.5 text-left text-sm transition-colors duration-500 ${filters.metal === METAL_LABEL[m] ? "border-champagne/40 text-obsidian" : "border-transparent text-obsidian/75 hover:border-charcoal/15 hover:text-obsidian"}`}>
                    <MetalDot metal={m} size={14} />
                    {t(METAL_LABEL[m])}
                  </button>
                ))}
              </div>
            </Panel>
          </div>

            </>
          )}

          {!pendants && (
            <div className="md:relative">
              <GroupButton id="setting" label="Setting style" value={filters.setting} on={filters.setting !== "All"} />
              <Panel id="setting">
                <div className="grid grid-cols-2 gap-1" role="group" aria-label={t("Setting style")}>
                  {SETTING_NAMES.map((s) => (
                    <button key={s} onClick={() => pick("setting", s)} aria-pressed={filters.setting === s} className={tile(filters.setting === s)}>
                      <SettingIcon name={s} className="h-7 w-10" />
                      <span className="text-[0.72rem]">{t(s)}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {!pendants && (
            <div className="md:relative">
              <GroupButton id="band" label="Band type" value={filters.band} on={filters.band !== "All"} />
              <Panel id="band">
                <div className="grid grid-cols-2 gap-1" role="group" aria-label={t("Band type")}>
                  {BANDS.map((b) => (
                    <button key={b} onClick={() => pick("band", b)} aria-pressed={filters.band === b} className={tile(filters.band === b)}>
                      <BandIcon name={b} className="h-6 w-10" />
                      <span className="text-[0.72rem]">{t(b)}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          <div className="md:relative">
            <GroupButton id="more" label="More" on={moreOn} value={moreOn ? "1" : undefined} />
            <Panel id="more" wide>
              <div className="space-y-7">
                {!pendants && <Dropdown label={t("Gemstone")} value={filters.gemstone} onChange={(v) => setFilter("gemstone", v)} options={gemstones} />}
                <div>
                  <div className="mb-3 flex justify-between">
                    <span className="eyebrow text-muted-gray">{t("Price up to")}</span>
                    <span className="text-sm tabular-nums">{formatMoney(filters.price[1], currency)}</span>
                  </div>
                  <input type="range" min={5_000_000} max={PRICE_CEILING} step={5_000_000} value={filters.price[1]} onChange={(e) => setFilter("price", [0, Number(e.target.value)])} aria-label={t("Maximum price")} />
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 text-[0.78rem] tracking-[0.04em] text-muted-gray" aria-live="polite">
          <span className="max-sm:hidden">{count} {t(count === 1 ? "piece" : "pieces")}</span>
          <AnimatePresence>
            {active > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={reset}
                aria-label={t(active > 1 ? "Reset {n} filters" : "Reset {n} filter", { n: active })}
                title={t("Reset filters")}
                className="flex items-center gap-1.5 py-2 pl-2 text-obsidian/70 transition-colors duration-500 hover:text-obsidian"
              >
                <ResetIcon />
                <span className="text-[0.72rem] tabular-nums">{active}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
