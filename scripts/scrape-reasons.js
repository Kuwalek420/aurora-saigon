#!/usr/bin/env node
/**
 * https://aurorasaigon.com/5reasonswhy -> src/data/five-reasons.json (+ images in public/content/reasons/)
 *
 * On the live page each reason's paragraph is a bare text node after its <h2>, not a <p>, which is why a
 * generic paragraph scrape misses the body copy entirely. This reads the text nodes directly.
 * Copy is stored verbatim; any wording corrections are applied at render time, never here.
 *
 * Usage: node scripts/scrape-reasons.js
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sharp = require('sharp');

const BASE = 'https://aurorasaigon.com';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'data', 'five-reasons.json');
const IMG_DIR = path.join(ROOT, 'public', 'content', 'reasons');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

async function get(url, binary = false) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.text();
}

/** ImageKit variants live behind "tr:..." path segments / ?tr= queries; the original has neither. */
function original(src) {
  const u = new URL(src, BASE);
  u.search = '';
  u.pathname = u.pathname.replace(/\/tr:[^/]+/, '');
  return u.toString();
}

/** Download once, store as WebP <= 1800px wide, return the public path. */
async function save(url) {
  const base = decodeURIComponent(path.basename(new URL(url).pathname)).replace(/\.[A-Za-z0-9]+$/, '').replace(/[^A-Za-z0-9._-]/g, '_');
  const file = `${base}.webp`;
  const dest = path.join(IMG_DIR, file);
  if (!(fs.existsSync(dest) && fs.statSync(dest).size > 0)) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    fs.writeFileSync(dest, await sharp(await get(url, true)).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
  }
  return `/content/reasons/${file}`;
}

(async () => {
  const html = await get(`${BASE}/5reasonswhy`);
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();

  const title = clean($('h1').first().text());
  const intro = clean($('.about_title').nextAll('.about_content').first().find('.article-container').first().text());

  // the hero banner is a CSS background image
  const bannerUrl = (html.match(/main-img\s*\{[^}]*?url\(([^)]+)\)/) || [])[1];

  const reasons = [];
  for (const el of $('.about_content').toArray()) {
    const $el = $(el);
    const body = $el.find('.article-container').first();
    const heading = clean(body.find('h2').first().text());
    if (!heading) continue; // the intro block has no heading
    const copy = body.clone();
    copy.find('h2').remove();
    const img = $el.find('img').first();
    // photo side as the live page lays it out: an "order-md-2" photo column sits on the right
    const imageSide = $el.find('[class*="order-md-2"] img').length ? 'right' : 'left';
    reasons.push({
      n: reasons.length + 1,
      heading,
      body: clean(copy.text()),
      image: { src: await save(original(img.attr('src'))), alt: clean(img.attr('alt')) },
      imageSide,
    });
  }

  const data = {
    source: `${BASE}/5reasonswhy`,
    scrapedAt: new Date().toISOString(),
    title,
    intro,
    banner: bannerUrl ? { src: await save(original(bannerUrl.replace(/['"]/g, ''))), alt: '' } : null,
    reasons,
  };
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`wrote ${path.relative(ROOT, OUT)}: "${title}", intro ${intro.length} chars, banner ${data.banner ? 'yes' : 'no'}`);
  for (const r of reasons) console.log(`  ${r.n}. ${r.heading} | ${r.body.length} chars | photo ${r.imageSide} | ${r.image.src}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
