"use client";

import Link from "next/link";
import { METAL_LABEL } from "@/lib/store";
import { siteConfig } from "@/data/site-config";
import { useT } from "@/lib/use-t";
import type { Facets } from "@/lib/products";
import type { Filters, MetalKey } from "@/lib/types";
import { MetalDot, SettingIcon, ShapeIcon } from "./icons";

const SHAPES = ["Pear", "Oval", "Round", "Emerald", "Cushion", "Marquise"];
const SETTINGS = ["Solitaire", "Trilogy", "Halo", "Toi et Moi", "Bezel"];
const METALS: [MetalKey, string][] = [["platinum", "Platinum"], ["yellow", "Yellow Gold"], ["rose", "Rose Gold"], ["white", "White Gold"]];

/** The showroom card at the right of every mega menu. */
export function ShowroomCard({ onBook }: { onBook: () => void }) {
  const t = useT();
  return (
        <figure className="col-span-4">
          <div className="relative aspect-[5/3] overflow-hidden bg-charcoal/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/showroom/showroom-wall.jpg" alt={t("The Aurora Saigon showroom in Thao Dien")} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
          <figcaption className="mt-5 flex flex-col items-start gap-4">
            <p className="font-display text-[1.6rem] font-normal leading-[1.1]">{siteConfig.showroom}</p>
            <button onClick={onBook} className="group flex shrink-0 items-center gap-3 text-[0.82rem] text-obsidian/75 transition-colors duration-500 hover:text-obsidian">
              {t("Book a showroom viewing")}
              <span className="block h-px w-6 bg-current transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-10" />
            </button>
          </figcaption>
        </figure>
  );
}

const link = "block w-full py-2 text-left text-[0.92rem] text-obsidian/75 transition-colors duration-500 hover:text-obsidian";
const row = "flex w-full items-center gap-3 py-2 text-left text-[0.92rem] text-obsidian/75 transition-colors duration-500 hover:text-obsidian";
const head = "eyebrow mb-5 text-obsidian";

/**
 * The Engagement Rings panel: Build a ring (filters and the three bespoke pages), Shape, Style and Metal.
 * Shape, Style and Metal only list what the catalogue actually has, so no link leads to an empty grid.
 */
export default function EngagementMegaMenu({ facets, go, close, onBook }: { facets: Facets; go: (patch: Partial<Filters>) => void; close: () => void; onBook: () => void }) {
  const t = useT();
  const eng = facets["Engagement Rings"];
  const cat = "Engagement Rings";

  return (
    <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-12 px-10 pb-14 pt-12">
      <div className="col-span-8 grid grid-cols-4 gap-8">
        <div>
          <h3 className={head}>{t("Build a ring")}</h3>
          {eng.gemstone["Lab-Grown Diamond"] > 0 && <button className={link} onClick={() => go({ category: cat, gemstone: "Lab-Grown Diamond" })}>{t("Lab Diamond Engagement Rings")}</button>}
          {eng.gemstone["Moissanite"] > 0 && <button className={link} onClick={() => go({ category: cat, gemstone: "Moissanite" })}>{t("Moissanite Engagement Rings")}</button>}
          <Link href="/create-your-own-engagement-ring" className={link} onClick={close}>{t("Custom Engagement Ring")}</Link>
          <Link href="/shop-lab-diamonds" className={link} onClick={close}>{t("Loose Lab Diamond Stone")}</Link>
          <Link href="/fancy-coloured-lab-diamonds" className={link} onClick={close}>{t("Coloured Lab Grown Diamonds")}</Link>
        </div>
        <div>
          <h3 className={head}>{t("Shape")}</h3>
          {SHAPES.filter((s) => eng.shape[s] > 0).map((s) => (
            <button key={s} className={row} onClick={() => go({ category: cat, shape: s })}>
              <ShapeIcon name={s} className="h-5 w-5 shrink-0" />
              {t(s)}
            </button>
          ))}
        </div>
        <div>
          <h3 className={head}>{t("Style")}</h3>
          {SETTINGS.filter((s) => eng.setting[s] > 0).map((s) => (
            <button key={s} className={row} onClick={() => go({ category: cat, setting: s })}>
              <SettingIcon name={s} className="h-6 w-9 shrink-0" />
              {t(s)}
            </button>
          ))}
        </div>
        <div>
          <h3 className={head}>{t("Metal")}</h3>
          {METALS.filter(([, l]) => eng.metal[l] > 0).map(([m, l]) => (
            <button key={m} className={row} onClick={() => go({ category: cat, metal: METAL_LABEL[m] })}>
              <MetalDot metal={m} />
              {t(l)}
            </button>
          ))}
        </div>
      </div>

      <ShowroomCard onBook={onBook} />
    </div>
  );
}
