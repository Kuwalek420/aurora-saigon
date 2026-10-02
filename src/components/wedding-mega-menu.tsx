"use client";

import Link from "next/link";
import { catalogHref } from "@/lib/catalog-url";
import { METAL_LABEL } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { WEDDING_STYLE_COUNTS } from "@/lib/wedding-gender";
import type { MetalKey } from "@/lib/types";
import { MetalDot } from "./icons";
import { ShowroomCard } from "./engagement-mega-menu";

const METALS: MetalKey[] = ["platinum", "yellow", "white", "rose"];
const link = "block w-full py-2 text-left text-[0.92rem] text-obsidian/75 transition-colors duration-500 hover:text-obsidian";
const row = "flex w-full items-center gap-3 py-2 text-left text-[0.92rem] text-obsidian/75 transition-colors duration-500 hover:text-obsidian";
const head = "eyebrow mb-5 text-obsidian";

/**
 * The Wedding Rings panel: Women (all / curved), Women's by metal, Men, Men's by metal. Every entry is a link to
 * /catalog?category=wedding-rings&gender=...[&metal=...][&style=...]. A style only appears when the live site has rings in it
 * (it has none tagged "eternity": its Eternity Rings page lists the ordinary women's range), so no link leads to an empty grid.
 */
export default function WeddingMegaMenu({ close, onBook }: { close: () => void; onBook: () => void }) {
  const t = useT();
  const w = "Wedding Rings";
  const metals = (gender: "Women" | "Men") => METALS.map((m) => (
    <Link key={m} href={catalogHref(w, gender, { metal: METAL_LABEL[m] })} onClick={close} className={row}>
      <MetalDot metal={m} />
      {t(METAL_LABEL[m])}
    </Link>
  ));
  return (
    <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-12 px-10 pb-14 pt-12">
      <div className="col-span-8 grid grid-cols-4 gap-8">
        <div>
          <h3 className={head}>{t("Women")}</h3>
          <Link href={catalogHref(w, "Women")} onClick={close} className={link}>{t("All Women's Wedding Ring")}</Link>
          {WEDDING_STYLE_COUNTS["Curved"] > 0 && <Link href={catalogHref(w, "Women", { style: "Curved" })} onClick={close} className={link}>{t("Curved Rings")}</Link>}
        </div>
        <div>
          <h3 className={head}>{t("Women's by metal")}</h3>
          {metals("Women")}
        </div>
        <div>
          <h3 className={head}>{t("Men")}</h3>
          <Link href={catalogHref(w, "Men")} onClick={close} className={link}>{t("All Men's Wedding Ring")}</Link>
        </div>
        <div>
          <h3 className={head}>{t("Men's by metal")}</h3>
          {metals("Men")}
        </div>
      </div>
      <ShowroomCard onBook={onBook} />
    </div>
  );
}
