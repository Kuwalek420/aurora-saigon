"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { scrollToId } from "@/lib/lenis";

export const FRAME_COUNT = 120;
const frameSrc = (n: number) => `/sequence/hero-frame-${n}.jpg`;

/** A caption block anchored bottom-left so it never crosses the centre stone. Plain opacity + short rise. */
function Caption({ p, range, children }: { p: MotionValue<number>; range: [number, number, number, number]; children: React.ReactNode }) {
  const opacity = useTransform(p, range, [0, 1, 1, 0]);
  const y = useTransform(p, range, [28, 0, 0, -28]);
  return (
    <motion.div style={{ opacity, y }} className="absolute bottom-[15vh] left-5 right-5 md:left-[6vw] md:right-auto md:max-w-[min(40rem,38vw)]">
      {children}
    </motion.div>
  );
}

const H = "font-display text-[clamp(2.25rem,5.4vw,5.75rem)] font-light uppercase leading-[0.95] tracking-[0.02em] text-alabaster";

export default function HeroScrollytelling() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 30, mass: 0.4 });

  const ctaIn = useTransform(p, [0.8, 0.9], [0, 1]);
  const ctaY = useTransform(p, [0.8, 0.9], [28, 0]);
  const cue = useTransform(p, [0, 0.05], [1, 0]);
  const bar = useTransform(p, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d", { alpha: false })!;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);
    let raf = 0, dirty = true, prog = 0, last = -1;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      last = -1; dirty = true;
    };

    /** Draws exactly one frame (no blending, so nothing ghosts). Falls back to the nearest loaded frame. */
    const draw = () => {
      const target = Math.round(prog * (FRAME_COUNT - 1));
      let idx = target;
      for (let d = 0; d < FRAME_COUNT; d++) {
        const a = imgs[target - d], b = imgs[target + d];
        if (a?.complete && a.naturalWidth) { idx = target - d; break; }
        if (b?.complete && b.naturalWidth) { idx = target + d; break; }
      }
      const im = imgs[idx];
      if (!im?.complete || !im.naturalWidth) return;
      ctx.fillStyle = "#0D0E0E";
      ctx.fillRect(0, 0, cv.width, cv.height);
      const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight) * (1 + prog * 0.06);
      const w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      last = idx;
    };

    const tick = () => {
      if (dirty) { draw(); dirty = false; }
      raf = requestAnimationFrame(tick);
    };

    let first = true;
    for (let n = 1; n <= FRAME_COUNT; n++) {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { dirty = true; if (first) { first = false; setReady(true); } };
      im.src = frameSrc(n);
      imgs[n - 1] = im;
    }

    const off = p.on("change", (v) => {
      prog = Math.min(1, Math.max(0, v));
      if (Math.round(prog * (FRAME_COUNT - 1)) !== last) dirty = true;
    });
    size();
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); off(); window.removeEventListener("resize", size); };
  }, [p]);

  return (
    <section ref={section} className="relative bg-obsidian text-alabaster" style={{ height: "760vh" }} aria-label="Aurora Saigon introduction">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <canvas
          ref={canvas}
          className={`absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${ready ? "opacity-100" : "opacity-0"}`}
          role="img"
          aria-label="Cinematic sequence of a platinum oval-cut diamond engagement ring: floating, a macro of the diamond facets, then a side profile of the band"
        />

        <div className="pointer-events-none absolute inset-0 mx-auto max-w-[1700px]">
          <Caption p={p} range={[-0.1, -0.05, 0.22, 0.32]}>
            <h1 className={H}>Excellence beyond tradition</h1>
          </Caption>
          <Caption p={p} range={[0.42, 0.5, 0.64, 0.74]}>
            <h2 className={H}>Designed in Ho Chi Minh City. Handcrafted in Bangkok.</h2>
          </Caption>
          <motion.div style={{ opacity: ctaIn, y: ctaY }} className="absolute bottom-[15vh] left-5 right-5 md:left-[6vw] md:right-auto md:max-w-[min(40rem,38vw)]">
            <h2 className={`${H} mb-10`}>Explore the collection</h2>
            <button onClick={() => scrollToId("catalog")} className="group pointer-events-auto inline-flex items-center gap-4 border border-alabaster/30 px-7 py-4 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne hover:text-champagne" aria-label="Scroll to the collection">
              <span className="eyebrow">Scroll down</span>
              <span className="block h-px w-8 bg-current transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-12" />
            </button>
          </motion.div>
        </div>

        <motion.p style={{ opacity: cue }} className="eyebrow absolute bottom-14 left-5 text-[0.6rem] text-alabaster/50 md:left-[6vw]">Scroll to begin</motion.p>
        <div className="absolute inset-x-5 bottom-6 flex items-center gap-5 md:inset-x-[6vw]">
          <div className="h-px flex-1 bg-alabaster/15"><motion.div style={{ width: bar }} className="h-px bg-champagne" /></div>
        </div>
      </div>
    </section>
  );
}
