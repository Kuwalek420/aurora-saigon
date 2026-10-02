#!/usr/bin/env node
/**
 * Pendant pass over aurorasaigon.com. Reads the pendants listings (/shop/pendants and its Vietnamese twin
 * /cuahang/daychuyen) and merges productType / chainLengths / pendantSize into src/data/products.json
 * WITHOUT touching derived fields (gallery, photoVariants, stoneZone, availableMetals ...).
 * Products found on the listings but missing from products.json are reported, not created (they need images:
 * run scripts/scrape.js for those).
 *
 * Usage: node scripts/scrape-pendants.js [--dry]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { pendantFields } = require('./lib/pendant');

const BASE = 'https://aurorasaigon.com';
const JSON_PATH = path.resolve(__dirname, '..', 'src', 'data', 'products.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const LISTINGS = ['/shop/pendants', '/cuahang/daychuyen'];
const DRY = process.argv.includes('--dry');
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

async function http(url, retries = 3) {
  let err;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      err = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw new Error(`${url}: ${err.message}`);
}

(async () => {
  const doc = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const byUrl = new Map(doc.products.map((p) => [p.url.split(/[#?]/)[0], p]));

  const listed = new Set();
  for (const l of LISTINGS) {
    const $ = cheerio.load(await http(BASE + l));
    let n = 0;
    $('.product-card a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (/\/product\//.test(href)) { listed.add(new URL(href, BASE).toString().split(/[#?]/)[0]); n++; }
    });
    console.log(`${l}: ${n} links`);
  }
  const missing = [...listed].filter((u) => !byUrl.has(u));
  console.log(`listed pendants: ${listed.size}, already in products.json: ${listed.size - missing.length}, missing: ${missing.length}`);
  if (missing.length) console.log('  missing (run scrape.js):', missing);

  const urls = [...listed].filter((u) => byUrl.has(u));
  let next = 0, noChain = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      const p = byUrl.get(url);
      const $ = cheerio.load(await http(url));
      const note = clean($('#productDescription .col-lg-12 > p').first().text());
      Object.assign(p, pendantFields({ note, attributes: p.attributes }));
      if (!p.chainLengths.length) noChain++;
    }
  }));

  const pend = doc.products.filter((p) => p.productType === 'pendant');
  const lens = {};
  for (const p of pend) lens[p.chainLengths.join('/') || '-'] = (lens[p.chainLengths.join('/') || '-'] || 0) + 1;
  console.log('pendants tagged:', pend.length, '| chain lengths:', lens, '| with pendantSize:', pend.filter((p) => p.pendantSize).length, '| no chain note:', noChain);
  if (!DRY) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(doc, null, 2));
    console.log('wrote', path.relative(process.cwd(), JSON_PATH));
  }
})().catch((e) => { console.error(e); process.exit(1); });
