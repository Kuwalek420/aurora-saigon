"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { adminConfigured, endSession, isAdmin, passwordMatches, startSession } from "@/lib/admin-auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { SETTINGS_TAG, safeLink } from "@/lib/settings";
import { adminDb } from "@/lib/supabase-admin";
import { CERTIFICATE_TYPE, IMAGE_TYPES, MAX_IMAGE_BYTES, PRODUCT_IMAGE_BUCKET, type SignedUpload } from "@/lib/supabase";
import { adjustSpot, shown } from "@/lib/spot-math";
import { LABS } from "@/lib/certificate";
import { choiceOf, CONSULTATION_COLUMNS, EDIT_COLUMNS, inScope, KARAT_OPTIONS, MAIN_METALS, METAL_OPTIONS, normalizeRow, ROW_COLUMNS, salePrice, splitMetal, SPOT_KEYS, STATUSES, type Choice, type ConsultationInput, type ConsultationRow, type EditRow, type ProductInput, type Scope, type SpotAdjustment, type SpotSample, type Status, type StockRow } from "./admin-types";

export interface LoginState { error: string | null }
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
type RowResult = Result<{ row: StockRow }>;

const SIGNED_OUT = { ok: false as const, error: "Signed out. Reload and sign in again." };
const MAX_PRICE = 2_000_000_000;

// ---------------------------------------------------------------- session

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: "The admin area is not configured." };
  if (!passwordMatches(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 900)); // slows down guessing
    return { error: "That password is not right." };
  }
  await startSession();
  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function logout() {
  await endSession();
  revalidatePath("/admin/inventory");
}

// ---------------------------------------------------------------- helpers

const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 40;
const validPrice = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= MAX_PRICE;
const validPercent = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0 && n < 100 && Math.round(n * 100) === n * 100;

const bucketBase = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
/** Photos: uploads in our bucket (not certificates), or a site path already in use (migrated pieces). Pasted links are not accepted. */
const isOwnImage = (u: string) => (u.startsWith(bucketBase()) && !u.startsWith(`${bucketBase()}certificates/`)) || /^\/(?!\/)\S+$/.test(u);
const isOwnCertificate = (u: string) => u.startsWith(`${bucketBase()}certificates/`) && u.toLowerCase().endsWith(".pdf") && !/\s/.test(u);

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const safeFileName = (name: string) => {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) : "";
  const stem = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  return ext ? `${stem}.${ext}` : stem;
};

function publish() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/");
}

/** Update one row and hand back the stored result. */
async function update(id: string, patch: Record<string, unknown>): Promise<RowResult> {
  const { data, error } = await adminDb().from("products").update(patch).eq("id", id).select(ROW_COLUMNS).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No such piece." };
  publish();
  return { ok: true, row: normalizeRow(data) };
}

async function load(id: string): Promise<StockRow | null> {
  const { data } = await adminDb().from("products").select(ROW_COLUMNS).eq("id", id).maybeSingle();
  return data ? normalizeRow(data) : null;
}

// ---------------------------------------------------------------- tab 1: stock, price, archive

/** One-click flags: sold out, ready to ship, archived (soft delete / restore). */
export async function setFlag(id: string, key: "is_sold" | "is_ready_to_ship" | "is_archived", value: boolean): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id) || !["is_sold", "is_ready_to_ship", "is_archived"].includes(key) || typeof value !== "boolean") return { ok: false, error: "Invalid request." };
  return update(id, { [key]: value });
}

/** Set price_vnd. Per-metal and per-karat prices are multipliers of it, so they follow. Refused while a sale is running. */
export async function setPrice(id: string, price: number): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id) || !validPrice(price)) return { ok: false, error: "Enter a whole number of dong between 1 and 2,000,000,000." };
  const current = await load(id);
  if (!current) return { ok: false, error: "No such piece." };
  if (current.original_price_vnd != null) return { ok: false, error: "This piece is on sale. Change its price in Discounts & Pricing." };
  return update(id, { price_vnd: price });
}

