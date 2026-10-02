import "server-only";
import { createClient } from "@supabase/supabase-js";
import { fromRow, PRODUCT_COLUMNS } from "./product-model";
import { isVisible, toRow } from "./product-rows";
import type { Product, ProductRow, RawProduct } from "./types";

export const CATALOG_TAG = "catalog";

export interface Catalog {
  products: Product[];
  /** Newest updated_at among the rows: the client asks Supabase only for what changed after this. Null for the fallback. */
  asOf: string | null;
  /** Where the products came from. */
  source: "supabase" | "fallback";
  /** Why the fallback is in use (for logs and the admin; never shown to customers). */
  error: string | null;
}

/** Safety net: the bundled products.json, so a Supabase outage or an empty table never leaves the storefront blank. Loaded only when needed. */
async function fallbackCatalog(reason: string): Promise<Catalog> {
  console.error(`[catalog] Supabase unavailable (${reason}); serving the bundled products.json`);
  const file = (await import("@/data/products.json")).default as unknown as { products: RawProduct[] };
  const products = file.products.filter(isVisible).map(toRow).map(fromRow).filter((p) => p.images.length > 0);
  return { products, asOf: null, source: "fallback", error: reason };
}

/** The catalogue from Supabase (cached 60 s, purged by the admin on every edit); on any error, or zero rows, the bundled copy. */
export async function getCatalog(): Promise<Catalog> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return fallbackCatalog("Supabase is not configured");
  try {
    const db = createClient(url, anon, {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60, tags: [CATALOG_TAG] } }) },
    });
    const { data, error } = await db.from("products").select(PRODUCT_COLUMNS).eq("is_archived", false).order("id").limit(1000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as ProductRow[];
    const products = rows.map(fromRow).filter((p) => p.images.length > 0);
    if (!products.length) throw new Error("the products table returned 0 rows");
    const asOf = rows.reduce<string | null>((m, r) => (!m || r.updated_at > m ? r.updated_at : m), null);
    return { products, asOf, source: "supabase", error: null };
  } catch (e) {
    return fallbackCatalog(e instanceof Error ? e.message : "unknown error");
  }
}

export async function getProducts(): Promise<Product[]> {
  return (await getCatalog()).products;
}
