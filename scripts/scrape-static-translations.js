#!/usr/bin/env node
/**
 * Vietnamese static pages from https://aurorasaigon.com -> src/data/static-vi.json
 *
 * The live site serves Vietnamese either at its own paths (/ve-chung-toi, /faq-vn, ...) or, for pages that share an
 * English path, after a language switch (/changelang?lang=vi sets a PHPSESSID cookie). Both are read here.
 * Every page is parsed into the same shape as its English twin in src/data/*.json so a page can render either one.
 * Text is stored exactly as published; images are NOT downloaded again (the Vietnamese pages use the same photos,
 * which the renderer takes from the English data by position).
 *
 * Usage: node scripts/scrape-static-translations.js
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE = 'https://aurorasaigon.com';
const DATA = path.resolve(__dirname, '..', 'src', 'data');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const en = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

let cookie = '';
async function startVietnameseSession() {
  const r = await fetch(`${BASE}/changelang?lang=vi&location=`, { headers: { 'User-Agent': UA }, redirect: 'manual' });
  cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error('no session cookie from /changelang');
}

async function load(p) {
  let err;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(BASE + p, { headers: { 'User-Agent': UA, Cookie: cookie }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const $ = cheerio.load(await res.text());
      if ($('html').attr('lang') !== 'vi') console.warn(`  ! ${p} did not come back as lang=vi`);
      $('script, style, noscript').remove();
      return $;
    } catch (e) {
      err = e;
      await sleep(500 * (i + 1));
    }
  }
  throw new Error(`${p}: ${err.message}`);
}

/** Text with source bold kept as **markers**. */
function richText($, $el) {
  const c = $el.clone();
  c.find('strong, b').each((_, b) => {
    const t = clean($(b).text());
    $(b).replaceWith(t ? `**${t}**` : '');
  });
  return clean(c.text()).split('****').join('');
}

function articleBlocks($, container) {
  const blocks = [];
  const seen = new Set();
  container.find('h2, h3, h4, h5, p, ul, ol').each((_, el) => {
    const $el = $(el);
    if ($el.closest('.button-mar').length) return;
    const t = el.tagName;
    if (t === 'ul' || t === 'ol') {
      if ($el.parents('ul, ol').length || seen.has(el)) return;
      seen.add(el);
      const items = $el.children('li').map((__, li) => richText($, $(li))).get().filter(Boolean);
      if (items.length) blocks.push({ type: t, items });
    } else if (t === 'p') {
      if ($el.parents('li').length) return;
      const text = richText($, $el);
      if (text) blocks.push({ type: 'p', text });
    } else {
      const text = clean($el.text());
      if (text) blocks.push({ type: t === 'h5' ? 'h4' : t, text });
    }
  });
  return blocks;
}

/** Same rule as scrape-content.js: short bold-only / numbered title lines are headings in the live markup. */
function boldLeadToHeading($, container) {
  container.find('p').each((_, p) => {
    const $p = $(p);
    const text = clean($p.text());
    const strong = clean($p.children('strong, b').first().text());
    const boldOnly = strong === text && text.length < 90 && !/[.!?:]$/.test(text);
    const numbered = text.length < 80 && /^\d+\.\s+\S/.test(text) && !/[.!?:;]$/.test(text);
    const titleLine = text.length < 60 && !/[d.!?:;,]/.test(text); // plain short title lines ("Phương Thức Thanh Toán")
    if (text && numbered) $p.replaceWith(`<h2>${text}</h2>`);
    else if (text && (boldOnly || titleLine)) $p.replaceWith(`<h3>${text}</h3>`);
  });
}

/* ---------------------------------- about ---------------------------------- */
async function about() {
  const $ = await load('/ve-chung-toi');
  const root = $('main').length ? $('main') : $('body');
  const title = clean(root.find('h1').first().text());
  const sections = [];
  let cur = null;
  const closing = [];
  for (const el of root.find('h1, h2, h3, p').toArray()) {
    const $el = $(el);
    if (el.tagName === 'h2') {
      cur = { heading: clean($el.text()), paragraphs: [] };
      sections.push(cur);
    } else if (el.tagName === 'h3') closing.push(clean($el.text()));
    else if (el.tagName === 'p' && cur && !closing.length) {
      const t = clean($el.text());
      if (t) cur.paragraphs.push(t);
    }
  }
  // the EN page turns "What We Believe" paragraphs ("Title. Explanation.") into a values list; do the same by position
  const enAbout = en('about.json');
  const bi = enAbout.sections.findIndex((s) => s.values);
  if (bi >= 0 && sections[bi]) {
    sections[bi].values = sections[bi].paragraphs.map((p) => {
      const i = p.indexOf('. ');
      return i > 0 ? { title: p.slice(0, i), text: p.slice(i + 2) } : { title: p, text: '' };
    });
    sections[bi].paragraphs = [];
  }
  if (sections.length !== enAbout.sections.length) console.warn(`  ! about: ${sections.length} VI sections vs ${enAbout.sections.length} EN`);

  // founder letter lives on the (Vietnamese) home page
  const $h = await load('/');
  const wrap = $h('.home-founder-section__wrapper').first();
  const content = wrap.find('.product-warranty-section__content').first();
  const paragraphs = (content.find('p').first().html() || '')
    .split(/<br\s*\/?>\s*<br\s*\/?>/i)
    .map((h) => clean(cheerio.load(`<p>${h}</p>`)('p').text()))
    .filter(Boolean);
  const last = paragraphs[paragraphs.length - 1] || '';
  const sig = last.match(/\s-\s*(\w+)\s*(.+)?$/);
  if (sig) paragraphs[paragraphs.length - 1] = last.slice(0, sig.index).trim();
  return { title, sections, closing, founderLetter: { heading: clean(content.find('h3').first().text()), paragraphs, signature: sig ? `- ${sig[1]}` : null, role: (sig && sig[2]) || '' } };
}