// ---------------------------------------------------------------- tab 3: sales

/** Put one piece on sale: original price + percentage off; price_vnd becomes the discounted price. */
export async function applySale(id: string, original: number, percent: number): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id) || !validPrice(original)) return { ok: false, error: "Enter the original price as a whole number of dong." };
  if (!validPercent(percent)) return { ok: false, error: "Enter a discount above 0 and below 100 (up to two decimals)." };
  const price = salePrice(original, percent);
  if (price < 1) return { ok: false, error: "That discount leaves no price." };
  return update(id, { original_price_vnd: original, discount_percent: percent, price_vnd: price });
}

/** End a sale: the price goes back to the original. */
export async function clearSale(id: string): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id)) return { ok: false, error: "Invalid request." };
  const current = await load(id);
  if (!current) return { ok: false, error: "No such piece." };
  if (current.original_price_vnd == null) return { ok: true, row: current };
  return update(id, { price_vnd: current.original_price_vnd, original_price_vnd: null, discount_percent: null });
}

/**
 * Bulk sale for a category. Always computed from each piece's ORIGINAL price (price before any sale), so applying
 * 5% twice is still 5%, and `percent: null` resets every piece in the scope to its original price.
 */
export async function categoryDiscount(scope: Scope, percent: number | null): Promise<Result<{ rows: StockRow[] }>> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!["rings", "pendants", "bands"].includes(scope)) return { ok: false, error: "Choose a category." };
  if (percent !== null && !validPercent(percent)) return { ok: false, error: "Enter a discount above 0 and below 100 (up to two decimals)." };
  const db = adminDb();
  const { data, error } = await db.from("products").select(ROW_COLUMNS).eq("is_archived", false).limit(1000);
  if (error) return { ok: false, error: error.message };
  const targets = (data ?? []).map(normalizeRow).filter((r) => inScope(r, scope) && (percent !== null || r.original_price_vnd != null));
  const done: StockRow[] = [];
  for (let i = 0; i < targets.length; i += 20) {
    const results = await Promise.all(targets.slice(i, i + 20).map(async (r) => {
      const original = r.original_price_vnd ?? r.price_vnd;
      const patch = percent === null
        ? { price_vnd: original, original_price_vnd: null, discount_percent: null }
        : { price_vnd: salePrice(original, percent), original_price_vnd: original, discount_percent: percent };
      return db.from("products").update(patch).eq("id", r.id).select(ROW_COLUMNS).maybeSingle();
    }));
    for (const res of results) {
      if (res.error) return { ok: false, error: `${res.error.message} (${done.length} pieces were already changed.)` };
      if (res.data) done.push(normalizeRow(res.data));
    }
  }
  publish();
  return { ok: true, rows: done };
}

// ---------------------------------------------------------------- tab 2: create + media

/** Admin-only: validates one file and issues a one-time signed upload token. Photos go to the bucket root, certificate PDFs to certificates/. */
export async function signUpload(name: string, type: string, size: number): Promise<SignedUpload> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const isPdf = type === CERTIFICATE_TYPE;
  if (typeof name !== "string" || (!isPdf && !IMAGE_TYPES.includes(type))) return { ok: false, error: "Use a JPEG, PNG, WebP or AVIF photo, or a PDF certificate." };
  if (!Number.isFinite(size) || size < 1 || size > MAX_IMAGE_BYTES) return { ok: false, error: "Each file must be under 10 MB." };
  const path = `${isPdf ? "certificates/" : ""}${Date.now()}-${safeFileName(name)}`;
  const { data, error } = await adminDb().storage.from(PRODUCT_IMAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: error?.message ?? "Could not start the upload." };
  return { ok: true, path: data.path, token: data.token };
}

const METAL_CODES = METAL_OPTIONS.map((m) => m.code) as string[];
const KARAT_VALUES = KARAT_OPTIONS.map((k) => k.value) as string[];

