// Gives every angle photo a white-gold / rose-gold / platinum twin so the gallery follows the selected metal.
// Same gold-hued-pixels-only recolour as the front photos; photos that contain skin (hands, models) are skipped, and the modal
// simply omits those angles for non-native finishes instead of showing the wrong metal.
// Usage: node scripts/recolor-angles.mjs [limit]
import fs from "node:fs";
import sharp from "sharp";
import { recolor, skinShare } from "./lib/recolor.mjs";

const FILE = "src/data/products.json";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const limit = process.argv[2] ? Number(process.argv[2]) : Infinity;
let made = 0, skipped = 0, done = 0;

for (const p of data.products) {
  const img = p.images.find((i) => i.gallery);
  const metals = Object.keys(img?.photoVariants ?? {}).filter((m) => m !== "yellow");
  if (!img || !metals.length || !img.gallery.angles.length) continue;
  if (done >= limit) break;
  const angleVariants = Object.fromEntries(metals.map((m) => [m, []]));
  for (const src of img.gallery.angles) {
    const { data: rgb, info } = await sharp("public" + src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const skin = skinShare(rgb) > 0.03;
    for (const m of metals) {
      if (skin) { angleVariants[m].push(null); skipped++; continue; }
      const out = src.replace(/\.webp$/, `-${m}.webp`);
      await sharp(recolor(rgb, m), { raw: { width: info.width, height: info.height, channels: 3 } }).webp({ quality: 80, effort: 3 }).toFile("public" + out);
      angleVariants[m].push(out);
      made++;
    }
  }
  img.gallery.angleVariants = angleVariants;
  done++;
  if (done % 25 === 0) console.log("products:", done, "files:", made, "skipped:", skipped);
}
fs.writeFileSync(Number.isFinite(limit) ? "scripts/.angles-sample.json" : FILE, JSON.stringify(data, null, 2));
console.log("angle twins:", made, "| skipped (skin/model shots):", skipped, "| products:", done);
