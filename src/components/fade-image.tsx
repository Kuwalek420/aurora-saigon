"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
type Layer = { id: number; src: string };

/**
 * Stacked cross-fade. The next image is fetched and decoded first, then fades in over the current one
 * (which stays opaque underneath), so nothing flashes, shifts or changes the ground colour.
 */
const FIT = { cover: "object-cover", contain: "object-contain" } as const;

export default function FadeImage({ src, alt, eager = false, fit = "cover", className = "" }: { src: string; alt: string; eager?: boolean; fit?: keyof typeof FIT; className?: string }) {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, src }]);
  const seq = useRef(0);
  const current = useRef(src);

  useEffect(() => {
    if (src === current.current) return;
    current.current = src;
    let live = true;
    const im = new Image();
    im.src = src;
    const show = () => live && setLayers((l) => [...l.slice(-1), { id: ++seq.current, src }]);
    (im.decode ? im.decode() : Promise.resolve()).then(show, show);
    return () => { live = false; };
  }, [src]);

  return (
    <>
      {layers.map((l, i) => (
        <motion.img
          key={l.id}
          src={l.src}
          alt={i === layers.length - 1 ? alt : ""}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          initial={{ opacity: l.id === 0 ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
          onAnimationComplete={() => layers.length > 1 && i === layers.length - 1 && setLayers((cur) => cur.slice(-1))}
          className={`absolute inset-0 h-full w-full ${FIT[fit]} ${className}`}
        />
      ))}
    </>
  );
}