/** Validate and normalise a form submission. Returns what to store, or a message for the admin. */
type Parsed = { error: string } | { error: null; v: { name: string; description: string; nameVi: string | null; descriptionVi: string | null; price: number | null; choice: Choice; ready: boolean; metals: string[]; karats: string[]; mainMetal: string; attrs: Record<string, string | null>; images: string[]; certificate: string | null } };
const text = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

function parseInput(raw: unknown, opts: { priceRequired: boolean }): Parsed {
  if (!raw || typeof raw !== "object") return { error: "Invalid request." };
  const i = raw as Partial<ProductInput>;
  const name = text(i.name, 121);
  if (name.length < 2 || name.length > 120) return { error: "Enter a name (2 to 120 characters)." };
  const description = typeof i.description === "string" ? i.description.trim() : "";
  if (description.length > 4000) return { error: "The description is too long (4,000 characters at most)." };
  const nameVi = text(i.nameVi, 121);
  if (nameVi.length > 120) return { error: "The Vietnamese name is too long (120 characters at most)." };
  const descriptionVi = typeof i.descriptionVi === "string" ? i.descriptionVi.trim() : "";
  if (descriptionVi.length > 4000) return { error: "The Vietnamese description is too long (4,000 characters at most)." };
  if (!i.choice || !(["Ring", "Pendant", "Wedding Band", "Other"] as string[]).includes(i.choice)) return { error: "Choose a category." };
  let price: number | null = null;
  if (i.price != null) { if (!validPrice(i.price)) return { error: "Enter the price as a whole number of dong." }; price = i.price; }
  else if (opts.priceRequired) return { error: "Enter the price as a whole number of dong." };
  const metals = Array.isArray(i.metals) ? [...new Set(i.metals)] : [];
  if (!metals.every((m) => METAL_CODES.includes(m))) return { error: "Unknown metal." };
  const karats = Array.isArray(i.karats) ? [...new Set(i.karats)] : [];
  if (!karats.every((k) => KARAT_VALUES.includes(k))) return { error: "Unknown karat." };
  const mainMetal = typeof i.mainMetal === "string" ? i.mainMetal : "";
  if (!(MAIN_METALS as readonly string[]).includes(mainMetal)) return { error: "Choose the main metal." };
  const images = Array.isArray(i.images) ? [...new Set(i.images.filter((u): u is string => typeof u === "string"))] : [];
  if (images.length < 1 || images.length > 30) return { error: "Add 1 to 30 photos. The first is the main photo." };
  if (!images.every(isOwnImage)) return { error: "Photos must be uploaded with the dropzone." };
  const certLab = typeof i.certLab === "string" && (LABS as readonly string[]).includes(i.certLab) ? i.certLab : "None";
  const certNumber = text(i.certNumber, 41);
  if (certNumber.length > 40 || (certNumber && !/^[A-Za-z0-9 -]+$/.test(certNumber))) return { error: "The certificate number can have letters, digits, spaces and dashes (40 characters at most)." };
  if (certNumber && certLab === "None") return { error: "Choose the gemological lab for this certificate number." };
  const certificate = i.certificate ? String(i.certificate) : null;
  if (certificate && !isOwnCertificate(certificate)) return { error: "The certificate must be a PDF uploaded here." };
  const attrs: Record<string, string | null> = {
    gemstone: text(i.gemstone, 80) || null,
    carat: text(i.carat, 40) || null,
    stoneSize: text(i.stoneSize, 40) || null,
    shape: text(i.shape, 40) || null,
    colour: text(i.colour, 20) || null,
    clarity: text(i.clarity, 20) || null,
    certLab: certLab === "None" ? null : certLab,
    certNumber: certNumber || null,
    cutGrade: text(i.cutGrade, 30) || null,
  };
  return { error: null, v: { name, description, nameVi: nameVi || null, descriptionVi: descriptionVi || null, price, choice: i.choice, ready: i.ready === true, metals, karats, mainMetal, attrs, images, certificate } };
}

