/** Exact shape of src/data/products.json (plus `src`, the public URL added by scripts/prep-assets.mjs). */
export interface RawImage {
  originalUrl: string;
  metalVariant: string;
  alt: string | null;
  file: string;
  localPath: string | null;
  error?: string;
  generated?: boolean;
  src: string | null;
  /** Metal renditions of the ORIGINAL photo: gold-hued pixels remapped only (scripts/recolor-originals.mjs). */
  photoVariants?: Partial<Record<"yellow" | "white" | "rose" | "platinum", string>>;
  /** Centre-stone location as fractions of the original photo (used by the modal magnifier). */
  stoneZone?: { x: number; y: number; r: number };
  /** Product-detail assets (scripts/build-gallery.mjs): auto-generated macro frame per metal + other real photos. */
  gallery?: {
    detail: Partial<Record<"yellow" | "white" | "rose" | "platinum", string>>;
    angles: string[];
    /** Recoloured twin of each angle photo per metal; null where the photo shows skin and was not recoloured. */
    angleVariants?: Partial<Record<"white" | "rose" | "platinum", (string | null)[]>>;
    /** On-hand video of the piece (scripts/scrape-ready-to-ship-media.js): public URL of the mp4 and its still frame. */
    videoUrl?: string;
    videoPoster?: string;
  };
}
export interface RawPrice {
  regular: number;
  sale: number | null;
  currency: "VND";
  byMetal: Partial<Record<"9k" | "10k" | "14k" | "18k" | "platinum", number>>;
}
export interface RawAttributes {
  metal: string;
  gemstone: string;
  shape?: string;
  style?: string;
  carat?: string;
  stoneSize?: string;
  metalWeight?: string;
  colour?: string;
  clarity?: string;
  bandWidth?: string;
}
export interface RawProduct {
  id: string;
  sku: string;
  title: string;
  category: "Engagement Rings" | "Custom Rings" | "Fine Jewellery" | "Wedding Rings";
  url: string;
  price: RawPrice;
  attributes: RawAttributes;
  description: string;
  details: Record<string, string>;
  images: RawImage[];
  /** scripts/scrape-pendants.js: "pendant" for everything on the pendants listings. Rings carry no productType. */
  productType?: "pendant";
  /** Chain lengths the page states, e.g. ["16in","18in"] (the chain is sold adjustable between them). */
  chainLengths?: string[];
  /** Stone size as published (the only dimension the site gives for a pendant). */
  pendantSize?: string | null;
  /** scripts/scrape-variants.js: metal swatches the live page offers (PT, YG, WG, RG). */
  availableMetals?: ("PT" | "YG" | "WG" | "RG")[];
  /** Gold purities the live page offers, e.g. ["9k","14k","18k"]. */
  availableKarats?: string[];
  /** Listed under /ready-to-ship-engagement-rings: fixed stock, not configurable. */
  isReadyToShip?: boolean;
}
export interface ProductsFile {
  source: string;
  scrapedAt: string;
  count: number;
  products: RawProduct[];
}

/** One row of the Supabase `products` table (supabase/schema.sql): the single source of every product attribute. */
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  /** Source category (a pendant is "Fine Jewellery" with product_type "pendant"). */
  category: RawProduct["category"];
  /** Base price in VND; metal_pricing multiplies it. */
  price_vnd: number;
  is_ready_to_ship: boolean;
  is_sold: boolean;
  description: string;
  name_vi: string | null;
  description_vi: string | null;
  /** Main photo first, then every gallery photo. */
  images: string[];
  available_metals: string[];
  available_karats: string[];
  /** Multipliers of price_vnd keyed by karat or platinum, e.g. { "14k": 0.857, "18k": 1 }. */
  metal_pricing: Record<string, number>;
  gallery: {
    photos?: Partial<Record<"yellow" | "white" | "rose" | "platinum", string>> | null;
    detail?: Partial<Record<"yellow" | "white" | "rose" | "platinum", string>> | null;
    angles?: string[];
    angleVariants?: Partial<Record<"white" | "rose" | "platinum", (string | null)[]>> | null;
    stone?: { x: number; y: number; r: number } | null;
    /** On-hand video and its cover frame (Supabase Storage). Absent for pieces the live site has no video for. */
    video_url?: string | null;
    video_poster?: string | null;
  };
  /** The scraped attributes plus the certificate ledger the admin edits (lab, number, cut grade). */
  attributes: Partial<Record<keyof RawAttributes | "certLab" | "certNumber" | "cutGrade", string | null>>;
  product_type: "pendant" | null;
  chain_lengths: string[];
  pendant_size: string | null;
  /** Soft delete: archived pieces are hidden from the storefront and can be restored from the admin. */
  is_archived: boolean;
  /** Price before the sale; null when not on sale. price_vnd is always the price to pay. */
  original_price_vnd: number | null;
  discount_percent: number | null;
  certificate_url: string | null;
  updated_at: string;
}

