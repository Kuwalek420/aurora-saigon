/**
 * Fills products.name_vi and products.description_vi in Supabase from the Vietnamese pages of aurorasaigon.com.
 *
 *   node scripts/scrape-vietnamese-catalog.js            products that have no name_vi yet (safe to re-run / resume)
 *   node scripts/scrape-vietnamese-catalog.js --force    every product again
 *   node scripts/scrape-vietnamese-catalog.js --limit 20 first 20 only (a trial run)
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local) and the name_vi / description_vi columns.
 * Only text the live site publishes is stored: nothing is translated or invented here.
 * Products with no Vietnamese page are listed in failed-scrape.json (id, URLs tried, reason).
 */
const fs = require("node:fs");
const path = require("node:path");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");

try { process.loadEnvFile(path.join(__dirname, "..", ".env.local")); } catch { /* env may already be set */ }

const ORIGIN = "https://aurorasaigon.com";
const DELAY_MS = 150; // between every request, so the site is never hammered
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const FAILED_FILE = path.join(__dirname, "..", "failed-scrape.json");

/**
 * Vietnamese URL path per category, most likely first. The first entry of each list is the requested mapping; the others
 * are what aurorasaigon.com actually serves where the first 404s (checked live):
 *   Custom Rings (CJ-xxx)  nhan-thiet-ke 404s, the page lives under nhan-cau-hon
 *   Fine Jewellery / pendants  trang-suc 404s, the page lives under sanpham
 *   Wedding Rings  nhan-cuoi/women/{code} or nhan-cuoi/men/{code} (chosen from the product name). Checked live: these URLs return
 *                  the Vietnamese LISTING page (canonical /nhan-cuoi/women), not a product page, so nothing can be parsed from
 *                  them; the listing cards show the English title. Such products are logged in failed-scrape.json.
 * The script remembers which path worked for a category and tries that first from then on.
 */
const CATEGORY_PATHS = {
  "Engagement Rings": ["nhan-cau-hon", "choose-setting/nhan-cau-hon"],
  "Wedding Rings": ["nhan-cuoi/women", "nhan-cuoi/men"],
  "Custom Rings": ["nhan-thiet-ke", "nhan-cau-hon"],
  "Fine Jewellery": ["trang-suc", "sanpham"],
  pendant: ["trang-suc", "sanpham"],
};
/** Men's wedding rings go to /nhan-cuoi/men first; everything else under Wedding Rings to /nhan-cuoi/women first. */
const isMens = (p) => /(^|[^a-z])(men|mens|men's|gents?|his|male)([^a-z]|$)/i.test(`${p.name ?? ""} ${p.slug ?? ""}`) && !/women/i.test(`${p.name ?? ""} ${p.slug ?? ""}`);
function pathsFor(p) {
  if (p.product_type === "pendant") return CATEGORY_PATHS.pendant;
  const list = CATEGORY_PATHS[p.category] ?? [];
  return p.category === "Wedding Rings" && isMens(p) ? [...list].reverse() : list;
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

let lastRequest = 0;
async function politeFetch(url) {
  const wait = lastRequest + DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      lastRequest = Date.now();
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "vi,en;q=0.5" }, signal: AbortSignal.timeout(25000), redirect: "follow" });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return { status: res.status, html: res.status === 200 ? await res.text() : "" };
    } catch (e) {
      if (attempt === 2) return { status: 0, html: "", error: e.message };
      await sleep(1000 * (attempt + 1)); // back off, then retry
      lastRequest = Date.now();
    }
  }
}

/** A real Vietnamese product page has lang="vi" and a product title. Listing / catch-all pages have no product h1. */
function parse(html) {
  const $ = cheerio.load(html);
  if (!/^vi/i.test($("html").attr("lang") ?? "")) return null;
  const name = clean($("h1.product-single__name").first().text());
  if (!name) return null;

  // same extraction the English scrape used: the structured description if present, otherwise the visible text block
  let ld = null;
  $('script[type="application/ld+json"]').each((_, e) => {
    try {
      const j = JSON.parse($(e).html());
      const hit = (Array.isArray(j) ? j : [j]).find((x) => x && x["@type"] === "Product");
      if (hit && !ld) ld = hit;
    } catch { /* ignore malformed blocks */ }
  });
  const block = $("#product__description").first();
  block.find("li, p, h1, h2, h3, h4").each((_, el) => $(el).append("\n"));
  const blockText = block.text().split("\n").map(clean).filter(Boolean).join(" ");
  const description = clean(ld?.description || blockText).replace(/\s*(Read more|Xem thêm)\s*$/i, "").trim();
  return { name, description: description || null };
}

