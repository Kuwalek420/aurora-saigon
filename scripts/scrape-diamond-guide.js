/**
 * Snapshots two diamond price tables from the live inventory behind aurorasaigon.com/shop-lab-diamonds and
 * /fancy-coloured-lab-diamonds (the pages' own JSON endpoints, the same requests their search makes):
 *
 *   src/data/lab-diamond-prices.json   per shape x carat band x colour (D, E, F) x clarity group (VVS, VS):
 *                                      lowest price in stock (VND), how many stones, and the carat of that stone
 *   src/data/fancy-diamonds.json       per fancy colour: stones in stock, lowest price, a few real stones, lowest price per shape
 *
 *   node scripts/scrape-diamond-guide.js [--limit-shapes 2]   (a trial run)
 *
 * Nothing here is estimated: a cell with no stone in stock is simply absent. Prices are in VND exactly as the site lists them.
 * Re-run to refresh; the storefront shows the snapshot date.
 */
const fs = require("node:fs");
const path = require("node:path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const ORIGIN = "https://aurorasaigon.com";
const DELAY = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (o) => new URLSearchParams(o).toString();
const LIMIT = process.argv.includes("--limit-shapes") ? Number(process.argv[process.argv.indexOf("--limit-shapes") + 1]) : Infinity;

const SHAPES = ["Round", "Oval", "Emerald", "Radiant", "Pear", "Heart", "Cushion", "Marquise", "Princess"];
const SHAPE_ALIASES = { Cushion: ["Cushion", "Cushion Modified", "Cushion Brilliant"] };
const BANDS = [[0.5, 0.74], [0.75, 0.99], [1.0, 1.49], [1.5, 1.99], [2.0, 2.49], [2.5, 2.99], [3.0, 3.99], [4.0, 5.0]];
const CLARITY = { VVS: ["VVS1", "VVS2"], VS: ["VS1", "VS2"] };
const FANCY = [["P", "Pink"], ["Y", "Yellow"], ["B", "Blue"], ["G", "Green"], ["O", "Orange"], ["optionPurple", "Purple"], ["GY", "Grey"], ["BN", "Brown"]];

async function api(endpoint, params) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await sleep(DELAY);
      const r = await fetch(`${ORIGIN}/${endpoint}?${q(params)}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const rows = JSON.parse(await r.text());
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
}

const labQuery = (shape, [lo, hi], colour, [c1, c2]) => ({ shape, minPrice: 0, maxPrice: 1000000000, minct: lo, maxct: hi, minclarity: c1, maxclarity: c2, mincolour: colour, maxcolour: colour, order: "", page: 0 });

(async () => {
  // ---------------------------------------------------------------- lab diamonds
  const lab = { source: `${ORIGIN}/shop-lab-diamonds`, scrapedAt: new Date().toISOString(), currency: "VND", bands: BANDS, colours: ["D", "E", "F"], clarities: Object.keys(CLARITY), shapes: {} };
  let done = 0;
  for (const wanted of SHAPES.slice(0, LIMIT)) {
    let used = null;
    const cells = {};
    for (const name of SHAPE_ALIASES[wanted] ?? [wanted]) {
      let any = false;
      for (let b = 0; b < BANDS.length; b++) for (const col of lab.colours) for (const [cl, range] of Object.entries(CLARITY)) {
        const rows = await api("listShopLabDiamondCards2.php", labQuery(name, BANDS[b], col, range));
        if (rows.length) {
          const s = rows[0];
          cells[`${b}|${col}|${cl}`] = { p: s.PriceNotFormatted, n: Number(s.nRows) || rows.length, ct: Number(s.CaratWeight), cert: s.Certificate };
          any = true;
        }
      }
      if (any) { used = name; break; }
    }
    done++;
    console.log(`lab ${wanted.padEnd(9)} ${used ? `(as "${used}")` : "no stones"}: ${Object.keys(cells).length} of ${BANDS.length * 3 * 2} cells have stock  [${done}/${Math.min(SHAPES.length, LIMIT)}]`);
    if (used) lab.shapes[wanted] = cells;
  }
  fs.writeFileSync(path.join(__dirname, "..", "src", "data", "lab-diamond-prices.json"), JSON.stringify(lab));

  // ---------------------------------------------------------------- fancy colour diamonds
  const fancy = { source: `${ORIGIN}/fancy-coloured-lab-diamonds`, scrapedAt: lab.scrapedAt, currency: "VND", colours: [] };
  for (const [code, name] of FANCY) {
    const byShape = {};
    let total = 0;
    const stones = [];
    for (const shape of SHAPES) {
      const rows = await api("listShopFancyColourLabDiamondCards.php", { shape, minPrice: 0, maxPrice: 1000000000, minct: 0, maxct: 30, minclarity: "IF", maxclarity: "SI1", colour: code, order: "", page: 0 });
      if (!rows.length) continue;
      const n = Number(rows[0].nRows) || rows.length;
      total += n;
      byShape[shape] = { from: rows[0].PriceNotFormatted, n };
      for (const r of rows.slice(0, 3)) stones.push({ shape, carat: Number(r.CaratWeight), clarity: r.ClarityGrade, desc: r.ColourDesc, price: r.PriceNotFormatted, cert: r.Certificate });
    }
    stones.sort((a, b) => a.price - b.price);
    const prices = stones.map((s) => s.price);
    fancy.colours.push({ code, name, count: total, from: prices.length ? Math.min(...prices) : null, stones: stones.slice(0, 4), byShape });
    console.log(`fancy ${name.padEnd(7)} ${total} stones, from ${prices.length ? Math.min(...prices).toLocaleString("en") : "-"} VND`);
  }
  fs.writeFileSync(path.join(__dirname, "..", "src", "data", "fancy-diamonds.json"), JSON.stringify(fancy));
  console.log("\nWrote src/data/lab-diamond-prices.json and src/data/fancy-diamonds.json");
})().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
