// Builds the product-detail gallery assets.
//   detail : auto-generated macro frame, a tight crop around the centre stone (images[0].stoneZone) of the product's own photo,
//            upscaled and sharpened (recoloured per metal where the product has metal variants)
//   angles : up to 3 of the product's other original photos, resized for the web
// The gallery front view is the original photo (images[0].src / photoVariants); nothing is cut out.
// Usage: node scripts/build-gallery.mjs [limit] [id,id,...]
import fs from "node:fs";
import sharp from "sharp";
import { recolor } from "./lib/recolor.mjs";

const FILE = "src/data/products.json";
const OUT = "public/gallery";
const DETAIL = 1200;
const limit = process.argv[2] && /^\d+$/.test(process.argv[2]) ? Number(process.argv[2]) : Infinity;
const only = process.argv[3] ? new Set(process.argv[3].split(",")) : null;
fs.mkdirSync(OUT, { recursive: true });

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const isImg = (i) => i.src && /\.(jpe?g|png|webp)$/i.test(i.src);
// judged on the ORIGINAL file name: local names are renamed (ring-ID-n.jpg) and never reveal an info card
const isInfoCard = (i) => { const n = i.originalUrl.split("/").pop(); return /EN\.(webp|jpe?g|png)$/i.test(n) || /logo|banner|infographic|chart|size|guide|certificate|packag/i.test(n); };

let n = 0;
for (const p of data.products) {
  if (only && !only.has(p.id)) continue;
  const valid = p.images.filter(isImg);
  const hero = valid[0];
  if (!hero?.stoneZone) continue;
  if (n >= limit) break;
  try {
    // --- detail frame -----------------------------------------------------------------------
    const meta = await sharp("public" + hero.src).metadata();
    const W = 1000, H = Math.round((meta.height * W) / meta.width);
    const cx = hero.stoneZone.x * W, cy = hero.stoneZone.y * H;
    const side = Math.min(W, H) * 0.46;
    const left = Math.round(Math.min(Math.max(cx - side / 2, 0), W - side));
    const top = Math.round(Math.min(Math.max(cy - side / 2, 0), H - side));
    const k = meta.width / W; // map back to the full-resolution source
    const region = { left: Math.round(left * k), top: Math.round(top * k), width: Math.round(side * k), height: Math.round(side * k) };
    const crop = await sharp("public" + hero.src).extract(region).resize(DETAIL, DETAIL, { kernel: "lanczos3" }).sharpen({ sigma: 1.1, m1: 0.8, m2: 2 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });

    const metals = ["yellow", ...Object.keys(hero.photoVariants ?? {}).filter((m) => m !== "yellow")];
    const detail = {};
    for (const m of metals) {
      const name = m === "yellow" ? `${p.id}-detail.webp` : `${p.id}-detail-${m}.webp`;
      const buf = m === "yellow" ? crop.data : recolor(crop.data, m);
      await sharp(buf, { raw: { width: DETAIL, height: DETAIL, channels: 3 } }).webp({ quality: 84, effort: 4 }).toFile(`${OUT}/${name}`);
      detail[m] = `/gallery/${name}`;
    }

    // --- other real photographs -------------------------------------------------------------
    const angles = [];
    for (const img of valid.slice(1)) {
      if (angles.length >= 3) break;
      if (isInfoCard(img)) continue;
      const m = await sharp("public" + img.src).metadata();
      if (m.width < 500) continue;
      const name = `${p.id}-${angles.length + 1}.webp`;
      await sharp("public" + img.src).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile(`${OUT}/${name}`);
      angles.push(`/gallery/${name}`);
    }

    hero.gallery = { detail, angles };
    n++;
    if (n % 50 === 0) console.log("gallery:", n);
  } catch (e) {
    console.warn("skip", p.id, e.message);
  }
}
if (!only && !Number.isFinite(limit)) fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
else fs.writeFileSync("scripts/.gallery-sample.json", JSON.stringify(data, null, 2));
console.log("gallery built for", n);
