// RawProduct (src/data/products.json) -> ProductRow (the Supabase `products` row).
// One implementation for both the migration script (scripts/migrate-to-supabase.js) and the storefront's
// safety-net fallback, so a piece looks identical whichever source served it. Type imports only: Node can run this file directly.
import type { ProductRow, RawImage, RawProduct } from "./types";

const IMG = /\.(jpe?g|png|webp)$/i;
const firstPhoto = (p: RawProduct): RawImage | undefined => p.images.find((i) => i.src && IMG.test(i.src));
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A piece needs a real first photograph; AS-039's only image is a "White Topaz" text card, so it stays out. */
export function isVisible(p: RawProduct): boolean {
  const f = firstPhoto(p);
  return !!f && !/EN\.(webp|jpe?g|png)$/i.test(f.originalUrl);
}

export function toRow(p: RawProduct): ProductRow {
  const f = firstPhoto(p)!;
  const photos = f.photoVariants && Object.keys(f.photoVariants).length > 1 ? f.photoVariants : null;
  const g = f.gallery;
  const byMetal = p.price.byMetal ?? {};
  const listed = p.price.sale ?? p.price.regular;
  // configurable (photographed, not ready-to-ship) pieces are priced per metal from the 18k figure; fixed stock and the rest show their listed price
  const base = photos && !p.isReadyToShip && byMetal["18k"] ? byMetal["18k"] : listed;
  const metal_pricing: Record<string, number> = {};
  for (const [k, v] of Object.entries(byMetal)) if (v && v > 0) metal_pricing[k] = v / base;

  // gallery order: main photo, other angles, metal renditions, the video cover, and the macro stone close-ups strictly last
  const urls = [f.src, ...(g?.angles ?? []), ...Object.values(g?.angleVariants ?? {}).flat(), ...Object.values(f.photoVariants ?? {}), g?.videoPoster, ...Object.values(g?.detail ?? {})].filter((s): s is string => !!s && IMG.test(s));
  const a = p.attributes;
  return {
    id: p.id,
    slug: `${slugify(p.title)}-${p.id.toLowerCase()}`,
    name: p.title,
    category: p.category,
    price_vnd: Math.round(base),
    is_ready_to_ship: !!p.isReadyToShip,
    is_sold: false,
    description: p.description.replace(/\s*Read more\s*$/i, ""),
    images: [...new Set(urls)],
    available_metals: p.availableMetals ?? [],
    available_karats: p.availableKarats ?? [],
    metal_pricing,
    gallery: { photos, detail: g?.detail ?? null, angles: g?.angles ?? [], angleVariants: g?.angleVariants ?? null, stone: f.stoneZone ?? null, video_url: g?.videoUrl ?? null, video_poster: g?.videoPoster ?? null },
    attributes: {
      metal: a.metal, gemstone: a.gemstone, shape: a.shape ?? null, carat: a.carat ?? null,
      stoneSize: a.stoneSize ?? null, colour: a.colour ?? null, clarity: a.clarity ?? null,
    },
    product_type: p.productType ?? null,
    chain_lengths: p.productType === "pendant" ? p.chainLengths ?? [] : [],
    pendant_size: p.productType === "pendant" ? p.pendantSize ?? null : null,
    name_vi: null,
    description_vi: null,
    is_archived: false,
    original_price_vnd: null,
    discount_percent: null,
    certificate_url: null,
    updated_at: "1970-01-01T00:00:00.000Z",
  };
}