const failed = [];
const saveFailed = () => fs.writeFileSync(FAILED_FILE, JSON.stringify(failed, null, 2));

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
  const db = createClient(url, key, { auth: { persistSession: false } });

  // 1. schema check
  const probe = await db.from("products").select("id,name_vi,description_vi").limit(1);
  if (probe.error) {
    console.error(`Columns name_vi / description_vi are missing (${probe.error.message}).\nRun in the Supabase SQL editor:\n  alter table public.products add column if not exists name_vi text, add column if not exists description_vi text;`);
    process.exit(1);
  }

  // 2. all products
  const { data, error } = await db.from("products").select("id,name,slug,category,product_type,name_vi").order("id").limit(1000);
  if (error) { console.error(error.message); process.exit(1); }
  const todo = data.filter((p) => FORCE || !p.name_vi).slice(0, LIMIT);
  console.log(`${data.length} products in Supabase; ${todo.length} to fetch${FORCE ? " (--force)" : ""}. ${DELAY_MS} ms between requests.\n`);

  process.on("SIGINT", () => { saveFailed(); console.log("\nInterrupted. failed-scrape.json written; re-run to resume."); process.exit(130); });

  const worked = {}; // category -> the path that served a Vietnamese page last time
  let synced = 0, nameOnly = 0, idx = 0;
  for (const p of todo) {
    idx++;
    const code = p.id; // product code, e.g. CJ-523 or AS-321-EN-WG-R-LAB; it is the URL slug on the live site
    const group = p.product_type === "pendant" ? "pendant" : p.category + (p.category === "Wedding Rings" && isMens(p) ? " (men)" : "");
    const candidates = [...new Set([worked[group], ...pathsFor(p)].filter(Boolean))];
    const tried = [];
    let page = null;

    for (const prefix of candidates) {
      const target = `${ORIGIN}/${prefix}/${encodeURIComponent(code)}`;
      const res = await politeFetch(target);
      if (res.status === 200) {
        const parsed = parse(res.html);
        if (parsed) { page = parsed; worked[group] = prefix; break; }
        tried.push({ url: target, status: 200, reason: "not a Vietnamese product page (no product title)" });
      } else tried.push({ url: target, status: res.status, reason: res.error ?? `HTTP ${res.status}` });
    }

    if (!page) {
      failed.push({ id: p.id, category: p.category, product_type: p.product_type, reason: candidates.length ? "no Vietnamese product page found" : "no URL path for this category", tried });
      console.log(`[${idx}/${todo.length}] Failed: ${p.id} (${tried.map((t) => t.status || "err").join(", ") || "-"})`);
      if (failed.length % 25 === 0) saveFailed();
      continue;
    }

    const up = await db.from("products").update({ name_vi: page.name, description_vi: page.description }).eq("id", p.id).select("id");
    if (up.error || !up.data?.length) {
      failed.push({ id: p.id, category: p.category, product_type: p.product_type, reason: `database update failed: ${up.error?.message ?? "no row matched"}`, tried });
      console.log(`[${idx}/${todo.length}] Failed: ${p.id} (database: ${up.error?.message ?? "no row"})`);
      continue;
    }
    synced++;
    if (!page.description) nameOnly++;
    console.log(`Synced ${synced}/${todo.length}: ${p.id} -> ${page.name}`);
  }

  saveFailed();
  const have = await db.from("products").select("id", { count: "exact", head: true }).not("name_vi", "is", null);
  console.log(`\nDone. Synced ${synced} of ${todo.length}${nameOnly ? ` (${nameOnly} with a name but no description published)` : ""}; ${failed.length} failed -> failed-scrape.json.`);
  console.log(`Products with name_vi in Supabase now: ${have.count} of ${data.length}.`);
  const by = {};
  failed.forEach((f) => { const k = f.product_type === "pendant" ? "pendant" : f.category; by[k] = (by[k] ?? 0) + 1; });
  if (failed.length) console.log("Failures by category:", JSON.stringify(by));
})();