/** "18K Yellow Gold" when the piece has exactly one gold karat (or already stated one for this metal); otherwise just the metal. */
function metalLabelFor(mainMetal: string, karats: string[], existing?: string | null): string {
  const was = splitMetal(existing);
  if (was.karat && was.base === mainMetal) return `${was.karat.toUpperCase()} ${mainMetal}`;
  const gold = karats.filter((k) => /^\d+k$/.test(k));
  return /Gold$/.test(mainMetal) && gold.length === 1 && karats.length === 1 ? `${gold[0].toUpperCase()} ${mainMetal}` : mainMetal;
}

/** Insert a new piece. Same row shape the migration writes, so the storefront renders it like any other. */
export async function createProduct(input: ProductInput): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const p = parseInput(input, { priceRequired: true });
  if (p.error !== null) return { ok: false, error: p.error };
  const v = p.v;
  const id = `AS-N${Date.now().toString(36).toUpperCase()}`;
  // fixed-stock rings are "Custom Rings" on the live site; the other rings are engagement rings
  const category = v.choice === "Wedding Band" ? "Wedding Rings" : v.choice === "Pendant" || v.choice === "Other" ? "Fine Jewellery" : v.ready ? "Custom Rings" : "Engagement Rings";
  const { data, error } = await adminDb().from("products").insert({
    id,
    slug: `${slugify(v.name) || "piece"}-${id.toLowerCase()}`,
    name: v.name,
    name_vi: v.nameVi,
    description_vi: v.descriptionVi,
    category,
    price_vnd: v.price,
    is_ready_to_ship: v.ready,
    is_sold: false,
    description: v.description,
    images: v.images,
    available_metals: v.metals,
    available_karats: v.karats,
    metal_pricing: {},
    gallery: { photos: null, detail: null, angles: v.images.slice(1), angleVariants: null, stone: null },
    attributes: { ...v.attrs, metal: metalLabelFor(v.mainMetal, v.karats) },
    product_type: v.choice === "Pendant" ? "pendant" : null,
    chain_lengths: [],
    pendant_size: null,
    certificate_url: v.certificate,
  }).select(ROW_COLUMNS).single();
  if (error) return { ok: false, error: error.message };
  publish();
  return { ok: true, row: normalizeRow(data) };
}

/** Everything the edit modal needs, straight from Supabase. */
export async function getProductForEdit(id: string): Promise<Result<{ row: EditRow }>> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id)) return { ok: false, error: "Invalid request." };
  const { data, error } = await adminDb().from("products").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No such piece." };
  return { ok: true, row: { ...normalizeRow(data), description: data.description ?? "", name_vi: data.name_vi ?? null, description_vi: data.description_vi ?? null, available_metals: data.available_metals ?? [], available_karats: data.available_karats ?? [], attributes: data.attributes ?? {} } };
}

