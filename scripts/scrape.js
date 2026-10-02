#!/usr/bin/env node
/**
 * Scraper for https://aurorasaigon.com
 *
 * The site is NOT WooCommerce (/wp-json/wc/store/v1 returns 404), so this
 * script uses the site's own endpoints + HTML:
 *   - Engagement rings : /getSettings.php?metaltype=<metal>  (JSON) -> /choose-setting/engagement-ring/<metal>/<code>
 *   - Custom rings     : /ready-to-ship-engagement-rings            -> /engagement-ring/CJ-xxx
 *   - Wedding bands    : /wedding-rings/*, /womens-eternity-rings   -> /wedding-band/<metal>/<code>
 *   - Fine jewellery   : /shop/rings|pendants|bracelets|earrings    -> /product/<code>
 *                        (/cuahang/daychuyen is the Vietnamese twin of /shop/pendants; pendants also get
 *                         productType/chainLengths/pendantSize from scripts/lib/pendant.js)
 * Product detail pages are parsed with Cheerio; images are downloaded in
 * their original resolution (ImageKit "tr:" transform segment + query removed).
 *
 * Usage: node scripts/scrape.js [--no-images] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { pendantFields } = require('./lib/pendant');

const BASE = 'https://aurorasaigon.com';
const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'raw-assets', 'scraped-images');
const OUT_JSON = path.join(ROOT, 'src', 'data', 'products.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const SKIP_IMAGES = args.includes('--no-images');
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const PENDANT_LISTINGS = ['/shop/pendants', '/cuahang/daychuyen'];
const METALS = ['yellowgold', 'whitegold', 'rosegold', 'platinum'];

// Listing pages that are server-rendered: [path, category, filePrefix]
const LISTINGS = [
  ['/ready-to-ship-engagement-rings', 'Custom Rings', 'custom'],
  ['/shop/rings', 'Fine Jewellery', 'ring'],
  ['/shop/pendants', 'Fine Jewellery', 'pendant'],
  ['/cuahang/daychuyen', 'Fine Jewellery', 'pendant'],
  ['/shop/bracelets', 'Fine Jewellery', 'bracelet'],
  ['/shop/earrings', 'Fine Jewellery', 'earring'],
  ['/wedding-rings/women', 'Wedding Rings', 'band'],
  ['/wedding-rings/men', 'Wedding Rings', 'band'],
  ['/wedding-rings/womens-curved', 'Wedding Rings', 'band'],
  ['/womens-eternity-rings', 'Wedding Rings', 'band'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

async function http(url, { binary = false, retries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (e) {
      lastErr = e;
      await sleep(400 * (i + 1));
    }
  }
  throw new Error(`${url}: ${lastErr.message}`);
}

async function pool(items, worker, limit = CONCURRENCY) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    })
  );
  return results;
}

function progress(label, done, total) {
  const w = 24;
  const filled = Math.round((done / total) * w);
  process.stdout.write(`\r  ${label} [${'#'.repeat(filled)}${'.'.repeat(w - filled)}] ${done}/${total}   `);
  if (done === total) process.stdout.write('\n');
}

/** Strip ImageKit transformation ("tr:..." path segment and ?tr= query) -> original file. */
function originalImage(url) {
  try {
    const u = new URL(url, BASE);
    u.search = '';
    u.pathname = u.pathname.replace(/\/tr:[^/]*(?=\/)/, '');
    return u.toString();
  } catch {
    return null;
  }
}

/* ------------------------------ discovery ------------------------------ */

