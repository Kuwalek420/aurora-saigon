import type { Product } from "./types";

/** Counts of what is actually in each rings category, so the mega menu only links to non-empty results. */
export interface FacetCounts {
  shape: Record<string, number>;
  setting: Record<string, number>;
  band: Record<string, number>;
  metal: Record<string, number>;
  gemstone: Record<string, number>;
}
export type Facets = Record<"Engagement Rings" | "Wedding Rings", FacetCounts>;

const METAL_NAME: Record<string, string> = { yellow: "Yellow Gold", white: "White Gold", rose: "Rose Gold", platinum: "Platinum", silver: "925 Silver" };
function offeredMetals(p: Product): string[] {
  return p.metals.map((m) => METAL_NAME[m]);
}

export function getFacets(products: Product[]): Facets {
  const empty = (): FacetCounts => ({ shape: {}, setting: {}, band: {}, metal: {}, gemstone: {} });
  const out: Facets = { "Engagement Rings": empty(), "Wedding Rings": empty() };
  const bump = (m: Record<string, number>, k: string) => { if (k) m[k] = (m[k] ?? 0) + 1; };
  for (const p of products) {
    const f = out[p.category as keyof Facets];
    if (!f) continue;
    bump(f.shape, p.shape);
    p.setting.forEach((x) => bump(f.setting, x));
    bump(f.band, p.band);
    offeredMetals(p).forEach((x) => bump(f.metal, x));
    bump(f.gemstone, p.gemstone);
  }
  return out;
}
