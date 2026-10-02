"use client";

import { useEffect, useId, useRef, useState } from "react";
import FadeImage from "./fade-image";

export type Rgb = [number, number, number];
export type Zone = { x: number; y: number; r: number };
export type Slide = { key: string; label: string; src: string; zone?: Zone; grade?: boolean; /** mp4 of an on-hand video slide; src is then its cover frame */ video?: string };

/** #F4F0EB, the one uniform ground of the whole modal. */
export const PAGE: Rgb = [244, 240, 235];

/**
 * Photos have lighting falloff (lighter centre, darker edges, sometimes a wall-shadow band), so no flat pane
 * colour can match them. Instead we estimate the backdrop (the brighter 40% of a band just inside the edges,
 * which ignores the ring and any dark band) and return per-channel gains that lift it to the page tone.
 * Applied as an SVG filter, the photo backdrop becomes the page colour and its edges can dissolve into it.
 */
/** `ready` turns true once the photo has been sampled, so callers can hold the image back and never show it ungraded. */
export type Ground = { gain: [number, number, number]; top: number; ready: boolean };
export function useGain(src: string, enabled: boolean, target: Rgb = PAGE): Ground {
  const [ground, setGround] = useState<Ground>({ gain: [1, 1, 1], top: 10, ready: !enabled });
  useEffect(() => {
    if (!enabled) { setGround({ gain: [1, 1, 1], top: 10, ready: true }); return; }
    let live = true;
    const im = new Image();
    im.onload = () => {
      try {
        const N = 64, c = document.createElement("canvas");
        c.width = c.height = N;
        const x = c.getContext("2d", { willReadFrequently: true });
        if (!x) return;
        x.drawImage(im, 0, 0, N, N);
        const d = x.getImageData(0, 0, N, N).data;
        const band: number[][] = [];
        for (let yy = 0; yy < N; yy++)
          for (let xx = 0; xx < N; xx++) {
            const e = Math.min(xx, yy, N - 1 - xx, N - 1 - yy) / N;
            if (e >= 0.06 && e <= 0.24) { const k = (yy * N + xx) * 4; band.push([d[k], d[k + 1], d[k + 2], 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]]); }
          }
        band.sort((p, q) => q[3] - p[3]);
        const top = band.slice(0, Math.floor(band.length * 0.4));
        const g = [0, 1, 2].map((ch) => {
          const bd = top.reduce((sum, q) => sum + q[ch], 0) / top.length;
          return Math.min(1.3, Math.max(0.93, target[ch] / bd));
        }) as [number, number, number];
        // a top strip clearly darker than the backdrop is a wall-shadow band: fade it out over a much longer run
        let tl = 0, tn = 0;
        for (let yy = 0; yy < Math.round(N * 0.1); yy++) for (let xx = 0; xx < N; xx++) { const k = (yy * N + xx) * 4; tl += 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]; tn++; }
        const bl = top.reduce((sum, q) => sum + q[3], 0) / top.length;
        if (live) setGround({ gain: g, top: tl / tn < bl * 0.9 ? 36 : 10, ready: true });
      } catch { if (live) setGround((g) => ({ ...g, ready: true })); /* keep identity */ }
    };
    im.onerror = () => { if (live) setGround((g) => ({ ...g, ready: true })); };
    im.crossOrigin = "anonymous"; // photos in Supabase Storage are cross-origin; without this the canvas is tainted and cannot be graded
    im.src = src;
    return () => { live = false; };
  }, [src, enabled, target]);
  return ground;
}

