"use client";

import { motion } from "framer-motion";
import { scrollToId } from "@/lib/lenis";
import { siteConfig } from "@/data/site-config";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { Stage, type Rgb, type Slide } from "./graded-photo";

const EASE = [0.22, 1, 0.36, 1] as const;
/**
 * The photo backdrop is lifted to white and the photo is then multiplied onto the page, so the backdrop lands
 * on exactly the page colour (#F4F0EB). Lifting to the page colour instead would multiply it down twice.
 */
const WHITE: Rgb = [255, 255, 255];
/** Original studio photo (Elena), cropped to 5:3 and otherwise untouched. The zone is the centre stone. */
const RING: Slide = {
  key: "hero",
  label: "A six-claw round solitaire engagement ring in yellow gold, resting in soft natural light",
  src: "/hero/solitaire.webp",
  zone: { x: 0.492, y: 0.508, r: 0.104 },
};

export default function Hero() {
  const t = useT();
  const vi = useStore((s) => s.lang) === "vi";
  return (
    <section aria-labelledby="hero-title" className="relative z-[1] overflow-x-clip bg-alabaster pt-28 md:pt-32">
      <div className="relative mx-auto max-w-[1500px] px-5 md:px-10">
        <div className="relative z-10 mx-auto max-w-[60rem] text-center">
          <motion.h1
            id="hero-title"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="font-display text-[clamp(2.5rem,5.4vw,5.25rem)] font-light leading-[1.03] text-obsidian"
          >
            {vi ? <>Trang Sức Cao Cấp Thiết Kế Riêng, <em className="text-champagne-deep">Chế Tác Thủ Công</em> Bởi Nghệ Nhân Bậc Thầy</> : <>Bespoke Fine Jewellery, <em className="text-champagne-deep">Hand-Crafted</em> by Master Artisans</>}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
            className="mx-auto mt-6 max-w-[40rem] text-[0.95rem] leading-[1.75] text-muted-gray md:text-base"
          >
            {t(`${siteConfig.origin.short}. British standards of transparency and gemmological integrity. Visit our Thảo Điền atelier or order online with worldwide insured delivery.`)}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, delay: 0.3, ease: EASE }} className="mt-7">
            <button
              onClick={() => scrollToId("catalog")}
              className="eyebrow border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne"
            >
              {t("Explore the collection")}
            </button>
          </motion.div>
        </div>

        {/* No z-index on this wrapper: it would become its own stacking context and the multiply blend could no longer
            reach the page behind it. The text above is z-10, which is enough to keep it in front of the ring. */}
        {/* the photo's empty upper backdrop tucks under the text, so the ring sits within the first screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.2, ease: EASE }}
          className="relative mx-auto -mt-6 w-full max-w-[1100px] md:-mt-24 md:max-w-[min(1100px,max(40rem,calc((100dvh_-_9rem)*1.56)))]"
        >
          <Stage slide={RING} ground={WHITE} aspect={5 / 3} fit="cover" blend clip={false} magnify={1.35} />
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
          className="mt-6 flex flex-wrap justify-center gap-3 pb-16 md:pb-8"
        >
          {["IGI & GIA Certified", `${siteConfig.warranty.rings} on Rings`].map((label) => (
            <li key={label} className="eyebrow rounded-full border border-charcoal/15 px-4 py-2 text-[0.58rem] text-obsidian/75">{t(label)}</li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
