import type { MetalKey, Product, ProductRow } from "./types";
import { siteConfig } from "@/data/site-config";
import { verifyUrl } from "./certificate";

/** Columns the storefront reads. Everything a piece shows lives in one Supabase row. */
export const PRODUCT_COLUMNS = "id,slug,name,name_vi,description_vi,category,price_vnd,is_ready_to_ship,is_sold,description,images,available_metals,available_karats,metal_pricing,gallery,attributes,product_type,chain_lengths,pendant_size,is_archived,original_price_vnd,discount_percent,certificate_url,updated_at";

function metalKey(m: string): MetalKey {
  const s = m.toLowerCase();
  if (s.includes("platinum")) return "platinum";
  if (s.includes("white")) return "white";
  if (s.includes("rose")) return "rose";
  if (s.includes("silver")) return "silver";
  return "yellow";
}

const SETTINGS: [string, RegExp][] = [
  ["Solitaire", /solitaire/],
  ["Halo", /\bhalo\b/],
  ["Trilogy", /trilogy|three[- ]stone|3[- ]stone/],
  ["Toi et Moi", /toi[ -]?et[ -]?moi/],
  ["Bezel", /bezel/],
];
function bandOf(text: string): string {
  if (/twist|infinity|braid|woven|entwin/.test(text)) return "Twisted";
  if (/cathedral/.test(text)) return "Cathedral";
  if (/pav[eé]|diamonds? (on|along|down) (each|both|the) (side|sides|band|shank)|diamond[- ]set/.test(text)) return "Pavé";
  return "Plain";
}

const METAL_BY_CODE: Record<string, MetalKey> = { YG: "yellow", WG: "white", RG: "rose", PT: "platinum" };

/** Swatches for a piece. Ready-to-ship stock, silver and pieces without per-metal photography show their real finish only. */
function metalsOf(row: ProductRow, native: MetalKey, hasPhotos: boolean): MetalKey[] {
  if (row.is_ready_to_ship || !hasPhotos || native === "silver") return [native];
  const offered = (row.available_metals ?? []).map((c) => METAL_BY_CODE[c]).filter(Boolean);
  return offered.length > 1 ? offered : [native];
}

/** A Supabase row -> the slim product the catalog and modal render. Pure, so server and browser build identical products. */
export function fromRow(row: ProductRow): Product {
  const a = row.attributes ?? {};
  const g = row.gallery ?? {};
  const photos = g.photos ?? undefined;
  const native = metalKey(a.metal ?? "");
  const hasPhotos = !!photos && Object.keys(photos).length > 1;
  const metals = metalsOf(row, native, hasPhotos);
  const isPendant = row.product_type === "pendant";
  const text = `${row.name} ${row.description}`.toLowerCase();
  const karatMatch = (a.metal ?? "").match(/(\d+)k/i);
  const gemstone = a.gemstone ?? "";
  // metal_pricing holds multipliers of price_vnd, so one price edit re-prices every metal and karat
  const byMetal: Product["byMetal"] = {};
  for (const [k, m] of Object.entries(row.metal_pricing ?? {})) {
    if (typeof m === "number" && m > 0) (byMetal as Record<string, number>)[k] = Math.round(row.price_vnd * m);
  }
  const isRing = row.category !== "Fine Jewellery" || /ring|band|stack/i.test(row.name);
  return {
    id: row.id,
    title: row.name,
    titleVi: row.name_vi ?? "",
    descriptionVi: (row.description_vi ?? "").slice(0, 900),
    category: isPendant ? "Pendants & Necklaces" : row.category,
    regular: Number(row.price_vnd),
    sale: null,
    byMetal,
    shape: a.shape ?? "Other",
    metal: native,
    metals,
    readyToShip: !!row.is_ready_to_ship,
    isSold: !!row.is_sold,
    originalPrice: row.original_price_vnd != null && Number(row.original_price_vnd) > Number(row.price_vnd) ? Number(row.original_price_vnd) : null,
    certificateUrl: row.certificate_url ?? null,
    cert: a.certLab && a.certLab !== "None" && a.certNumber ? { lab: a.certLab, number: a.certNumber, verifyUrl: verifyUrl(a.certLab, a.certNumber) } : null,
    cutGrade: a.cutGrade ?? "",
    karats: row.is_ready_to_ship || !hasPhotos || !metals.some((m) => m === "yellow" || m === "white" || m === "rose") ? [] : (row.available_karats ?? []).map((k) => parseInt(k, 10)).filter(Number.isFinite).sort((x, y) => x - y),
    gemstone: gemstone.replace("Authentic Natural ", "").replace(/^NA$/, "None"),
    carat: a.carat ?? "",
    stoneSize: a.stoneSize ?? "",
    // one scraped description still says "handcrafted in Vietnam"; site-config.origin is the verified fact
    description: row.description.replace(/\s*Read more\s*$/i, "").replace(/handcrafted in Vietnam/gi, `handcrafted by master artisans in ${siteConfig.origin.workshop}`).slice(0, 700),
    images: row.images.slice(0, 1),
    metalImages: hasPhotos ? photos : undefined,
    karat: karatMatch ? `${karatMatch[1]}K` : "",
    detail: g.detail ?? undefined,
    angles: g.angles ?? [],
    angleVariants: g.angleVariants ?? undefined,
    stone: g.stone ?? undefined,
    video: g.video_url && g.video_poster ? { src: g.video_url, poster: g.video_poster } : undefined,
    colour: a.colour ?? "",
    clarity: a.clarity ?? "",
    isDiamond: /diamond/i.test(gemstone),
    setting: SETTINGS.filter(([, re]) => re.test(text)).map(([name]) => name),
    band: row.category !== "Fine Jewellery" ? bandOf(text) : "",
    isRing,
    isPendant,
    chainLengths: isPendant ? row.chain_lengths ?? [] : [],
    pendantSize: isPendant ? row.pendant_size ?? "" : "",
  };
}
