#!/usr/bin/env node
/**
 * Content pages from https://aurorasaigon.com:
 *   /about            -> src/data/about.json
 *   /faq              -> src/data/faq.json
 *   /ring-size-guide  -> src/data/size-guide.json
 *   /blog/news (+ each /blog/<slug>) -> src/data/blog.json
 *   shipping, returns, payment, privacy, warranty, gemstone, 5-reasons, contact facts -> src/data/policies.json
 * (/blog itself is a 404 on the live site; the journal index lives at /blog/news.)
 * Images are downloaded at original resolution into public/content/{about,blog}/.
 * Text is stored as plain structured blocks (no HTML), exactly as published.
 *
 * Usage: node scripts/scrape-content.js [--no-images]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const sharp = require('sharp');

const BASE = 'https://aurorasaigon.com';
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'src', 'data');
const PUBLIC = path.join(ROOT, 'public', 'content');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const SKIP_IMAGES = process.argv.includes('--no-images');

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(url, { binary = false, retries = 3 } = {}) {
  let err;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
    } catch (e) {
      err = e;
      await sleep(400 * (i + 1));
    }
  }
  throw new Error(`${url}: ${err.message}`);
}

const load = async (p) => {
  const $ = cheerio.load(await http(BASE + p));
  $('script, style, noscript').remove();
  return $;
};

/** Text of an element with source bold kept as **markers**, which the site renders as <strong>. */
function richText($, $el) {
  const c = $el.clone();
  c.find('strong, b').each((_, b) => {
    const t = clean($(b).text());
    $(b).replaceWith(t ? `**${t}**` : '');
  });
  return clean(c.text()).split('****').join('');
}

/** ImageKit serves resized variants via a "tr:..." path segment or ?tr= query; strip both for the original. */
function originalImage(src) {
  if (!src) return null;
  const u = new URL(src, BASE);
  u.search = '';
  u.pathname = u.pathname.replace(/\/tr:[^/]+/, '');
  return u.toString();
}

const imgSrc = ($el) => originalImage($el.attr('src') || $el.attr('data-src'));

/** Downloads once, resizes to at most 1800px wide and stores as WebP (originals run to several MB); returns the public URL path. */
async function save(url, folder, prefix = '') {
  if (!url) return null;
  const base = decodeURIComponent(path.basename(new URL(url).pathname)).replace(/.[A-Za-z0-9]+$/, '').replace(/[^A-Za-z0-9._-]/g, '_');
  const file = `${prefix ? `${prefix}-` : ''}${base}.webp`;
  const dir = path.join(PUBLIC, folder);
  const dest = path.join(dir, file);
  if (!SKIP_IMAGES && !(fs.existsSync(dest) && fs.statSync(dest).size > 0)) {
    fs.mkdirSync(dir, { recursive: true });
    const buf = await http(url, { binary: true });
    fs.writeFileSync(dest, await sharp(buf).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer());
  }
  return `/content/${folder}/${file}`;
}

const write = (name, data) => {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, name), JSON.stringify({ source: BASE, scrapedAt: new Date().toISOString(), ...data }, null, 2));
  console.log('  wrote src/data/' + name);
};

/** The founder's "Brand & Values" letter lives on the live home page (/index), not on /about. */
async function founderLetter() {
  const $ = cheerio.load(await http(BASE + '/index'));
  const wrap = $('.home-founder-section__wrapper').first();
  const content = wrap.find('.product-warranty-section__content').first();
  const paragraphs = (content.find('p').first().html() || '')
    .split(/<br\s*\/?>\s*<br\s*\/?>/i)
    .map((h) => clean(cheerio.load(`<p>${h}</p>`)('p').text()))
    .filter(Boolean);
  // the trailing "- Nick" signature is its own line in the last block
  const last = paragraphs[paragraphs.length - 1] || '';
  const sig = last.match(/\s-\s*(\w+)\s*(Founder of .+)?$/);
  if (sig) paragraphs[paragraphs.length - 1] = last.slice(0, sig.index).trim();
  const role = (sig && sig[2]) || '';
  const img = wrap.find('img').first();
  const src = await save(imgSrc(img), 'about');
  return {
    heading: clean(content.find('h3').first().text()),
    paragraphs,
    signature: sig ? `- ${sig[1]}` : null,
    role,
    image: src ? { src, alt: clean(img.attr('alt')) } : null,
  };
}

/* --------------------------------- about --------------------------------- */

