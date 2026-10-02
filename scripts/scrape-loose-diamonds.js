#!/usr/bin/env node
/**
 * Full specification of the stones the two diamond pages point to (Loose Lab Diamond Stone, Coloured Lab Grown Diamonds)
 * -> src/data/loose-diamonds.json, from the same live JSON endpoints as scrape-diamond-guide.js:
 *
 *   lab:   the cheapest stone in every matrix cell (shape x carat band x colour D/E/F x clarity VVS/VS), key "Round|2|E|VVS"
 *   fancy: the four lowest-priced stones per fancy colour
 *
 * Fields the live feed really has: carat, shape, colour, clarity, polish, measurements (L x W x D), fluorescence, ratio,
 * table / depth / crown / pavilion, price (VND), certificate lab + number, and `view360` (a 360-degree viewer page on the
 * live site's S3 bucket; only some stones have one). The feed has NO cut grade, NO mp4 and NO PDF link, so none is
 * stored: the certificate is verified through the lab's own site (lib/certificate.ts).
 *
 * Usage: node scripts/scrape-loose-diamonds.js [--limit-shapes 2]
 */
const fs = require("node:fs");
const path = require("node:path");

const ORIGIN = "https://aurorasaigon.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (o) => new URLSearchParams(o).toString();
const LIMIT = process.argv.includes("--limit-shapes") ? Number(process.argv[process.argv.indexOf("--limit-shapes") + 1]) : Infinity;

const SHAPES = ["Round", "Oval", "Emerald", "Radiant", "Pear", "Heart", "Cushion", "Marquise", "Princess"];
const SHAPE_ALIASES = { Cushion: ["Cushion", "Cushion Modified", "Cushion Brilliant"] };
const BANDS = [[0.5, 0.74], [0.75, 0.99], [1.0, 1.49], [1.5, 1.99], [2.0, 2.49], [2.5, 2.99], [3.0, 3.99], [4.0, 5.0]];
const COLOURS = ["D", "E", "F"];
const CLARITY = { VVS: ["VVS1", "VVS2"], VS: ["VS1", "VS2"] };
const FANCY = [["P", "Pink"], ["Y", "Yellow"], ["B", "Blue"], ["G", "Green"], ["O", "Orange"], ["optionPurple", "Purple"], ["GY", "Grey"], ["BN", "Brown"]];

async function api(endpoint, params) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await sleep(150);
      const r = await fetch(`${ORIGIN}/${endpoint}?${q(params)}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      const rows = JSON.parse(text.slice(text.indexOf("[")));
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
}

const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
/** One live record -> the stored stone. */
function stone(r, shape) {
  const m = String(r.Measurement || "").split("x").map((x) => Number(x));
  return {
    id: String(r.Id),
    shape,
    carat: num(r.CaratWeight),
    colour: r.ColourGrade || r.ColourDesc || null,
    colourDesc: r.ColourDesc || null,
    clarity: r.ClarityGrade || null,
    polish: r.Polish || null,
    fluorescence: r.Fluorescence || null,
    measurements: m.length === 3 && m.every(Number.isFinite) ? { l: m[0], w: m[1], d: m[2] } : null,
    ratio: num(r.Ratio),
    tablePct: num(r.TableD),
    depthPct: num(r.DepthPercent),
    crownHeight: num(r.CrownHeight),
    crownAngle: num(r.CrownAngle),
    pavilionDepth: num(r.PavilionDepth),
    pavilionAngle: num(r.PavilionAngle),
    price: r.PriceNotFormatted,
    cert: r.Certificate || null,
    certNo: r.CertificateNo || null,
    view360: r.DiamondVideo || null,
    // the 360 viewer is the live page https://labgrowns3.s3...amazonaws.com/stoneimages360.html?d=<stone id>; the id is its own (not the inventory Id)
    v360StoneId: (String(r.DiamondVideo || "").match(/[?&]d=([0-9]+)/) || [])[1] || null,
    v360IframeUrl: r.DiamondVideo || null,
  };
}

(async () => {
  const out = { source: ORIGIN, scrapedAt: new Date().toISOString(), currency: "VND", lab: {}, fancy: {} };
  let n = 0;
  for (const wanted of SHAPES.slice(0, LIMIT)) {
    let used = null;
    for (const name of SHAPE_ALIASES[wanted] ?? [wanted]) {
      let any = false;
      for (let b = 0; b < BANDS.length; b++) for (const col of COLOURS) for (const [cl, [c1, c2]] of Object.entries(CLARITY)) {
        const rows = await api("listShopLabDiamondCards2.php", { shape: name, minPrice: 0, maxPrice: 1e9, minct: BANDS[b][0], maxct: BANDS[b][1], minclarity: c1, maxclarity: c2, mincolour: col, maxcolour: col, order: "", page: 0 });
        if (rows.length) { out.lab[`${wanted}|${b}|${col}|${cl}`] = stone(rows[0], wanted); any = true; n++; }
      }
      if (any) { used = name; break; }
    }
    console.log(`lab ${wanted.padEnd(9)} ${used ? `as "${used}"` : "no stones"}`);
  }
  for (const [code, name] of FANCY) {
    const stones = [];
    for (const shape of SHAPES) {
      const rows = await api("listShopFancyColourLabDiamondCards.php", { shape, minPrice: 0, maxPrice: 1e9, minct: 0, maxct: 30, minclarity: "IF", maxclarity: "SI1", colour: code, order: "", page: 0 });
      for (const r of rows.slice(0, 3)) stones.push(stone(r, shape));
    }
    stones.sort((a, b) => a.price - b.price);
    out.fancy[name] = stones.slice(0, 4);
    console.log(`fancy ${name.padEnd(7)} ${out.fancy[name].length} stones`);
  }
  const all = [...Object.values(out.lab), ...Object.values(out.fancy).flat()];
  console.log(`\n${all.length} stones; with a 360 view: ${all.filter((s) => s.view360).length}; with certificate no: ${all.filter((s) => s.certNo).length}; with measurements: ${all.filter((s) => s.measurements).length}`);
  fs.writeFileSync(path.join(__dirname, "..", "src", "data", "loose-diamonds.json"), JSON.stringify(out));
  console.log("wrote src/data/loose-diamonds.json");
})().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