/** Save the edit modal: one UPDATE for this product id. */
export async function updateProduct(id: string, input: ProductInput): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id)) return { ok: false, error: "Invalid request." };
  const db = adminDb();
  const { data: cur, error: curErr } = await db.from("products").select("category,product_type,images,attributes,original_price_vnd,price_vnd").eq("id", id).maybeSingle();
  if (curErr) return { ok: false, error: curErr.message };
  if (!cur) return { ok: false, error: "No such piece." };

  const onSale = cur.original_price_vnd != null;
  const p = parseInput(input, { priceRequired: !onSale });
  if (p.error !== null) return { ok: false, error: p.error };
  const v = p.v;

  const patch: Record<string, unknown> = {
    name: v.name,
    name_vi: v.nameVi,
    description_vi: v.descriptionVi,
    description: v.description,
    is_ready_to_ship: v.ready,
    available_metals: v.metals,
    available_karats: v.karats,
    // merge, so attribute keys this form does not edit survive
    attributes: { ...(cur.attributes ?? {}), ...v.attrs, metal: metalLabelFor(v.mainMetal, v.karats, (cur.attributes as Record<string, string> | null)?.metal) },
    certificate_url: v.certificate,
  };
  if (!onSale && v.price != null) patch.price_vnd = v.price; // while a sale runs the price belongs to Discounts & Pricing

  // category follows the choice; an unchanged choice keeps the exact stored category
  const sameChoice = choiceOf({ category: cur.category, product_type: cur.product_type }) === v.choice;
  if (!sameChoice) {
    patch.category = v.choice === "Wedding Band" ? "Wedding Rings" : v.choice === "Pendant" || v.choice === "Other" ? "Fine Jewellery" : v.ready ? "Custom Rings" : "Engagement Rings";
    patch.product_type = v.choice === "Pendant" ? "pendant" : null;
  }

  // photos: untouched unless the list changed; a change replaces the whole set (per-metal renditions and the magnifier spot included)
  const before = (cur.images as string[]) ?? [];
  if (v.images.length !== before.length || v.images.some((u, n) => u !== before[n])) {
    patch.images = v.images;
    patch.gallery = { photos: null, detail: null, angles: v.images.slice(1), angleVariants: null, stone: null };
  }
  return update(id, patch);
}

/** Replace a piece's photos. The first is the main photo; the rest become its extra views. */
export async function updateImages(id: string, images: string[]): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id) || !Array.isArray(images) || images.length < 1 || images.length > 30 || !images.every((u) => typeof u === "string" && isOwnImage(u))) {
    return { ok: false, error: "Keep 1 to 30 photos." };
  }
  // new photos replace the old set outright, including any per-metal renditions and the magnifier spot that belonged to the old photo
  return update(id, { images, gallery: { photos: null, detail: null, angles: images.slice(1), angleVariants: null, stone: null } });
}

/** Set or clear the GIA / IGI certificate PDF. */
export async function updateCertificate(id: string, url: string | null): Promise<RowResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (!validId(id) || (url !== null && !(typeof url === "string" && isOwnCertificate(url)))) return { ok: false, error: "The certificate must be a PDF uploaded here." };
  return update(id, { certificate_url: url });
}

// ---------------------------------------------------------------- tab 4: banner

export async function saveAnnouncement(enabled: boolean, message: string, link: string): Promise<Result<{ enabled: boolean; message: string; link: string }>> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const text = typeof message === "string" ? message.trim() : "";
  if (typeof enabled !== "boolean" || text.length > 200) return { ok: false, error: "The message can be up to 200 characters." };
  if (enabled && !text) return { ok: false, error: "Write the message before switching the bar on." };
  const target = typeof link === "string" ? link.trim() : "";
  if (target && !safeLink(target)) return { ok: false, error: "The link must be a page on this site (starting with /) or an https:// address." };
  const { error } = await adminDb().from("site_settings").upsert({ id: "global", announcement_enabled: enabled, announcement_text: text, announcement_link: target || null, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true, enabled, message: text, link: target };
}

// ---------------------------------------------------------------- tab 3: global metal price multiplier

const SPOT_KEY_VALUES = SPOT_KEYS.map((k) => k.key) as string[];
const validSpot = (keys: unknown, pct: unknown): string | null => {
  if (!Array.isArray(keys) || !keys.length || !keys.every((k) => typeof k === "string" && SPOT_KEY_VALUES.includes(k))) return "Choose at least one metal.";
  if (typeof pct !== "number" || !Number.isFinite(pct) || pct === 0 || Math.abs(pct) > 50 || Math.round(pct * 100) !== pct * 100) return "Enter a percentage between -50 and +50 (not 0, up to two decimals).";
  return null;
};

