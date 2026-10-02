// Updates products.json for the generated Carter render and enhances showroom photos (sharp: Lanczos upscale + sharpen + gentle tone lift).
import fs from 'node:fs'; import sharp from 'sharp';
const f = 'src/data/products.json'; const d = JSON.parse(fs.readFileSync(f, 'utf8'));
const c = d.products.find(p => p.id === 'AS-354-WR-YS-CARTER');
const im = c.images[0]; im.localPath = 'public/scraped-images/band-AS-354-WR-YS-CARTER-1.jpg'; im.generated = true; delete im.error;
// normalise every localPath to a public URL
for (const p of d.products) for (const i of p.images) {
  const n = i.file && fs.existsSync('public/scraped-images/' + i.file) ? '/scraped-images/' + i.file
    : i.localPath ? '/scraped-images/' + i.localPath.split('/').pop() : null;
  i.src = n && fs.existsSync('public' + n) ? n : null;
}
fs.writeFileSync(f, JSON.stringify(d, null, 2));
const src = { 'raw-assets/showroom/Were_Here_for_You_In_Person_and_Online.jpg': 'showroom-wall.jpg', 'raw-assets/showroom/Screenshot 2026-09-30 223012.png': 'showroom-window.jpg' };
for (const [s, o] of Object.entries(src)) {
  const m = await sharp(s).metadata();
  await sharp(s).resize({ width: m.width * 2, kernel: 'lanczos3' }).modulate({ brightness: 1.03, saturation: 1.05 }).sharpen({ sigma: 1.1 }).jpeg({ quality: 88, mozjpeg: true }).toFile('public/images/showroom/' + o);
}
console.log('done', d.products.filter(p => p.images.every(i => !i.src)).map(p => p.id));