/* ------------------------------- five reasons ------------------------------- */
async function fiveReasons() {
  const $ = await load('/5-ly-do-tai-sao');
  const title = clean($('h1').first().text());
  const intro = clean($('.about_title').nextAll('.about_content').first().find('.article-container').first().text());
  const reasons = [];
  for (const el of $('.about_content').toArray()) {
    const body = $(el).find('.article-container').first();
    const heading = clean(body.find('h2').first().text());
    if (!heading) continue;
    const copy = body.clone();
    copy.find('h2').remove();
    reasons.push({ n: reasons.length + 1, heading, body: clean(copy.text()) });
  }
  return { title, intro, reasons };
}

/* -------------------------------- size guide -------------------------------- */
async function sizeGuide() {
  const $ = await load('/ring-size-guide');
  const wrap = $('.article-container').first();
  const ps = wrap.find('p').map((_, p) => clean($(p).text())).get();
  return {
    headings: wrap.find('h3').map((_, h) => clean($(h).text())).get(),
    considerations: wrap.find('ul li').map((_, li) => clean($(li).text())).get(),
    steps: ps.filter((t) => /^\d\.\s/.test(t)).map((t) => t.replace(/^\d\.\s*/, '')),
    conversionNote: ps.find((t) => /bảng quy đổi|conversion table/i.test(t)) || null,
    table: {
      columns: $('#ringSizeTable thead th').map((_, th) => clean($(th).text())).get(),
      rows: $('#ringSizeTable tbody tr').map((_, tr) => [$(tr).find('td').map((__, td) => clean($(td).text())).get()]).get(),
    },
  };
}

/* ---------------------------------- policies --------------------------------- */
async function policy(p, { bold = true } = {}) {
  const $ = await load(p);
  const container = $('main').first();
  container.find('form, nav, header, footer, .breadcrumb, .button-mar').remove();
  if (bold) boldLeadToHeading($, container);
  const h1 = clean(container.find('h1').first().text());
  const blocks = articleBlocks($, container).filter((b) => !(b.type === 'h1' || (b.type.startsWith('h') && b.text === h1)));
  return { title: h1, sourceUrl: BASE + p, blocks };
}

/* ------------------- ready-to-buy SEO text (home page block) ------------------- */
async function seo() {
  const $ = await load('/nhan-cau-hon-co-san');
  const els = $('main h3, main p').toArray();
  const start = els.findIndex((e) => e.tagName === 'h3');
  const end = els.findIndex((e) => /^Bạn đang tìm một kiểu dáng/.test(clean($(e).text())));
  const part = els.slice(start, end > start ? end : undefined).map((e) => ({ type: e.tagName === 'h3' ? 'h3' : 'p', text: clean($(e).text()) })).filter((b) => b.text);
  return { title: part[0].text, intro: part[1].text, blocks: part.slice(2) };
}

/* ----------------------------------- faq ----------------------------------- */
async function faq() {
  const $ = await load('/faq-vn');
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
    const answer = panel.children('.accordion-body').first().children('p, ul, ol').map((_, p) => clean($(p).text())).get().filter(Boolean);
    cat.items.push({ question: clean(btn.text()), answer });
  }
  return { title: clean($('h2').first().text()), categories: categories.filter((c) => c.items.length) };
}

(async () => {
  await startVietnameseSession();
  const out = { source: BASE, scrapedAt: new Date().toISOString() };
  const steps = [
    ['about', about],
    ['fiveReasons', fiveReasons],
    ['sizeGuide', sizeGuide],
    ['shippingReturns', () => policy('/vn/chinh-sach-doi-tra')],
    ['payment', () => policy('/payment-methods')],
    ['privacy', () => policy('/chinh-sach-bao-mat')],
    ['warranty', () => policy('/chinh-sach-bach-hanh')],
    ['gemstone', () => policy('/chinh-sach-nhan-da-tu-khach-hang')],
    ['faq', faq],
    ['seo', seo],
  ];
  for (const [key, fn] of steps) {
    out[key] = await fn();
    const v = out[key];
    console.log(key.padEnd(16), v.title ?? '', '|', v.blocks ? `${v.blocks.length} blocks` : v.sections ? `${v.sections.length} sections` : v.reasons ? `${v.reasons.length} reasons` : v.categories ? v.categories.map((c) => c.items.length).join('/') : 'ok');
  }
  fs.writeFileSync(path.join(DATA, 'static-vi.json'), JSON.stringify(out, null, 2));
  console.log('wrote src/data/static-vi.json');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