async function about() {
  const $ = await load('/about');
  const root = $('main').length ? $('main') : $('body');
  const title = clean(root.find('h1').first().text());
  let pendingImg = null;
  let heroImage = null;
  const sections = [];
  let cur = null;
  const closing = [];

  for (const el of root.find('h1, h2, h3, p, img').toArray()) {
    const $el = $(el);
    const tag = el.tagName;
    if (tag === 'img') {
      const src = imgSrc($el);
      if (src) pendingImg = { src, alt: clean($el.attr('alt')) };
    } else if (tag === 'h2') {
      cur = { id: clean($el.text()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), heading: clean($el.text()), paragraphs: [], image: pendingImg };
      pendingImg = null;
      sections.push(cur);
    } else if (tag === 'h3') {
      closing.push(clean($el.text()));
    } else if (tag === 'p' && cur && !closing.length) {
      const t = clean($el.text());
      if (t) cur.paragraphs.push(t);
    }
  }
  // the image before the first heading doubles as the page's lead image
  heroImage = sections[0]?.image ?? null;

  // "What We Believe" paragraphs read "Title sentence. Explanation." -> a values list
  const belief = sections.find((s) => /what we believe/i.test(s.heading));
  if (belief) {
    belief.values = belief.paragraphs.map((p) => {
      const i = p.indexOf('. ');
      return i > 0 ? { title: p.slice(0, i), text: p.slice(i + 2) } : { title: p, text: '' };
    });
    belief.paragraphs = [];
  }

  for (const s of sections) if (s.image) s.image.src = await save(s.image.src, 'about');
  const letter = await founderLetter();
  write('about.json', { title, heroImage: sections[0]?.image ?? heroImage, sections, closing, founderLetter: letter });
  console.log(`  about: ${sections.length} sections, ${sections.filter((s) => s.image).length} images`);
}

/* ---------------------------------- faq ---------------------------------- */

async function faq() {
  const $ = await load('/faq');
  // The live markup nests accordion items inside each other (unclosed divs), so walk in document order:
  // an h3 starts a category, each .accordion-header is one question, and its button's aria-controls
  // names the panel that holds that question's own answer.
  const categories = [];
  for (const el of $('h3, .accordion-header').toArray()) {
    const $el = $(el);
    if (el.tagName === 'h3') {
      categories.push({ name: clean($el.text()), items: [] });
      continue;
    }
    const cat = categories[categories.length - 1];
    if (!cat) continue;
    const btn = $el.find('.accordion-button').first();
    btn.find('svg').remove();
    const panel = $('#' + btn.attr('aria-controls')).first();
    const answer = panel
      .children('.accordion-body')
      .first()
      .children('p, ul, ol')
      .map((_, p) => clean($(p).text()))
      .get()
      .filter(Boolean);
    cat.items.push({ question: clean(btn.text()), answer });
  }
  write('faq.json', { title: clean($('h2').first().text()), categories: categories.filter((c) => c.items.length) });
  console.log('  faq:', categories.map((c) => `${c.name} ${c.items.length}`).join(', '));
}

/* ------------------------------ ring size guide ----------------------------- */

async function sizeGuide() {
  const $ = await load('/ring-size-guide');
  const wrap = $('.article-container').first();
  const considerations = wrap.find('ul li').map((_, li) => clean($(li).text())).get();
  const steps = wrap
    .find('p')
    .map((_, p) => clean($(p).text()))
    .get()
    .filter((t) => /^\d\.\s/.test(t))
    .map((t) => t.replace(/^\d\.\s*/, ''));
  const headings = wrap.find('h3').map((_, h) => clean($(h).text())).get();
  const note = wrap
    .find('p')
    .map((_, p) => clean($(p).text()))
    .get()
    .find((t) => /conversion table/i.test(t));
  const pdfHref = wrap.find('a[href$=".pdf"]').first().attr('href') || null;
  // keep the printable guide on our own domain
  let pdf = pdfHref;
  if (pdfHref && !SKIP_IMAGES) {
    fs.mkdirSync(PUBLIC, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC, 'ring-size-guide.pdf'), await http(new URL(pdfHref, BASE).toString(), { binary: true }));
    pdf = '/content/ring-size-guide.pdf';
  }
  const columns = $('#ringSizeTable thead th').map((_, th) => clean($(th).text())).get();
  const rows = $('#ringSizeTable tbody tr')
    .map((_, tr) => [$(tr).find('td').map((__, td) => clean($(td).text())).get()])
    .get();
  write('size-guide.json', { headings, considerations, steps, conversionNote: note || null, pdf, table: { columns, rows } });
  console.log(`  size guide: ${considerations.length} tips, ${steps.length} steps, ${rows.length} rows`);
}

