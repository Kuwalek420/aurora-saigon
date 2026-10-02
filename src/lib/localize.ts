import type { Lang } from "./i18n";
import type { Product } from "./types";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** The product name in the chosen language; falls back to English when no Vietnamese name exists. */
export const productName = (p: Pick<Product, "title" | "titleVi">, lang: Lang): string => (lang === "vi" && p.titleVi ? p.titleVi : p.title);

/** The product description in the chosen language; falls back to English when no Vietnamese text exists. */
export const productDescription = (p: Pick<Product, "description" | "descriptionVi">, lang: Lang): string => (lang === "vi" && p.descriptionVi ? p.descriptionVi : p.description);

/** "Oval Cut • Lab Diamond" -> each part translated ("Giác Cắt Oval • Kim Cương Nuôi Cấy"). */
export function subtitleFor(subtitle: string, t: T): string {
  return subtitle
    .split(" • ")
    .map((part) => {
      const cut = part.match(/^(.+) Cut$/);
      return cut ? t("{shape} Cut", { shape: t(cut[1]) }) : t(part);
    })
    .join(" • ");
}

/** "Oval Solitaire | 18K Rose Gold" -> each part translated word by word where there is no whole-phrase entry. */
export function pipeSubtitleFor(subtitle: string, t: T, lang: Lang): string {
  const [left, right] = subtitle.split(" | ");
  // Vietnamese puts the noun first: "Oval Ring" -> "Nhẫn Oval"
  const words = left ? left.split(" ") : [];
  const l = (lang === "vi" ? [...words].reverse() : words).map((w) => t(w)).join(" ");
  let r = "";
  if (right) {
    const m = right.match(/^(\d+)K (.+)$/);
    r = m ? t("{n}k {metal}", { n: m[1], metal: t(m[2]) }) : t(right);
  }
  return [l, r].filter(Boolean).join(" | ");
}
