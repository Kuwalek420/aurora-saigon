"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { scrollToId, setLenis } from "@/lib/lenis";
import { useStore } from "@/lib/store";
import { applyRates } from "@/lib/currency";
import type { Currency } from "@/lib/types";

export default function Providers({ children, rates }: { children: React.ReactNode; rates?: Record<Currency, number> }) {
  // prices format with the server's rates (live, cached 6 h) on the server render and in the browser alike
  if (rates) applyRates(rates);
  useEffect(() => {
    useStore.persist.rehydrate();
    // arriving from a content page via "/#catalog": the browser's own hash jump fires before the sections lay out
    const hash = window.location.hash.slice(1);
    const jump = hash ? window.setTimeout(() => scrollToId(hash), 500) : 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => window.clearTimeout(jump);
    const lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    setLenis(lenis);
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const unsub = useStore.subscribe((s, p) => {
      const locked = (x: typeof s) => x.drawerOpen || !!x.detail || x.viewing.open;
      if (locked(s) !== locked(p)) locked(s) ? lenis.stop() : lenis.start();
    });
    return () => {
      window.clearTimeout(jump);
      cancelAnimationFrame(raf);
      unsub();
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return <>{children}</>;
}