/* ----------------------------------- blog ----------------------------------- */

const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
function isoDate(s) {
  const m = clean(s).match(/(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})/);
  return m ? new Date(Date.UTC(+m[3], MONTHS[m[2].toUpperCase()], +m[1])).toISOString().slice(0, 10) : null;
}

/** Article body as ordered blocks: h2/h3/h4, p, ul/ol (items), img. */
function articleBlocks($, container, slug) {
  const blocks = [];
  const seenLists = new Set();
  container.find('h2, h3, h4, h5, p, ul, ol, img').each((_, el) => {
    const $el = $(el);
    if ($el.closest('.button-mar').length) return;
    // prev/next teasers: a heading or paragraph that is nothing but a link to another post
    if ($el.find('a[href*="/blog/"]').length && clean($el.text()) === clean($el.find('a').first().text())) return;
    const t = el.tagName;
    if (t === 'img') {
      const src = imgSrc($el);
      if (src && !/logo|icon|sprite/i.test(src)) blocks.push({ type: 'img', src, alt: clean($el.attr('alt')) });
    } else if (t === 'ul' || t === 'ol') {
      if ($el.parents('ul, ol').length || seenLists.has(el)) return;
      seenLists.add(el);
      const items = $el.children('li').map((__, li) => richText($, $(li))).get().filter(Boolean);
      const tocOnly = $el.find('li').length && $el.find('li').toArray().every((li) => $(li).find('a[href^="#"]').length && clean($(li).text()) === clean($(li).find('a').first().text()));
      if (items.length && !tocOnly) blocks.push({ type: t, items });
    } else if (t === 'p') {
      if ($el.parents('li').length) return;
      const text = richText($, $el);
      if (text) blocks.push({ type: 'p', text });
    } else {
      const text = clean($el.text());
      if (text && !/^contents$/i.test(text)) blocks.push({ type: t === 'h5' ? 'h4' : t, text });
    }
  });
  return blocks;
}

async function blog() {
  const $ = await load('/blog/news');
  const list = $('.blog-list__item')
    .map((_, it) => {
      const $it = $(it);
      const href = $it.find('.blog-list__item-title a').attr('href') || '';
      return {
        slug: href.split('/').filter(Boolean).pop(),
        title: clean($it.find('.blog-list__item-title').text()),
        date: isoDate($it.find('.blog-list__item-meta__date').text()),
        dateLabel: clean($it.find('.blog-list__item-meta__date').text()),
        excerpt: clean($it.find('.blog-list__item-content p').first().text()),
        coverSrc: imgSrc($it.find('img').first()),
        coverAlt: clean($it.find('img').first().attr('alt')),
        url: new URL(href, BASE).toString(),
      };
    })
    .get();

  const posts = [];
  for (const p of list) {
    const $p = await load(`/blog/${p.slug}`);
    const container = $p('.blog-single').first();
    const blocks = articleBlocks($p, container, p.slug);
    // drop the page's own H1 if it was repeated as a heading block
    const h1 = clean($p('h1').first().text());
    const body = blocks.filter((b) => !(b.type.startsWith('h') && b.text === h1));
    for (const b of body) if (b.type === 'img') b.src = await save(b.src, 'blog', p.slug);
    const cover = await save(p.coverSrc, 'blog', p.slug);
    posts.push({
      slug: p.slug,
      title: p.title,
      headline: h1 || p.title,
      date: p.date,
      dateLabel: p.dateLabel,
      excerpt: p.excerpt,
      cover: cover ? { src: cover, alt: p.coverAlt } : null,
      sourceUrl: p.url,
      body,
    });
    console.log(`  ${p.slug}: ${body.length} blocks (${body.filter((b) => b.type === 'p').length} paragraphs, ${body.filter((b) => b.type === 'img').length} images)`);
  }
  write('blog.json', { index: '/blog/news', posts });
}

/* -------------------------------- policy pages -------------------------------- */

