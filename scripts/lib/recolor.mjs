// Shared colour helpers: remap gold-hued pixels to another metal (diamond, backdrop and shadow untouched).
export const rgb2hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx / 255];
};
const hsv2rgb = (h, s, v) => {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
};
export const ramp = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));

/** Remap gold-hued pixels to another metal; everything else (diamond, shadow, backdrop) is untouched. */
export function recolor(rgb, metal) {
  const px = Buffer.from(rgb);
  for (let i = 0; i < px.length; i += 3) {
    const [h, s, v] = rgb2hsv(px[i], px[i + 1], px[i + 2]);
    const w = ramp(s, 0.19, 0.31) * ramp(v, 0.3, 0.5) * (1 - ramp(Math.abs(h - 42), 14, 26));
    if (w <= 0) continue;
    let nh = h, ns = s, nv = v;
    if (metal === "white") { ns = s * 0.06; nv = Math.min(1, v * 1.08 + 0.05); nh = 220; }
    else if (metal === "platinum") { nv = v * 0.93; nh = 215; ns = Math.max(s * 0.05, 0.035 * v); }
    else if (metal === "rose") { nh = 12 + (h - 42) * 0.25; ns = Math.min(1, s + 0.11); nv = v * 0.98; }
    const [r, g, b] = hsv2rgb(nh, ns, nv);
    px[i] = px[i] * (1 - w) + r * w;
    px[i + 1] = px[i + 1] * (1 - w) + g * w;
    px[i + 2] = px[i + 2] * (1 - w) + b * w;
  }
  return px;
}

/** Share of pixels that look like skin; photos with a hand or model get no recoloured twin. */
export function skinShare(rgb) {
  let n = 0;
  for (let i = 0; i < rgb.length; i += 12) {
    const [h, s, v] = rgb2hsv(rgb[i], rgb[i + 1], rgb[i + 2]);
    if (h >= 8 && h <= 28 && s >= 0.18 && s <= 0.6 && v > 0.3) n++;
  }
  return n / (rgb.length / 12);
}