interface SpotRow { id: string; name: string; price_vnd: number; original_price_vnd: number | null; metal_pricing: Record<string, number>; gallery: { photos?: unknown } | null }
/** Configurable pieces only: per-metal photography and prices, not fixed ready-to-ship stock, not archived. */
async function spotTargets(keys: string[]): Promise<{ rows: SpotRow[] } | { error: string }> {
  const { data, error } = await adminDb().from("products").select("id,name,price_vnd,original_price_vnd,metal_pricing,gallery").eq("is_archived", false).eq("is_ready_to_ship", false).limit(1000);
  if (error) return { error: error.message };
  const rows = (data as unknown as SpotRow[])
    .map((r) => ({ ...r, price_vnd: Number(r.price_vnd), original_price_vnd: r.original_price_vnd == null ? null : Number(r.original_price_vnd) }))
    .filter((r) => r.gallery?.photos && keys.some((k) => typeof r.metal_pricing?.[k] === "number"));
  return { rows };
}

/** What a spot adjustment would do, without changing anything. */
export async function previewSpot(keys: string[], percent: number): Promise<Result<{ count: number; samples: SpotSample[] }>> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const bad = validSpot(keys, percent);
  if (bad) return { ok: false, error: bad };
  const t = await spotTargets(keys);
  if ("error" in t) return { ok: false, error: t.error };
  const samples: SpotSample[] = [];
  for (const r of t.rows.slice(0, 3)) {
    const out = adjustSpot(r, keys, percent)!;
    const k = keys.find((x) => typeof r.metal_pricing[x] === "number")!;
    samples.push({ name: r.name, key: k, from: shown(r, k), to: shown(out, k) });
  }
  return { ok: true, count: t.rows.length, samples };
}

/** Apply the adjustment to every matching piece. The old prices are saved first; if they cannot be saved, nothing changes. */
export async function applySpot(keys: string[], percent: number): Promise<Result<{ rows: StockRow[]; adjustment: SpotAdjustment }>> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const bad = validSpot(keys, percent);
  if (bad) return { ok: false, error: bad };
  const t = await spotTargets(keys);
  if ("error" in t) return { ok: false, error: t.error };
  if (!t.rows.length) return { ok: false, error: "No piece has those metals." };

  const db = adminDb();
  const snapshot = t.rows.map((r) => ({ id: r.id, price_vnd: r.price_vnd, original_price_vnd: r.original_price_vnd, metal_pricing: r.metal_pricing }));
  const log = await db.from("price_adjustments").insert({ metal_keys: keys, percent, item_count: t.rows.length, snapshot }).select("id,created_at,metal_keys,percent,item_count").single();
  if (log.error) return { ok: false, error: `Nothing was changed: the adjustment could not be logged (${log.error.message}). Run the latest supabase/schema.sql.` };

  const done: StockRow[] = [];
  for (let i = 0; i < t.rows.length; i += 20) {
    const results = await Promise.all(t.rows.slice(i, i + 20).map((r) => {
      const out = adjustSpot(r, keys, percent)!;
      return db.from("products").update({ price_vnd: out.price_vnd, original_price_vnd: out.original_price_vnd, metal_pricing: out.metal_pricing }).eq("id", r.id).select(ROW_COLUMNS).maybeSingle();
    }));
    for (const res of results) {
      if (res.error) return { ok: false, error: `${res.error.message}. ${done.length} of ${t.rows.length} pieces were updated; use Undo to restore the previous prices.` };
      if (res.data) done.push(normalizeRow(res.data));
    }
  }
  publish();
  return { ok: true, rows: done, adjustment: { ...log.data, percent: Number(log.data.percent) } as SpotAdjustment };
}