/** Live page -> our route. Shipping and returns are two live pages shown together on one route. */
const POLICY_SOURCES = [
  { key: 'shipping', path: '/shipping-and-delivery', title: 'Shipping Policy' },
  { key: 'returns', path: '/en/returns-policy', title: 'Returns Policy' },
  { key: 'payment', path: '/payment-methods', title: 'Purchase Process & Payment Methods' },
  { key: 'privacy', path: '/privacy-policy', title: 'Privacy Policy' },
  { key: 'warranty', path: '/warranty-policy', title: 'Lifetime Jewellery Warranty & Care Policy' },
  { key: 'gemstone', path: '/customer-supplied-gemstone-policy', title: 'Customer-Supplied Gemstone Policy' },
];

/** A short paragraph that is only bold text is a sub-heading in the live markup. */
function boldLeadToHeading($, container) {
  container.find('p').each((_, p) => {
    const $p = $(p);
    const text = clean($p.text());
    const strong = clean($p.children('strong, b').first().text());
    // a bold-only line ending in a colon ("What's Covered:") labels what follows; it stays a bold run-in paragraph
    const boldOnly = strong === text && text.length < 90 && !/[.!?:]$/.test(text);
    // plain short title lines ("Check-out Process"): no digits, no sentence punctuation
    const titleLine = text.length < 60 && !/[\d.!?:;]/.test(text);
    // "3. Insurance and Liability": numbered clause titles are the document's top-level sections
    const numbered = text.length < 80 && /^\d+\.\s+\S/.test(text) && !/[.!?:;]$/.test(text);
    if (text && numbered) $p.replaceWith(`<h2>${text}</h2>`);
    else if (text && (boldOnly || titleLine)) $p.replaceWith(`<h3>${text}</h3>`);
  });
}

async function policies() {
  const pages = {};
  for (const src of POLICY_SOURCES) {
    const $ = await load(src.path);
    const container = $('main').first();
    container.find('form, nav, header, footer, .breadcrumb, .button-mar').remove();
    boldLeadToHeading($, container);
    const h1 = clean(container.find('h1').first().text());
    const blocks = articleBlocks($, container, src.key).filter((b) => !(b.type.startsWith('h') && (b.text === h1 || b.text === src.title)));
    for (const b of blocks) if (b.type === 'img') b.src = await save(b.src, 'policies', src.key);
    pages[src.key] = { title: src.title, sourceUrl: BASE + src.path, blocks };
    console.log(`  ${src.key}: ${blocks.length} blocks (${blocks.filter((b) => b.type === 'p').length} p, ${blocks.filter((b) => b.type.startsWith('h')).length} headings, ${blocks.filter((b) => b.type === 'img').length} img)`);
  }

  // Payment: split the run-on "Bank: ... Account holder's name: ... Account No.: ..." into fields, and restore
  // the first heading, which the live markup puts outside the content block.
  const pay = pages.payment;
  const bankIdx = pay.blocks.findIndex((b) => b.type === 'p' && /Account No/i.test(b.text));
  if (bankIdx >= 0) {
    const m = pay.blocks[bankIdx].text.match(/^(.*?)\s*Bank:\s*(.+?)\s*Account holder's name:\s*(.+?)\s*Account No\.?:\s*(\S+)/i);
    if (m) {
      pay.blocks[bankIdx].text = m[1];
      pay.bank = { bank: m[2], accountHolder: m[3], accountNo: m[4] };
    }
  }
  const firstP = pay.blocks.findIndex((b) => b.type === 'p');
  if (firstP >= 0 && /^Explore our products/i.test(pay.blocks[firstP].text)) pay.blocks.splice(firstP, 0, { type: 'h3', text: 'Adding to Cart' });

  // Contact: only the facts (hours, reply time); the live page is mostly forms
  const $c = await load('/contact');
  const text = clean($c('main').text());
  const hours = (text.match(/opening times are from (.+?\d\.\d\dpm)/i) || [])[1] || null;
  const reply = (text.match(/within (\d+) hours/i) || [])[1] || null;
  const returnsNote = (text.match(/PLEASE NOTE that ([^.]+)\./i) || [])[1] || null;
  write('policies.json', { pages, contact: { hours, replyWithinHours: reply ? Number(reply) : null, returnsNote } });
  console.log('  contact:', { hours, reply, returnsNote });
}

(async () => {
  console.log('about');
  await about();
  console.log('faq');
  await faq();
  console.log('size guide');
  await sizeGuide();
  console.log('blog');
  await blog();
  console.log('policies');
  await policies();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
