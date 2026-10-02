#!/usr/bin/env node
/**
 * On-hand videos for the Ready to Ship pieces (live aurorasaigon.com product pages).
 *
 * For every ready-to-ship piece in src/data/products.json:
 *   1. reads its live product page; if it carries an mp4 (8 of the 29 do), downloads the original,
 *      re-encodes it (960 px, H.264, no audio track: it is only ever played muted) and cuts a cover frame;
 *   2. uploads both to Supabase Storage (bucket product-images, folder videos/);
 *   3. records them on the piece in products.json (images[0].gallery.videoUrl / videoPoster) so the JSON fallback and a
 *      future migration carry them (backup: raw-assets/products.pre-video.json);
 *   4. checks that every live gallery photo is already in our data (reports any that is not);
 *   5. updates ONLY `gallery` and `images` of the 29 ready-to-ship rows in Supabase: video added, and the order is
 *      main photo, other angles, metal renditions, video cover, macro stone close-ups last. Prices, sold flags and
 *      every other admin edit are not touched.
 *
 * Needs ffmpeg on PATH and NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local).
 * Usage: node scripts/scrape-ready-to-ship-media.js [--no-db]
 */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const { toRow } = require("../src/lib/product-rows.ts");

const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "src", "data", "products.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const NO_DB = process.argv.includes("--no-db");
const BUCKET = "product-images";

for (const l of fs.existsSync(path.join(ROOT, ".env.local")) ? fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/) : []) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

/** ImageKit variants hide behind "tr:..." path segments and ?tr= queries; the original has neither. */
const original = (u) => {
  const x = new URL(u, "https://aurorasaigon.com");
  x.search = "";
  x.pathname = x.pathname.replace(/\/tr:[^/]+/, "");
  return x.toString();
};
const base = (u) => decodeURIComponent(path.basename(new URL(u, "https://aurorasaigon.com").pathname)).replace(/\.[A-Za-z0-9]+$/, "");

async function get(url, binary = false) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.text();
}

(async () => {
  const file = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const ready = file.products.filter((p) => p.isReadyToShip);
  console.log(`${ready.length} ready-to-ship pieces`);

  let db = null;
  if (!NO_DB) {
    const { createClient } = require("@supabase/supabase-js");
    db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rts-"));
  const report = { videos: [], noVideo: [], missingPhotos: [] };

  for (const p of ready) {
    const html = await get(p.url);
    const first = p.images.find((i) => i.src && /\.(jpe?g|png|webp)$/i.test(i.src));
    const ours = new Set(p.images.map((i) => base(i.originalUrl || "x")));

    // live gallery photos vs ours (by file name)
    const live = [...html.matchAll(/product-single__image-item[\s\S]*?<img[^>]*?src="([^"]+)"/g)].map((m) => base(m[1]));
    const missing = live.filter((b) => !ours.has(b));
    if (missing.length) report.missingPhotos.push({ id: p.id, missing });

    const m = html.match(/<video[^>]*?src="([^"]+\.mp4[^"]*)"/);
    if (!m) { report.noVideo.push(p.id); continue; }
    const src = original(m[1]);
    const raw = path.join(tmp, `${p.id}.src.mp4`);
    const out = path.join(tmp, `${p.id}.mp4`);
    const still = path.join(tmp, `${p.id}-poster.jpg`);
    fs.writeFileSync(raw, await get(src, true));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "scale=960:-2", "-c:v", "libx264", "-crf", "27", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "1", "-i", raw, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "3", still]);
    const kb = Math.round(fs.statSync(out).size / 1024);

    let videoUrl = `(not uploaded: --no-db) ${p.id}.mp4`, posterUrl = `(not uploaded) ${p.id}-poster.jpg`;
    if (db) {
      for (const [name, local, type] of [[`videos/${p.id}.mp4`, out, "video/mp4"], [`videos/${p.id}-poster.jpg`, still, "image/jpeg"]]) {
        const up = await db.storage.from(BUCKET).upload(name, fs.readFileSync(local), { contentType: type, upsert: true, cacheControl: "31536000" });
        if (up.error) throw new Error(`upload ${name}: ${up.error.message}`);
      }
      videoUrl = db.storage.from(BUCKET).getPublicUrl(`videos/${p.id}.mp4`).data.publicUrl;
      posterUrl = db.storage.from(BUCKET).getPublicUrl(`videos/${p.id}-poster.jpg`).data.publicUrl;
    }
    first.gallery = { ...(first.gallery ?? { detail: {}, angles: [] }), videoUrl, videoPoster: posterUrl };
    report.videos.push(p.id);
    console.log(`  ${p.id}: video ${kb} KB  <- ${src}`);
  }

  if (report.videos.length && db) {
    const backup = path.join(ROOT, "raw-assets", "products.pre-video.json");
    if (!fs.existsSync(backup)) fs.copyFileSync(FILE, backup);
    fs.writeFileSync(FILE, JSON.stringify(file, null, 2));
    console.log("  products.json updated");
  }

  if (db) {
    for (const p of ready) {
      const row = toRow(p);
      const cur = await db.from("products").select("gallery").eq("id", p.id).maybeSingle();
      if (cur.error || !cur.data) { console.log(`  ! ${p.id}: not in Supabase (${cur.error?.message ?? "no row"})`); continue; }
      const gallery = { ...cur.data.gallery, video_url: row.gallery.video_url, video_poster: row.gallery.video_poster };
      const up = await db.from("products").update({ gallery, images: row.images }).eq("id", p.id);
      if (up.error) throw new Error(`${p.id}: ${up.error.message}`);
    }
    console.log(`  Supabase: gallery + images updated for ${ready.length} pieces`);
  }

  console.log("\nvideos:", report.videos.join(" ") || "none");
  console.log("no video on live page:", report.noVideo.length);
  console.log("live gallery photos not in our data:", report.missingPhotos.length ? JSON.stringify(report.missingPhotos) : "none");
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
