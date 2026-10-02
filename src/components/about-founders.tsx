"use client";

import { motion } from "framer-motion";
import about from "@/data/about.json";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { aboutVi, FOUNDER_CAPTION_VI } from "@/lib/translations";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The founder's "Brand & Values" letter, verbatim from the live site (scripts/scrape-content.js -> about.json). */
export default function AboutFounders() {
  const openViewing = useStore((s) => s.openViewing);
  const t = useT();
  const vi = useStore((s) => s.lang) === "vi";
  const letter = vi ? aboutVi.founderLetter : about.founderLetter;
  if (!letter?.image) return null;

  return (
    <section id="founders" className="bg-alabaster py-28 md:py-36">
      <div className="mx-auto grid max-w-[1400px] items-start gap-14 px-5 md:grid-cols-[minmax(0,25rem)_1fr] md:gap-20 md:px-10 lg:gap-28">
        <motion.figure initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1, ease: EASE }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={letter.image.src} alt={vi ? FOUNDER_CAPTION_VI : "Nick, founder of Aurora Saigon Jewellery"} className="w-full max-w-[25rem]" loading="lazy" />
          <figcaption className="mt-4 text-[0.72rem] text-muted-gray">{vi ? FOUNDER_CAPTION_VI : "Nick, Founder of Aurora Saigon Jewellery"}</figcaption>
        </motion.figure>

        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 1, delay: 0.15, ease: EASE }}>
          <h2 className="font-display text-[clamp(2.2rem,4vw,3.6rem)] font-light leading-[1.05]">{letter.heading}</h2>
          <div className="mt-8 max-w-xl space-y-5 leading-[1.8] text-obsidian/65">
            {letter.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-10">
            <span className="font-display text-[1.6rem] italic text-champagne-deep">{letter.signature}</span>
            <span className="mt-1 block text-[0.78rem] text-muted-gray">{letter.role}</span>
          </p>
          <button
            onClick={() => openViewing(null)}
            className="eyebrow mt-12 border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne"
          >
            {t("Book Private Viewing in Thảo Điền")}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
