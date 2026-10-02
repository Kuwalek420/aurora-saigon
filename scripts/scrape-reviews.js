#!/usr/bin/env node
/**
 * Aurora Saigon's Google reviews -> src/data/google-reviews.json
 *
 * Source: the two public JSON endpoints behind the Google Reviews widget that aurorasaigon.com itself embeds
 * (service-reviews-ultimate.elfsight.com, keyed by the business's Google place ID). The place ID and the
 * "5 stars only" filter come from that widget's own configuration. Google Maps is not scraped.
 * Nothing is written, edited or invented: names, dates and text are exactly as Google published them.
 *
 * Google has no "category" or "verified purchase" field. `category` is derived from keywords in the review text and is
 * null when the text does not say clearly (the UI shows it only when present).
 *
 * Usage: node scripts/scrape-reviews.js
 */
const fs = require('fs');
const path = require('path');

const PLACE_ID = 'ChIJL2kFlfIndTERLJaIne8M6XQ';
const API = 'https://service-reviews-ultimate.elfsight.com/data';
const OUT = path.resolve(__dirname, '..', 'src', 'data', 'google-reviews.json');
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36', Origin: 'https://aurorasaigon.com', Referer: 'https://aurorasaigon.com/' };

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const j = await res.json();
  if (j.status !== 'success') throw new Error(`${url}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.result.data;
}

const isVietnamese = (t) => /[ăâđêôơưĂÂĐÊÔƠƯẠ-ỹ]/.test(t);

/** First sentence-ending boundary at or before `max` characters; falls back to a word boundary. */
function excerptOf(text, max = 240) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (stop > max * 0.5) return cut.slice(0, stop + 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\-–]$/, '') + '…';
}

/** Conservative keyword read of what the review is about; null when it is not clear. */
function categoryOf(text) {
  const t = text.toLowerCase();
  if (/engagement|proposal|propos|fianc|girlfriend|future wife|nhẫn cầu hôn|nhẫn đính hôn/.test(t)) return 'Engagement Ring';
  if (/wedding (band|ring)|nhẫn cưới|\bbands?\b/.test(t)) return 'Wedding Bands';
  if (/custom|bespoke|my design|3d print|made to order|thiết kế/.test(t)) return 'Custom Design';
  if (/pendant|necklace|earring|bracelet|dây chuyền|bông tai/.test(t)) return 'Fine Jewellery';
  return null;
}

(async () => {
  const [source] = await getJson(`${API}/sources?uris%5B%5D=${PLACE_ID}`);
  const raw = await getJson(`${API}/reviews?uris%5B%5D=${PLACE_ID}&filter_content=text_required&min_rating=5&page_length=100&order=date`);

  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const reviews = raw
    .filter((r) => r.rating === 5 && r.text && r.text.trim())
    .sort((a, b) => b.published_at - a.published_at)
    .map((r, i) => {
      const fullText = r.text.replace(/\r/g, '').trim();
      const published = new Date(r.published_at * 1000);
      const vi = isVietnamese(fullText);
      return {
        id: `review-${i + 1}`,
        author: r.reviewer_name,
        rating: r.rating,
        date: published.toISOString().slice(0, 10),
        dateLabel: month.format(published),
        excerpt: excerptOf(fullText),
        fullText,
        category: categoryOf(fullText),
        language: vi ? 'vi' : 'en',
        googleUrl: r.url,
      };
    });

  // Featured for the site: English, a real paragraph (not a one-liner, not an essay), most recent first.
  let featured = 0;
  for (const r of reviews) {
    r.featured = r.language === 'en' && r.fullText.length >= 120 && r.fullText.length <= 700 && featured < 12;
    if (r.featured) featured++;
  }

  const data = {
    source: 'Google reviews via the widget embedded on aurorasaigon.com',
    scrapedAt: new Date().toISOString(),
    business: {
      name: source.meta.name,
      address: source.meta.address,
      rating: source.rating,
      reviewCount: source.reviews_number,
      placeId: PLACE_ID,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${PLACE_ID}`,
    },
    reviews,
  };
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));

  const cats = {};
  reviews.forEach((r) => (cats[r.category ?? 'none'] = (cats[r.category ?? 'none'] || 0) + 1));
  console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
  console.log(`  ${data.business.name}: rating ${data.business.rating}, ${data.business.reviewCount} reviews on Google`);
  console.log(`  captured ${reviews.length} five-star reviews with text (${reviews.filter((r) => r.language === 'en').length} English, ${featured} featured)`);
  console.log('  categories:', cats);
  console.log(`  newest ${reviews[0].date} (${reviews[0].author}), oldest ${reviews[reviews.length - 1].date}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
