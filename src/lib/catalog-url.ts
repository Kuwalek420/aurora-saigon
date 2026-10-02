/** `/catalog?category=<slug>[&gender=women|men]` deep links, and back. */
const SLUGS: [string, string][] = [
  ["ready-to-ship", "Ready to Ship"],
  ["all", "All"],
  ["engagement-rings", "Engagement Rings"],
  ["wedding-rings", "Wedding Rings"],
  ["pendants-and-necklaces", "Pendants & Necklaces"],
  ["fine-jewellery", "Fine Jewellery"],
];

export const categoryFromSlug = (slug: string | null) => SLUGS.find(([s]) => s === slug?.toLowerCase())?.[1] ?? null;
export const slugFromCategory = (category: string) => SLUGS.find(([, c]) => c === category)?.[0] ?? "all";
export const genderFromParam = (g: string | null) => (g?.toLowerCase() === "women" ? "Women" : g?.toLowerCase() === "men" ? "Men" : "All");

const METAL_SLUGS: [string, string][] = [["platinum", "Platinum"], ["yellow-gold", "Yellow Gold"], ["white-gold", "White Gold"], ["rose-gold", "Rose Gold"]];
/** `metal=yellow-gold` (or yellowgold) -> the filter value "Yellow Gold". */
export const metalFromParam = (m: string | null) => METAL_SLUGS.find(([s]) => s === m?.toLowerCase().replace(/^(yellow|white|rose)gold$/, "$1-gold"))?.[1] ?? "All";
export const slugFromMetal = (metal: string) => METAL_SLUGS.find(([, l]) => l === metal)?.[0];
/** `style=curved` -> "Curved". Only the styles the live site has are known to the filter. */
export const styleFromParam = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "All");

export function catalogQuery(category: string, gender = "All", extra: { metal?: string; style?: string } = {}) {
  const q = new URLSearchParams({ category: slugFromCategory(category) });
  if (category === "Wedding Rings") {
    if (gender !== "All") q.set("gender", gender.toLowerCase());
    const m = extra.metal && extra.metal !== "All" ? slugFromMetal(extra.metal) : undefined;
    if (m) q.set("metal", m);
    if (extra.style && extra.style !== "All") q.set("style", extra.style.toLowerCase());
  }
  return q.toString();
}
export const catalogHref = (category: string, gender = "All", extra: { metal?: string; style?: string } = {}) => `/catalog?${catalogQuery(category, gender, extra)}`;
