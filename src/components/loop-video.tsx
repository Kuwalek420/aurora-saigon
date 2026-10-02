"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A short muted loop that plays only while it is on screen (saves battery and bandwidth) and that does not autoplay
 * for visitors who prefer reduced motion; they get the poster frame and native controls instead.
 */
export default function LoopVideo({ src, poster, label, className = "" }: { src: string; poster: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; // React does not reliably reflect the muted attribute, and autoplay requires it
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" controls={still} aria-label={label} className={`block w-full ${className}`} />
  );
}
