"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { GradedImage } from "./graded-photo";

const EASE = [0.22, 1, 0.36, 1] as const;

/** All three macros are crops of the Lydia engagement ring's own studio photographs. */
const PARTS = [
  { n: "01", title: "Certified Center Stone", spec: "GIA/IGI Graded, Ideal Cut", src: "/gallery/AS-358-EN-YG-R-LYDIA-detail.webp", alt: "Macro of a round diamond held by four claws", body: "Each centre stone is documented with an independent IGI or GIA grading report, so cut, colour, clarity and carat can be verified before you commit." },
  { n: "02", title: "Hand-Finished Setting", spec: "4-Claw Cathedral & Hidden Halo", src: "/anatomy/setting.webp", alt: "Side macro of four claws, a cathedral shank and a hidden halo of diamonds", body: "Claws and basket are finished by hand by master artisans in Bangkok. Four claws rise on a cathedral shank, and the hidden halo only shows when you look at the ring from the side." },
  { n: "03", title: "Solid 18k & Platinum Band", spec: "Hallmarked for Authenticity", src: "/anatomy/band.webp", alt: "Macro of a polished solid gold band", body: "The band is solid 18k gold or platinum, hallmarked, and inspected under magnification before it reaches you." },
];

export default function RingAnatomy() {
  const [active, setActive] = useState<string | null>(null);
  const t = useT();
  const vi = useStore((s) => s.lang) === "vi";
  return (
    <section id="craft" className="relative bg-alabaster py-28 md:py-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="font-display max-w-[16ch] text-[clamp(2.4rem,4.6vw,4.4rem)] font-light leading-[1.02]"
        >
          {vi ? <>Giải Phẫu Một Chiếc Nhẫn, <em className="text-champagne-deep">Tháo Rời Từng Chi Tiết</em></> : <>Anatomy of a Ring, <em className="text-champagne-deep">Taken Apart</em></>}
        </motion.h2>

        <ol className="mt-16 grid gap-14 md:mt-24 md:grid-cols-3 md:gap-8 lg:gap-12" onMouseLeave={() => setActive(null)}>
          {PARTS.map((p, i) => (
            <motion.li
              key={p.n}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, delay: i * 0.12, ease: EASE }}
              onMouseEnter={() => setActive(p.n)}
              onFocus={() => setActive(p.n)}
              onBlur={() => setActive(null)}
              className={`group transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${active && active !== p.n ? "md:opacity-45" : ""}`}
            >
              <figure className="relative aspect-square w-full overflow-hidden bg-alabaster">
                <span className="absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                  <GradedImage src={p.src} alt={t(p.alt)} />
                </span>
              </figure>
              <div className="mt-8">
                <h3 className="flex items-baseline gap-4 font-display text-[1.6rem] font-normal leading-tight">
                  <span className="text-[1rem] italic text-champagne-deep tabular-nums">{p.n}</span>
                  {t(p.title)}
                </h3>
                <p className="mt-3 text-[12px] uppercase tracking-wider text-muted-gray">{t(p.spec)}</p>
                <p className="mt-5 max-w-sm text-[0.9rem] leading-[1.75] text-obsidian/65">{t(p.body)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <p className="mt-16 text-[0.72rem] text-muted-gray">{t("Detail photographs: the Lydia engagement ring.")}</p>
      </div>
    </section>
  );
}
