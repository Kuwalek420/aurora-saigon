// Metal variants straight from the untouched original photos: only gold-hued pixels are remapped to
// white gold / rose gold / platinum. No cutout, no background removal, no added shadow.
// Also records where the centre stone sits (fractions of the photo) for the modal's magnifier.
// Usage: node scripts/recolor-originals.mjs
import fs from "node:fs";
import sharp from "sharp";
import { recolor, rgb2hsv } from "./lib/recolor.mjs";

const FILE = "src/data/products.json";
const OUT = "public/variants";
fs.mkdirSync(OUT, { recursive: true });
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const isImg = (i) => i.src && /\.(jpe?g|png|webp)$/i.test(i.src);
let nv = 0, nz = 0;

for (const p of data.products) {
  const img = p.images.find(isImg);
  if (!img) continue;
  const metals = Object.keys(img.gallery?.detail ?? {}).filter((m) => m !== "yellow");

  // --- stone zone, in the original photo's own coordinates (masks are read-only analysis here) ---
  const maskPath = `raw-assets/masks/${p.id}.png`;
  if (fs.existsSync(maskPath)) {
    const { data: px, info } = await sharp("public" + img.src).resize({ width: 1000, withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const alpha = await sharp(maskPath).resize(w, h, { fit: "fill" }).greyscale().raw().toBuffer();
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    let sx = 0, sy = 0, c = 0;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (alpha[y * w + x] < 200) continue;
        const k = (y * w + x) * 3;
        const [, s, v] = rgb2hsv(px[k], px[k + 1], px[k + 2]);
        if (v > 0.78 && s < 0.18) { sx += x; sy += y; c++; }
      }
    const cx = c > 250 ? sx / c : (x0 + x1) / 2, cy = c > 250 ? sy / c : (y0 + y1) / 2;
    const area = c > 250 ? c : (x1 - x0) * (y1 - y0) * 0.12;
    img.stoneZone = { x: +(cx / w).toFixed(3), y: +(cy / h).toFixed(3), r: +Math.min(0.3, Math.max(0.09, (Math.sqrt(area / Math.PI) * 1.15) / w)).toFixed(3) };
    nz++;
  }

  // --- recoloured originals ---
  if (metals.length) {
    const { data: rgb, info } = await sharp("public" + img.src).resize({ width: 1400, withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const out = { yellow: img.src };
    for (const m of metals) {
      const name = `${p.id}-${m}.webp`;
      await sharp(recolor(rgb, m), { raw: { width: info.width, height: info.height, channels: 3 } }).webp({ quality: 88, effort: 4 }).toFile(`${OUT}/${name}`);
      out[m] = `/variants/${name}`;
      nv++;
    }
    img.photoVariants = out;
  }
  // purge every trace of the cutout pipeline
  for (const k of ["card", "cardVariants", "cutoutArea", "stone"]) delete img[k];
}
fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log("variants written:", nv, "| stone zones:", nz);