/** Slimmed product sent to the client catalog. */
export type MetalKey = "yellow" | "white" | "rose" | "platinum" | "silver";
export interface Product {
  id: string;
  title: string;
  /** Source category, except pendants which get their own shop category. */
  category: RawProduct["category"] | "Pendants & Necklaces";
  regular: number;
  sale: number | null;
  byMetal: RawPrice["byMetal"];
  shape: string;
  metal: MetalKey;
  gemstone: string;
  carat: string;
  stoneSize: string;
  description: string;
  images: string[];
  /** Image to show for each selectable metal; absent when the scrape has no per-metal photo. */
  metalImages?: Partial<Record<MetalKey, string>>;
  isRing: boolean;
  isPendant: boolean;
  /** Short on-hand video of the piece, when the live site has one. */
  video?: { src: string; poster: string };
  /** Chain lengths offered, as published ("16in"); empty for anything that is not a pendant. */
  chainLengths: string[];
  /** Published stone size shown as the pendant's dimension. */
  pendantSize: string;
  /** Setting styles named in the product copy (Solitaire, Halo, Trilogy, Bezel). Derived, not a source field. */
  setting: string[];
  /** Band type inferred from the product copy for rings (Pavé, Twisted, Cathedral, otherwise Plain). Derived. */
  band: string;
  /** Macro detail frame per metal (auto-generated from the product photo). */
  detail?: Partial<Record<MetalKey, string>>;
  /** Other real photographs of the piece. */
  angles: string[];
  angleVariants?: Partial<Record<MetalKey, (string | null)[]>>;
  stone?: { x: number; y: number; r: number };
  colour: string;
  clarity: string;
  isDiamond: boolean;
  /** Metals this piece is offered in (drives the swatches); a single entry means "real finish only". */
  metals: MetalKey[];
  /** Gold purities offered, ascending (empty when there is nothing to choose). */
  karats: number[];
  /** Fixed in-stock piece at the showroom: no metal or karat configuration. */
  readyToShip: boolean;
  /** Price before the sale, set only while original_price_vnd is above the current price (drives the SALE badge). */
  originalPrice: number | null;
  /** GIA / IGI certificate PDF uploaded by the admin. */
  certificateUrl: string | null;
  /** Gemological report reference (lab + number) with a verification page when the lab has one. */
  cert: { lab: string; number: string; verifyUrl: string | null } | null;
  /** Cut grade stated on the certificate, e.g. "Excellent". */
  cutGrade: string;
  /** Fixed stock that has been sold (Supabase `is_sold`): shown as Atelier archive and not purchasable. */
  isSold: boolean;
  /** Vietnamese name and description (Supabase name_vi / description_vi); empty when not available. */
  titleVi: string;
  descriptionVi: string;
  /** Karat stated on the product itself, e.g. "14K" (empty when not gold). */
  karat: string;
}
export type Currency = "VND" | "USD" | "EUR" | "GBP" | "AUD" | "NZD";
export interface CartItem {
  key: string;
  productId: string;
  title: string;
  /** Vietnamese title, kept so the bag can be shown in Vietnamese. */
  titleVi?: string;
  image: string;
  size: string | null;
  metal: MetalKey;
  /** Gold purity chosen (null for platinum, silver and fixed pieces). */
  karat?: number | null;
  gemstone: string;
  /** Chain length chosen for a pendant, e.g. "16in". */
  chain?: string | null;
  unitVnd: number;
  qty: number;
}
export interface Filters {
  category: string;
  shape: string;
  metal: string;
  gemstone: string;
  setting: string;
  band: string;
  /** Wedding rings only: "Women" | "Men" | "All". */
  gender: string;
  /** Wedding rings only: band style such as "Curved", or "All". */
  style: string;
  price: [number, number];
}
