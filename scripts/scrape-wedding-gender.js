#!/usr/bin/env node
/**
 * Women / men and band style of every wedding ring, from the live site's own listing endpoint
 * (https://aurorasaigon.com/action/getWeddingBands.php, parameters ringgender F|M, bandtype, metaltype)
 *   -> src/data/wedding-gender.json   { women: [ids], men: [ids], styles: { Curved: [ids], ... } }
 * The live band-type buttons are accents, curved, open, pave and plain. There is no "eternity" type on the live site
 * (its Eternity Rings page lists the ordinary women's range), so nothing is tagged eternity here.
 * Usage: node scripts/scrape-wedding-gender.js
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/products.json"), "utf8"));
const ours = products.products.filter((p) => p.category === "Wedding Rings").map((p) => p.id);
const METALS = ["yellowgold", "whitegold", "rosegold", "platinum"];
const STYLES = { accents: "Accents", curved: "Curved", open: "Open", pave: "Pavé", plain: "Plain" };

async function codes(gender, bandtype) {
  const found = new Set();
  for (const metaltype of METALS) {
    const q = new URLSearchParams({ metaltype, bandtype, ringgender: gender, currentCurrency: "VND" });
    const r = await fetch(`https://aurorasaigon.com/action/getWeddingBands.php?${q}`);
    for (const x of await r.json()) found.add(x.Code);
  }
  return found;
}

(async () => {
  const F = await codes("F", "");
  const M = await codes("M", "");
  const women = ours.filter((i) => F.has(i) && !M.has(i));
  const men = ours.filter((i) => M.has(i) && !F.has(i));
  const styles = {};
  for (const [key, label] of Object.entries(STYLES)) {
    const s = await codes("F", key);
    // an unknown band type returns the whole range, so a style that matches everything is not a style
    styles[label] = s.size >= F.size ? [] : ours.filter((i) => s.has(i));
  }
  const none = ours.filter((i) => !women.includes(i) && !men.includes(i));
  fs.writeFileSync(path.join(ROOT, "src/data/wedding-gender.json"), JSON.stringify({ source: "aurorasaigon.com/action/getWeddingBands.php", scrapedAt: new Date().toISOString(), women, men, styles }, null, 1));
  console.log(`women ${women.length}, men ${men.length}, unclassified ${none.length}`);
  for (const [k, v] of Object.entries(styles)) console.log(`  ${k}: ${v.length}`);
})().catch((e) => { console.error(e); process.exit(1); });
