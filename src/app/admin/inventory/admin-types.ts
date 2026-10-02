/** One piece as the admin dashboard sees it (a slim projection of the Supabase `products` row). */
export interface StockRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  product_type: "pendant" | null;
  /** Price to pay. While on sale this is the discounted price. */
  price_vnd: number;
  /** Price before the sale; null when not on sale. */
  original_price_vnd: number | null;
  discount_percent: number | null;
  is_sold: boolean;
  is_ready_to_ship: boolean;
  is_archived: boolean;
  images: string[];
  certificate_url: string | null;
}

export const ROW_COLUMNS = "id,name,slug,category,product_type,price_vnd,original_price_vnd,discount_percent,is_sold,is_ready_to_ship,is_archived,images,certificate_url";

/** Dropdown scopes shared by the inventory filter and the category discount tool. */
export type Scope = "rings" | "pendants" | "bands";
export const SCOPE_LABEL: Record<Scope, string> = { rings: "Rings", pendants: "Pendants", bands: "Wedding Bands" };
export function inScope(r: Pick<StockRow, "category" | "product_type">, scope: Scope): boolean {
  if (scope === "pendants") return r.product_type === "pendant";
  if (scope === "bands") return r.category === "Wedding Rings";
  return r.product_type !== "pendant" && (r.category === "Engagement Rings" || r.category === "Custom Rings");
}

export function normalizeRow(r: Record<string, unknown>): StockRow {
  const n = (v: unknown) => (v == null ? null : Number(v));
  return { ...(r as unknown as StockRow), price_vnd: Number(r.price_vnd), original_price_vnd: n(r.original_price_vnd), discount_percent: n(r.discount_percent), images: (r.images as string[]) ?? [] };
}

/** Sale price from an original price and a percentage off. */
export const salePrice = (original: number, percent: number) => Math.round(original * (1 - percent / 100));

// ------------------------------------------------------------------ product form (create + edit)

export const METAL_OPTIONS = [
  { code: "YG", name: "Yellow Gold" },
  { code: "WG", name: "White Gold" },
  { code: "RG", name: "Rose Gold" },
  { code: "PT", name: "Platinum" },
] as const;
/** Main finish choices: the four above plus silver, which has no per-metal variants. */
export const MAIN_METALS = ["Yellow Gold", "White Gold", "Rose Gold", "Platinum", "925 Silver"] as const;
export const KARAT_OPTIONS = [
  { value: "9k", label: "9k" },
  { value: "14k", label: "14k" },
  { value: "18k", label: "18k" },
  { value: "PT", label: "Platinum" },
] as const;
export const SHAPE_SUGGESTIONS = ["Round", "Oval", "Emerald", "Pear", "Marquise", "Cushion", "Princess", "Heart", "Radiant", "Trillant", "Kite", "Baguette"];
export type Choice = "Ring" | "Pendant" | "Wedding Band" | "Other";
export const CHOICES: Choice[] = ["Ring", "Pendant", "Wedding Band"];

/** Everything the create form and the edit modal submit. Validated again on the server. */
export interface ProductInput {
  name: string;
  description: string;
  /** Vietnamese name and description (name_vi / description_vi). Optional: empty means the storefront shows the English text. */
  nameVi: string;
  descriptionVi: string;
  /** Ignored while a sale is running (the price is then managed in Discounts & Pricing). */
  price: number | null;
  choice: Choice;
  ready: boolean;
  metals: string[];
  karats: string[];
  mainMetal: string;
  gemstone: string;
  carat: string;
  stoneSize: string;
  shape: string;
  colour: string;
  clarity: string;
  /** Certificate ledger: lab (GIA, IGI, HRD or None), report number, cut grade. */
  certLab: string;
  certNumber: string;
  cutGrade: string;
  images: string[];
  certificate: string | null;
}

/** A full row for the edit modal. */
export interface EditRow extends StockRow {
  description: string;
  name_vi: string | null;
  description_vi: string | null;
  available_metals: string[];
  available_karats: string[];
  attributes: Record<string, string | null>;
}
export const EDIT_COLUMNS = `${ROW_COLUMNS},description,name_vi,description_vi,available_metals,available_karats,attributes`;

/** "18k Yellow Gold" -> { karat: "18k", base: "Yellow Gold" } */
export function splitMetal(s: string | null | undefined): { karat: string | null; base: string } {
  const m = (s ?? "").match(/^(\d+k)\s+(.*)$/i);
  return m ? { karat: m[1].toLowerCase(), base: m[2] } : { karat: null, base: (s ?? "").trim() };
}

export function choiceOf(r: Pick<StockRow, "category" | "product_type">): Choice {
  if (r.product_type === "pendant") return "Pendant";
  if (r.category === "Wedding Rings") return "Wedding Band";
  if (r.category === "Engagement Rings" || r.category === "Custom Rings") return "Ring";
  return "Other";
}

export function inputFromRow(r: EditRow, certificate: string | null): ProductInput {
  const a = r.attributes ?? {};
  return {
    name: r.name,
    description: r.description ?? "",
    nameVi: r.name_vi ?? "",
    descriptionVi: r.description_vi ?? "",
    price: r.price_vnd,
    choice: choiceOf(r),
    ready: r.is_ready_to_ship,
    metals: r.available_metals ?? [],
    karats: r.available_karats ?? [],
    mainMetal: splitMetal(a.metal).base,
    gemstone: a.gemstone ?? "",
    carat: a.carat ?? "",
    stoneSize: a.stoneSize ?? "",
    shape: a.shape ?? "",
    colour: a.colour ?? "",
    clarity: a.clarity ?? "",
    certLab: a.certLab ?? "None",
    certNumber: a.certNumber ?? "",
    cutGrade: a.cutGrade ?? "",
    images: r.images,
    certificate,
  };
}

// ------------------------------------------------------------------ consultations

export const STATUSES = ["New Inquiry", "Scheduled", "Deposit Paid", "Completed", "Cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export interface ConsultationRow {
  id: string;
  client_name: string;
  email: string | null;
  phone: string | null;
  preferred_date: string | null;
  status: Status;
  notes: string;
  created_at: string;
}
export const CONSULTATION_COLUMNS = "id,client_name,email,phone,preferred_date,status,notes,created_at";

export interface ConsultationInput { client_name: string; email: string; phone: string; preferred_date: string; status: Status; notes: string }

// ------------------------------------------------------------------ spot price

export const SPOT_KEYS = [
  { key: "9k", label: "9k gold" },
  { key: "14k", label: "14k gold" },
  { key: "18k", label: "18k gold" },
  { key: "platinum", label: "Platinum" },
] as const;

export interface SpotAdjustment { id: number; created_at: string; metal_keys: string[]; percent: number; item_count: number }
export interface SpotSample { name: string; key: string; from: number; to: number }
