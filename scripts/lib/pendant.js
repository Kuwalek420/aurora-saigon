/**
 * Pendant-specific fields, parsed from a product page's own text.
 * Every pendant on the live site carries one note of the form
 * "Chain: 16 Inches. The chain has the virtue of being adjustable to 18 Inches."
 * so the only lengths offered are the ones the note states (no other lengths exist to scrape).
 */
const INCH = /(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in\b|")/gi;

/** "Chain: 16 Inches ... adjustable to 18 Inches" -> ["16in", "18in"]. Empty when the page has no chain note. */
function parseChainLengths(note) {
  const text = String(note || '');
  if (!/chain/i.test(text)) return [];
  const out = [];
  for (const m of text.matchAll(INCH)) {
    const v = `${Number(m[1])}in`;
    if (!out.includes(v)) out.push(v);
  }
  return out.sort((a, b) => parseFloat(a) - parseFloat(b));
}

/** Pendant fields to merge into a product. `stoneSize` is the only dimension the site publishes. */
function pendantFields({ note, attributes }) {
  return {
    productType: 'pendant',
    chainLengths: parseChainLengths(note),
    pendantSize: (attributes && attributes.stoneSize) || null,
  };
}

module.exports = { parseChainLengths, pendantFields };