/** Invisible SVG filter carrying one photo's gains; reference it with filter: url(#id). */
export function GainFilter({ id, gain }: { id: string; gain: [number, number, number] }) {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden focusable="false">
      <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feComponentTransfer>
          <feFuncR type="linear" slope={gain[0]} />
          <feFuncG type="linear" slope={gain[1]} />
          <feFuncB type="linear" slope={gain[2]} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

/** Edge feather as inline style, with a variable top run (long when the photo carries a shadow band). */
export const featherStyle = (top: number): React.CSSProperties => {
  const mask = `linear-gradient(to right, transparent, #000 10%, #000 90%, transparent), linear-gradient(to bottom, transparent, #000 ${top}%, #000 90%, transparent)`;
  return { maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" };
};

export const FEATHER = "[mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent),linear-gradient(to_bottom,transparent,#000_10%,#000_90%,transparent)] [mask-composite:intersect] [-webkit-mask-composite:source-in]";

const MAGNIFY = 1.7;

/**
 * The original photograph, shown whole and uncropped (object-contain in a square). The stage has no background
 * or border and the whole modal is one uniform colour: the photo backdrop is lifted to that colour (gain
 * filter) and its edges feather into it, so the ring floats with no visible box.
 * Nothing magnifies by default; a gentle lens-style zoom engages only while the pointer is over the stone,
 * and it is clipped by the frame so it can never spill outside the canvas.
 */
export function Stage({ slide, ground = PAGE, aspect = 1, fit = "contain", priority = true, blend = false, clip = true, magnify = MAGNIFY }: { slide: Slide; ground?: Rgb; aspect?: number; fit?: "cover" | "contain"; priority?: boolean; blend?: boolean; clip?: boolean; magnify?: number }) {
  const { gain, top, ready } = useGain(slide.src, slide.grade !== false, ground);
  const fid = "g" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  // The lens only arms after the pointer has genuinely travelled; a cursor parked where the modal or a new
  // picture appears (which browsers report as a move) must never trigger magnification on its own.
  const anchor = useRef<{ x: number; y: number } | null>(null);
  const armed = useRef(false);
  useEffect(() => { setZoom(false); anchor.current = null; armed.current = false; }, [slide.key]);
  const pos = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    const z = slide.zone;
    // the zone radius is a fraction of the width, so compare in height units when the frame is not square
    return { fx, fy, inside: !!z && Math.hypot((fx - z.x) * aspect, fy - z.y) < z.r * aspect };
  };
  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!armed.current) {
      if (!anchor.current) { anchor.current = { x: e.clientX, y: e.clientY }; return; }
      if (Math.hypot(e.clientX - anchor.current.x, e.clientY - anchor.current.y) < 6) return;
      armed.current = true;
    }
    const { fx, fy, inside } = pos(e);
    if (inside) setOrigin(`${fx * 100}% ${fy * 100}%`);
    setZoom(inside);
  };
  return (
    <div className={`relative w-full ${clip ? "overflow-hidden" : ""}`} style={{ aspectRatio: aspect }}>
      <GainFilter id={fid} gain={gain} />
      <div
        className="absolute inset-0"
        onPointerMove={(e) => { if (e.pointerType === "mouse") track(e); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setZoom(false); }}
        onPointerUp={(e) => { if (e.pointerType !== "mouse") { const { fx, fy, inside } = pos(e); if (inside) { setOrigin(`${fx * 100}% ${fy * 100}%`); setZoom((z) => !z); } else setZoom(false); } }}
      >
        <div
          className={`relative h-full w-full ${blend ? "mix-blend-multiply" : ""} transition-[transform,opacity] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${zoom ? "cursor-zoom-out" : slide.zone ? "cursor-zoom-in" : "cursor-default"}`}
          style={{ opacity: ready ? 1 : 0, transform: zoom ? `scale(${magnify})` : "none", transformOrigin: origin, filter: `url(#${fid})`, ...featherStyle(top) }}
          role="img"
          aria-label={slide.label}
        >
          <FadeImage src={slide.src} alt={slide.label} eager={priority} fit={fit} />
        </div>
      </div>
    </div>
  );
}

/**
 * A still photo dissolved into its page: backdrop lifted to the ground tone (gain filter), edges feathered,
 * then multiplied onto the ground so any residual tone difference can only darken toward it, never box it.
 */
export function GradedImage({ src, alt, ground = PAGE, className = "" }: { src: string; alt: string; ground?: Rgb; className?: string }) {
  const { gain, top } = useGain(src, true, ground);
  const fid = "i" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <>
      <GainFilter id={fid} gain={gain} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" decoding="async" style={{ filter: `url(#${fid})`, ...featherStyle(top) }} className={`absolute inset-0 h-full w-full mix-blend-multiply ${className}`} />
    </>
  );
}