async function discover() {
  /** url -> { url, category, prefix, listing } */
  const found = new Map();
  const add = (href, category, prefix, listing) => {
    const url = new URL(href, BASE).toString().split('#')[0].split('?')[0];
    if (!found.has(url)) found.set(url, { url, category, prefix, listing });
  };

  // 1) Engagement rings via JSON endpoint (one call per metal)
  for (const metal of METALS) {
    const qs = new URLSearchParams({ metaltype: metal, shapes: '', bandtype: '', settingstyle: '', settingprofile: '', stonetype: 'labdiamond' });
    const raw = await http(`${BASE}/getSettings.php?${qs}`);
    const data = JSON.parse(raw.slice(raw.indexOf('[')));
    for (const r of data) {
      if (!r.Code) continue;
      // Every design is available in all metals; use the yellow-gold page as canonical (it lists all metal images).
      add(`/choose-setting/engagement-ring/yellowgold/${encodeURIComponent(r.Code.trim())}`, 'Engagement Rings', 'ring', 'getSettings.php');
    }
    log(`  engagement rings via ${metal}: ${data.length} designs (unique so far: ${[...found.values()].filter((f) => f.category === 'Engagement Rings').length})`);
  }

  // 2) Server-rendered listing pages
  for (const [p, category, prefix] of LISTINGS) {
    let html;
    try {
      html = await http(BASE + p);
    } catch (e) {
      log(`  ! ${p}: ${e.message}`);
      continue;
    }
    const $ = cheerio.load(html);
    let n = 0;
    $('.product-card a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (/\/(product|engagement-ring|wedding-band)\//.test(href)) {
        const before = found.size;
        add(href, category, prefix, p);
        if (found.size > before) n++;
      }
    });
    log(`  ${p}: +${n} new`);
  }
  return [...found.values()];
}

/* ------------------------------- parsing ------------------------------- */

function parseDetails(text) {
  // Bullet-style "Key: value" lines from the description
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z][A-Za-z /&'-]{1,40}?)\s*:\s*(.+)$/);
    if (m) out[clean(m[1])] = clean(m[2]);
  }
  return out;
}

function parseProduct(html, item) {
  const $ = cheerio.load(html);
  const val = (id) => clean($(`#${id}`).attr('value'));

  const sku = val('skuMF') || item.url.split('/').pop();
  const title = clean($('h1.product-single__name').first().text()) || val('titleMF');

  // JSON-LD Product block
  let ld = {};
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const j = JSON.parse($(s).contents().text());
      if (j['@type'] === 'Product') ld = j;
    } catch {}
  });
  const offer = ld.offers || {};
  const currency = offer.priceCurrency || clean($('[data-currency]').first().attr('data-currency')) || 'VND'; // site default currency is VND

  // Prices
  const num = (s) => {
    const n = parseFloat(String(s ?? '').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const current = num(val('priceMF')) ?? num(offer.price);
  const old = num(val('oldPriceMF'));
  const discount = num(val('discountPrice') || val('discountPriceMF'));
  const regular = old && old >= (current ?? 0) ? old : current;
  const sale = current != null && regular != null && current < regular ? current : discount != null && regular != null && discount < regular ? discount : null;
  const pricesByMetal = {};
  $('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr('name') || '';
    const m = name.match(/^(\d+k|platinum|silver)Price$/i);
    if (m && num($(el).attr('value'))) pricesByMetal[m[1].toLowerCase()] = num($(el).attr('value'));
  });

  if (/sterling|925|silver/i.test(val('ga_metal'))) for (const k of Object.keys(pricesByMetal)) delete pricesByMetal[k];

  // Description + spec tables
  const descEl = $('#product__description').first();
  descEl.find('br').replaceWith('\n');
  descEl.find('li, p, h1, h2, h3, h4').each((_, el) => $(el).append('\n'));
  const descriptionText = descEl.text().split('\n').map(clean).filter(Boolean).join('\n');
  const specs = {};
  $('#productDescription .item').each((_, el) => {
    const k = clean($(el).find('label').text());
    const v = clean($(el).find('span').text());
    if (k) specs[k] = v;
  });
  const extraNote = clean($('#productDescription .col-lg-12 > p').first().text());
  const bullets = parseDetails(descriptionText);

  // Attributes
  const pick = (...keys) => {
    for (const k of keys) {
      const hit = Object.keys({ ...specs, ...bullets }).find((x) => x.toLowerCase() === k.toLowerCase());
      if (hit) return { ...bullets, ...specs }[hit];
    }
    return null;
  };
  const gemcut = val('gemcut');
  const notNA = (v) => (v && !/^n\/?a$/i.test(v) ? v : null);
  const shape = notNA(gemcut) || notNA(pick('Shape', 'Stone Cut'));
  const attributes = {
    metal: val('ga_metal') || pick('Metal'),
    gemstone: pick('Gemstone', 'Center Stone'),
    shape,
    style: pick('Setting', 'Style'),
    carat: pick('Carat Weight', 'Stone Weight'),
    stoneSize: pick('Stone Size'),
    metalWeight: pick('Metal Weight'),
    colour: pick('Colour', 'Color'),
    clarity: pick('Clarity'),
    bandWidth: pick('Band Width'),
  };
  for (const k of Object.keys(attributes)) if (!attributes[k]) delete attributes[k];

  // Images (originals), keeping the metal variant class when present
  const images = [];
  const seen = new Set();
  $('.product-single__image-item').each((_, el) => {
    const $el = $(el);
    const src = $el.find('img').first().attr('src') || $el.find('a[data-fancybox]').attr('href');
    const orig = src && originalImage(src);
    if (!orig || seen.has(orig)) return;
    seen.add(orig);
    const cls = ($el.attr('class') || '').split(/\s+/).find((c) => /^(yellowgold|whitegold|rosegold|platinum)(hide)?$/.test(c));
    images.push({ originalUrl: orig, metalVariant: cls ? cls.replace('hide', '') : null, alt: clean($el.find('img').first().attr('alt')) || null });
  });
  if (!images.length && ld.image) {
    for (const u of [].concat(ld.image)) {
      const orig = originalImage(u);
      if (orig && !seen.has(orig)) {
        seen.add(orig);
        images.push({ originalUrl: orig, metalVariant: null, alt: null });
      }
    }
  }

  return {
    id: sku,
    sku,
    title,
    category: item.category,
    url: item.url,
    price: { regular, sale, currency, byMetal: Object.keys(pricesByMetal).length ? pricesByMetal : undefined },
    attributes,
    description: clean(ld.description) || descriptionText.replace(/\n/g, ' '),
    details: { ...bullets, ...specs, ...(extraNote ? { note: extraNote } : {}) },
    images,
    ...(PENDANT_LISTINGS.includes(item.listing) ? pendantFields({ note: extraNote, attributes }) : {}),
    _prefix: item.prefix,
  };
}

