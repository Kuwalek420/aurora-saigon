#!/usr/bin/env node
/**
 * Variant metadata pass over aurorasaigon.com product pages.
 *
 * Merges three fields into src/data/products.json WITHOUT touching anything
 * else (gallery / photoVariants / stoneZone are derived and must survive):
 *   availableMetals : ["PT" | "YG" | "WG" | "RG"]  metal swatches the live page offers
 *   availableKarats : ["9k" | "14k" | "18k"]       gold purities offered (empty when none)
 *   isReadyToShip   : true for pieces listed under /ready-to-ship-engagement-rings
 *
 * Usage: node scripts/scrape-variants.js [--limit=N] [--dry]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE = 'https://aurorasaigon.com';
const JSON_PATH = path.resolve(__dirname, '..', 'src', 'data', 'products.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const CODE = { yellowgold: 'YG', whitegold: 'WG', rosegold: 'RG', platinum: 'PT' };
const ORDER = ['YG', 'WG', 'RG', 'PT'];
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(url, retries = 3) {
  let err;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      err = e;
      await sleep(400 * (i + 1));
    }
  }
  throw new Error(`${url}: ${err.message}`);
}

async function pool(items, worker, limit = 6) {
  let next = 0, done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        await worker(items[next++]);
        process.stdout.write(`\r  ${++done}/${items.length}   `);
      }
    })
  );
  process.stdout.write('\n');
}

function parseVariants(html) {
  const $ = cheerio.load(html);
  const metals = new Set();
  $('.metal-selector .entry').each((_, el) => {
    const c = CODE[($(el).attr('id') || '').toLowerCase()];
    if (c) metals.add(c);
  });
  const karats = [];
  $('.goldct-selector .entry').each((_, el) => {
    const k = parseInt($(el).attr('id'), 10);
    if ([9, 14, 18].includes(k)) karats.push(`${k}k`);
  });
  return { availableMetals: ORDER.filter((c) => metals.has(c)), availableKarats: karats };
}

/** Product URLs listed on the ready-to-ship page (all pages of the listing). */
async function readyToShipUrls() {
  const urls = new Set();
  for (let page = 1; page <= 20; page++) {
    const html = await http(`${BASE}/ready-to-ship-engagement-rings${page > 1 ? `?page=${page}` : ''}`).catch(() => '');
    const $ = cheerio.load(html);
    const before = urls.size;
    $('.product-card a[href]').each((_, a) => {
      const h = $(a).attr('href');
      if (/\/(product|engagement-ring|wedding-band)\//.test(h)) urls.add(new URL(h, BASE).toString().split(/[#?]/)[0]);
    });
    if (urls.size === before) break;
  }
  return urls;
}

(async () => {
  const doc = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const rts = await readyToShipUrls();
  console.log(`ready-to-ship listing: ${rts.size} URLs`);
  const list = doc.products.slice(0, LIMIT);
  const errors = [];
  await pool(list, async (p) => {
    try {
      const v = parseVariants(await http(p.url));
      p.availableMetals = v.availableMetals;
      p.availableKarats = v.availableKarats;
      p.isReadyToShip = rts.has(p.url.split(/[#?]/)[0]);
    } catch (e) {
      errors.push({ id: p.id, error: e.message });
    }
  });
  const n = (f) => list.filter(f).length;
  console.log('products:', list.length, 'errors:', errors.length);
  console.log('ready-to-ship:', n((p) => p.isReadyToShip));
  console.log('with karats:', n((p) => p.availableKarats?.length));
  console.log('no metal swatches:', n((p) => p.availableMetals && !p.availableMetals.length));
  const combos = {};
  for (const p of list) if (p.availableMetals) { const k = `${p.category} | ${p.availableMetals.join(',') || '-'} | ${(p.availableKarats || []).join(',') || '-'} | rts=${p.isReadyToShip}`; combos[k] = (combos[k] || 0) + 1; }
  console.table(combos);
  if (errors.length) console.log(errors);
  if (!DRY) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(doc, null, 2));
    console.log('wrote', path.relative(process.cwd(), JSON_PATH));
  }
})().catch((e) => { console.error(e); process.exit(1); });
