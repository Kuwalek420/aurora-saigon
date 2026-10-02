// Re-selects each product's gallery angles from real photographs only. Marketing/info cards (stone-meaning
// graphics such as "peridotEN.webp", logos, banners) are recognised by the ORIGINAL file name and skipped;
// angles are backfilled from the product's remaining photos, and their metal twins are regenerated.
// Usage: node scripts/fix-gallery-angles.mjs
import fs from "node:fs";
import sharp from "sharp";
import { recolor, skinShare } from "./lib/recolor.mjs";

const FILE = "src/data/products.json";
const GAL = "public/gallery";
const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
const isImg = (i) => i.src && /\.(jpe?g|png|webp)$/i.test(i.src);
const isInfoCard = (i) => {
  const name = i.originalUrl.split("/").pop();
  return /EN\.(webp|jpe?g|png)$/i.test(name) || /logo|banner|infographic|chart|size|guide|certificate|packag/i.test(name);
};
let fixed = 0, removedSlots = 0;

for (const p of data.products) {
  const hero = p.images.find((i) => i.gallery);
  if (!hero) continue;
  const valid = p.images.filter(isImg);
  const pool = valid.slice(1); // valid[0] is the hero photo

  // which angles would a correct selection produce?
  const wanted = [];
  for (const img of pool) {
    if (wanted.length >= 3) break;
    if (isInfoCard(img)) continue;
    const m = await sharp("public" + img.src).metadata();
    if (m.width < 500) continue;
    wanted.push(img);
  }
  // were any of the currently-built angles info cards? (the old selection ignored infoCard)
  const old = [];
  for (const img of pool) { if (old.length >= 3) break; const m = await sharp("public" + img.src).metadata(); if (m.width < 500) continue; old.push(img); }
  const bad = old.filter(isInfoCard).length;
  if (!bad) continue;
  removedSlots += bad;

  // wipe this product's angle files (originals + twins) and rebuild
  for (const f of fs.readdirSync(GAL)) if (new RegExp(`^${p.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[123](-(white|rose|platinum))?\\.webp$`).test(f)) fs.unlinkSync(`${GAL}/${f}`);
  const metals = Object.keys(hero.photoVariants ?? {}).filter((m) => m !== "yellow");
  const angles = [];
  const variants = Object.fromEntries(metals.map((m) => [m, []]));
  for (const img of wanted) {
    const n = angles.length + 1;
    const out = `/gallery/${p.id}-${n}.webp`;
    await sharp("public" + img.src).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toFile("public" + out);
    angles.push(out);
    if (metals.length) {
      const { data: rgb, info } = await sharp("public" + out).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const skin = skinShare(rgb) > 0.03;
      for (const m of metals) {
        if (skin) { variants[m].push(null); continue; }
        const twin = out.replace(/\.webp$/, `-${m}.webp`);
        await sharp(recolor(rgb, m), { raw: { width: info.width, height: info.height, channels: 3 } }).webp({ quality: 80, effort: 3 }).toFile("public" + twin);
        variants[m].push(twin);
      }
    }
  }
  hero.gallery.angles = angles;
  if (metals.length) hero.gallery.angleVariants = variants; else delete hero.gallery.angleVariants;
  fixed++;
  if (fixed % 25 === 0) console.log("fixed", fixed);
}
fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
console.log("products repaired:", fixed, "| graphic slots replaced:", removedSlots);