/* ------------------------------- images -------------------------------- */

async function downloadImages(products) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const jobs = [];
  for (const p of products) {
    p.images.forEach((img, i) => {
      const ext = (path.extname(new URL(img.originalUrl).pathname) || '.jpg').toLowerCase();
      const safeSku = p.sku.replace(/[^A-Za-z0-9_-]/g, '_');
      img.file = `${p._prefix}-${safeSku}-${i + 1}${ext}`;
      img.localPath = `raw-assets/scraped-images/${img.file}`;
      jobs.push(img);
    });
  }
  let done = 0, ok = 0, skipped = 0, failed = 0;
  await pool(jobs, async (img) => {
    const dest = path.join(IMG_DIR, img.file);
    try {
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) skipped++;
      else {
        fs.writeFileSync(dest, await http(img.originalUrl, { binary: true }));
        ok++;
      }
    } catch (e) {
      failed++;
      img.error = e.message;
      img.localPath = null;
    }
    progress('images', ++done, jobs.length);
  });
  log(`  images: ${ok} downloaded, ${skipped} already present, ${failed} failed`);
}

/* -------------------------------- main --------------------------------- */

(async () => {
  const t0 = Date.now();
  log('1/4 Discovering products …');
  let items = await discover();
  if (LIMIT < items.length) items = items.slice(0, LIMIT);
  const byCat = items.reduce((m, i) => ((m[i.category] = (m[i.category] || 0) + 1), m), {});
  log(`  total: ${items.length}`, byCat);

  log('2/4 Scraping product pages …');
  const errors = [];
  let done = 0;
  const parsed = await pool(items, async (item) => {
    try {
      return parseProduct(await http(item.url), item);
    } catch (e) {
      errors.push({ url: item.url, error: e.message });
      return null;
    } finally {
      progress('products', ++done, items.length);
    }
  });
  const seenSku = new Set();
  const products = parsed.filter(Boolean).filter((p) => (seenSku.has(p.sku) ? false : seenSku.add(p.sku)));

  log('3/4 Downloading images …');
  if (SKIP_IMAGES) products.forEach((p) => p.images.forEach((i) => (i.localPath = null)));
  else await downloadImages(products);

  log('4/4 Writing JSON …');
  for (const p of products) delete p._prefix;
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify({ source: BASE, scrapedAt: new Date().toISOString(), count: products.length, products }, null, 2)
  );
  log(`  wrote ${path.relative(ROOT, OUT_JSON)} (${products.length} products)`);
  if (errors.length) log(`  ${errors.length} page errors:`, errors);
  log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