/** Restore the prices saved by the most recent adjustment that has not been undone. */
export async function undoSpot(): Promise<Result<{ rows: StockRow[]; undone: SpotAdjustment }>> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const db = adminDb();
  const last = await db.from("price_adjustments").select("id,created_at,metal_keys,percent,item_count,snapshot").is("undone_at", null).order("id", { ascending: false }).limit(1).maybeSingle();
  if (last.error) return { ok: false, error: last.error.message };
  if (!last.data) return { ok: false, error: "There is no adjustment to undo." };
  const snap = last.data.snapshot as { id: string; price_vnd: number; original_price_vnd: number | null; metal_pricing: Record<string, number> }[];
  const done: StockRow[] = [];
  for (let i = 0; i < snap.length; i += 20) {
    const results = await Promise.all(snap.slice(i, i + 20).map((s) =>
      db.from("products").update({ price_vnd: s.price_vnd, original_price_vnd: s.original_price_vnd, metal_pricing: s.metal_pricing }).eq("id", s.id).select(ROW_COLUMNS).maybeSingle()));
    for (const res of results) {
      if (res.error) return { ok: false, error: `${res.error.message}. ${done.length} of ${snap.length} pieces were restored; run Undo again to finish.` };
      if (res.data) done.push(normalizeRow(res.data));
    }
  }
  const mark = await db.from("price_adjustments").update({ undone_at: new Date().toISOString() }).eq("id", last.data.id);
  if (mark.error) return { ok: false, error: mark.error.message };
  publish();
  const { snapshot: _snapshot, ...meta } = last.data;
  void _snapshot;
  return { ok: true, rows: done, undone: { ...meta, percent: Number(meta.percent) } as SpotAdjustment };
}

// ---------------------------------------------------------------- tab 5: consultations & bespoke requests

type ConsultationResult = Result<{ row: ConsultationRow }>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseConsultation(i: Partial<ConsultationInput>): { error: string } | { error: null; v: { client_name: string; email: string | null; phone: string | null; preferred_date: string | null; status: Status; notes: string } } {
  const client_name = text(i.client_name, 121);
  if (client_name.length < 2 || client_name.length > 120) return { error: "Enter the name of the client." };
  const email = text(i.email, 201);
  if (email && (email.length > 200 || !EMAIL.test(email))) return { error: "That email address does not look right." };
  const phone = text(i.phone, 41);
  if (phone.length > 40 || (phone && !/^[0-9+().\s-]{5,40}$/.test(phone))) return { error: "That phone number does not look right." };
  if (!email && !phone) return { error: "Add an email or a phone number." };
  const date = text(i.preferred_date, 11);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) return { error: "That date is not valid." };
  const status = (i.status ?? "New Inquiry") as Status;
  if (!(STATUSES as readonly string[]).includes(status)) return { error: "Unknown status." };
  const notes = typeof i.notes === "string" ? i.notes.trim() : "";
  if (notes.length > 4000) return { error: "The notes are too long (4,000 characters at most)." };
  return { error: null, v: { client_name, email: email || null, phone: phone || null, preferred_date: date || null, status, notes } };
}

/** Log an inquiry by hand (a phone call, a walk-in, a message). */
export async function createConsultation(input: ConsultationInput): Promise<ConsultationResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  const p = parseConsultation(input ?? {});
  if (p.error !== null) return { ok: false, error: p.error };
  const { data, error } = await adminDb().from("consultations").insert(p.v).select(CONSULTATION_COLUMNS).single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, row: data as ConsultationRow };
}

/** Inline edits: the pipeline status and the internal staff notes. */
export async function updateConsultation(id: string, patch: { status?: Status; notes?: string }): Promise<ConsultationResult> {
  if (!(await isAdmin())) return SIGNED_OUT;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Invalid request." };
  const set: Record<string, unknown> = {};
  if (patch.status !== undefined) {
    if (!(STATUSES as readonly string[]).includes(patch.status)) return { ok: false, error: "Unknown status." };
    set.status = patch.status;
  }
  if (patch.notes !== undefined) {
    if (typeof patch.notes !== "string" || patch.notes.length > 4000) return { ok: false, error: "The notes are too long (4,000 characters at most)." };
    set.notes = patch.notes.trim();
  }
  if (!Object.keys(set).length) return { ok: false, error: "Nothing to update." };
  const { data, error } = await adminDb().from("consultations").update(set).eq("id", id).select(CONSULTATION_COLUMNS).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No such inquiry." };
  return { ok: true, row: data as ConsultationRow };
}
