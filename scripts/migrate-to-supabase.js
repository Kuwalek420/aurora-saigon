/**
 * Moves 100% of src/data/products.json into the Supabase `products` table (the storefront reads nothing else).
 *
 *   npm run migrate:supabase                  upsert every visible product
 *   npm run migrate:supabase -- --reset-prices  also overwrite price_vnd (otherwise prices edited in Supabase are kept)
 *   node scripts/migrate-to-supabase.js --dry-run out.json   write the rows to a file, touch nothing
 *
 * Run supabase/schema.sql first. Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
 * Never overwritten on a re-run: is_sold, and (without --reset-prices) price_vnd.
 *
 * Row shape (see src/lib/product-model.ts, which turns a row back into what the UI needs):
 *   price_vnd      base price: the 18k price for pieces with per-metal photos, otherwise the listed (sale) price
 *   metal_pricing  { "9k": 0.66, "14k": 0.857, "18k": 1, "platinum": 1.11 }: multipliers of price_vnd, so editing
 *                  price_vnd re-prices every metal. Multipliers are full precision: round(price_vnd * m) is the scraped value.
 */
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const dryIdx = args.indexOf("--dry-run");
const dryOut = dryIdx >= 0 ? args[dryIdx + 1] : null;
const resetPrices = args.includes("--reset-prices");

const file = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "data", "products.json"), "utf8"));
// one row builder shared with the storefront fallback (Node runs the .ts directly: it only has type imports)
const { isVisible, toRow } = require("../src/lib/product-rows.ts");

const rows = file.products.filter(isVisible).map(toRow).map(({ is_sold, is_archived, original_price_vnd, discount_percent, certificate_url, updated_at, ...row }) => row); // those belong to the database (admin edits), never overwritten

if (dryOut) {
  fs.writeFileSync(dryOut, JSON.stringify(rows));
  console.log(`Dry run: ${rows.length} rows written to ${dryOut} (${(fs.statSync(dryOut).size / 1e6).toFixed(2)} MB).`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (Supabase > Project Settings > API > service_role). Add it to .env.local.");
  process.exit(1);
}
const { createClient } = require("@supabase/supabase-js");

(async () => {
  const db = createClient(url, key, { auth: { persistSession: false } });

  // fail early, with the fix, if the schema has not been applied
  const probe = await db.from("products").select("id,metal_pricing,gallery,attributes,product_type,chain_lengths,pendant_size").limit(1);
  if (probe.error) {
    console.error(`The products table is not ready (${probe.error.message}).\nRun supabase/schema.sql in the Supabase SQL editor, then re-run this script.`);
    process.exit(1);
  }

  const existing = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("products").select("id").range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    data.forEach((r) => existing.add(r.id));
    if (data.length < 1000) break;
  }

  // PostgREST upserts need one column set per batch: existing rows (keep their price) and new rows go separately
  const fresh = rows.filter((r) => !existing.has(r.id) || resetPrices);
  const keep = rows.filter((r) => existing.has(r.id) && !resetPrices).map(({ price_vnd, ...rest }) => rest);
  for (const [label, list] of [["new/reset", fresh], ["existing (price kept)", keep]]) {
    for (let i = 0; i < list.length; i += 50) {
      const { error } = await db.from("products").upsert(list.slice(i, i + 50), { onConflict: "id" });
      if (error) { console.error(`${label} batch at ${i} failed: ${error.message}`); process.exit(1); }
    }
    console.log(`${label}: ${list.length} rows`);
  }

  const { count } = await db.from("products").select("id", { count: "exact", head: true });
  console.log(`Done. ${rows.length} products synced, ${count} rows in the table, ${rows.filter((r) => r.is_ready_to_ship).length} ready to ship.`);
})();
