"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { verifyUrl } from "@/lib/certificate";
import { formatMoney, useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import type { LooseStone } from "@/lib/diamond-data";

/** The live site's 360-degree viewer page, which takes the stone's viewer id. */
const V360 = "https://labgrowns3.s3.ap-southeast-1.amazonaws.com/stoneimages360.html?d=";

type Tab = "view" | "specs" | "cert";
const EASE = [0.22, 1, 0.36, 1] as const;
const mm = (n: number) => n.toFixed(2);

/**
 * One stone, three views: the live site's 360-degree viewer (only some stones have one), the full gemmological
 * specification, and its certificate. Everything shown is what the live inventory feed publishes for that stone;
 * a field it does not publish (cut grade) is not shown. The certificate itself opens on the lab's own verification page.
 */
export default function DiamondInspectorModal({ stone, title, onClose, onEnquire }: { stone: LooseStone | null; title: string; onClose: () => void; onEnquire: (s: LooseStone) => void }) {
  const t = useT();
  const currency = useStore((s) => s.currency);
  const [tab, setTab] = useState<Tab>("specs");

  useEffect(() => {
    if (!stone) return;
    setTab(stone.v360StoneId ? "view" : "specs");
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [stone, onClose]);

  const rows: [string, string | null][] = stone
    ? [
        [t("Shape"), t(stone.shape)],
        [t("Carat"), stone.carat != null ? `${stone.carat.toFixed(2)} ct` : null],
        [t("Colour"), stone.colourDesc || stone.colour],
        [t("Clarity"), stone.clarity],
        [t("Polish"), stone.polish],
        [t("Fluorescence"), stone.fluorescence ? t(stone.fluorescence.charAt(0) + stone.fluorescence.slice(1).toLowerCase()) : null],
        [t("Measurements (L × W × D)"), stone.measurements ? `${mm(stone.measurements.l)} × ${mm(stone.measurements.w)} × ${mm(stone.measurements.d)} mm` : null],
        [t("Length to width ratio"), stone.ratio != null ? stone.ratio.toFixed(3) : null],
        [t("Table"), stone.tablePct != null ? `${stone.tablePct.toFixed(1)}%` : null],
        [t("Total depth"), stone.depthPct != null ? `${stone.depthPct.toFixed(1)}%` : null],
        [t("Crown height / angle"), stone.crownHeight != null && stone.crownAngle != null ? `${stone.crownHeight.toFixed(1)}% / ${stone.crownAngle.toFixed(1)}°` : null],
        [t("Pavilion depth / angle"), stone.pavilionDepth != null && stone.pavilionAngle != null ? `${stone.pavilionDepth.toFixed(1)}% / ${stone.pavilionAngle.toFixed(1)}°` : null],
        [t("Price"), formatMoney(stone.price, currency)],
      ]
    : [];
  const verify = stone ? verifyUrl(stone.cert, stone.certNo) : null;
  const tabs: [Tab, string, boolean][] = [["view", t("Interactive 360° View"), !!stone?.v360StoneId], ["specs", t("Specifications"), true], ["cert", t("Certificate"), true]];

  return (
    <AnimatePresence>
      {stone && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} onClick={onClose} role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian/45 p-4">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.5, ease: EASE }} onClick={(e) => e.stopPropagation()} className="relative max-h-[92dvh] w-full max-w-[40rem] overflow-y-auto bg-alabaster p-7 md:p-10">
            <h3 className="font-display pr-16 text-[1.9rem] font-normal leading-[1.1]">{title}</h3>
            <button onClick={onClose} className="eyebrow absolute right-6 top-6 text-[0.58rem] text-muted-gray transition-colors hover:text-obsidian">{t("Close")}</button>

            <div className="mt-7 flex gap-7 border-b border-charcoal/10" role="tablist" aria-label={t("Stone views")}>
              {tabs.map(([id, label, on]) => (
                <button key={id} role="tab" aria-selected={tab === id} disabled={!on} onClick={() => setTab(id)} className={`eyebrow relative pb-3 text-[0.62rem] transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-40 ${tab === id ? "text-obsidian" : "text-muted-gray hover:text-obsidian"}`}>
                  {label}
                  {tab === id && <span className="absolute inset-x-0 -bottom-px h-px bg-champagne" />}
                </button>
              ))}
            </div>

            <div className="mt-7 min-h-[18rem]">
              {tab === "view" && stone.v360StoneId && (
                <div>
                  <iframe src={`${V360}${stone.v360StoneId}`} title={t("360° view of this stone")} loading="lazy" allowFullScreen sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" className="h-[450px] w-full border-0 bg-charcoal/5" />
                  <p className="mt-3 text-[0.72rem] text-muted-gray">{t("Drag to turn the stone. The viewer is provided by our diamond supplier.")}</p>
                </div>
              )}
              {tab === "specs" && (
                <dl className="grid grid-cols-[1fr_auto] gap-x-8">
                  {rows.filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="col-span-2 grid grid-cols-subgrid border-b border-charcoal/10 py-3">
                      <dt className="text-[0.85rem] text-muted-gray">{k}</dt>
                      <dd className="text-right text-[0.9rem] tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tab === "cert" && (
                <div>
                  <dl className="grid grid-cols-[1fr_auto] gap-x-8">
                    <div className="col-span-2 grid grid-cols-subgrid border-b border-charcoal/10 py-3">
                      <dt className="text-[0.85rem] text-muted-gray">{t("Grading laboratory")}</dt>
                      <dd className="text-right text-[0.9rem]">{stone.cert ?? "—"}</dd>
                    </div>
                    <div className="col-span-2 grid grid-cols-subgrid border-b border-charcoal/10 py-3">
                      <dt className="text-[0.85rem] text-muted-gray">{t("Report number")}</dt>
                      <dd className="text-right text-[0.9rem] tabular-nums">{stone.certNo ?? "—"}</dd>
                    </div>
                  </dl>
                  <p className="mt-6 max-w-md text-[0.85rem] leading-[1.75] text-obsidian/70">{t("The full report is held by the grading laboratory. Open its verification page to check this stone's report number and grades.")}</p>
                  {verify ? (
                    <a href={verify} target="_blank" rel="noopener noreferrer" className="eyebrow mt-6 inline-block border-b border-obsidian pb-1 text-obsidian transition-colors duration-500 hover:border-champagne">
                      {t("Verify on {lab}", { lab: stone.cert ?? "" })}
                    </a>
                  ) : (
                    <p className="mt-6 text-[0.8rem] text-muted-gray">{t("Ask us for the certificate copy of this stone.")}</p>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => onEnquire(stone)} className="eyebrow mt-8 w-full bg-obsidian px-6 py-4 text-[0.62rem] text-alabaster transition-colors duration-500 hover:bg-champagne-deep">{t("Enquire about this stone")}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
