"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";

type Props = { excerpt: string; fullText: string; excerptVi?: string; fullTextVi?: string; href?: string };

/**
 * A review excerpt that expands to the full text in place. In Vietnamese it shows our translation (when there is one),
 * says so, and always links to the original review on Google. Only the few reviews on screen are passed in.
 */
export default function ReviewText({ excerpt, fullText, excerptVi, fullTextVi, href }: Props) {
  const t = useT();
  const vi = useStore((s) => s.lang) === "vi" && !!excerptVi && !!fullTextVi;
  const [open, setOpen] = useState(false);
  const ex = vi ? excerptVi! : excerpt;
  const full = vi ? fullTextVi! : fullText;
  const more = full.replace(/\s+/g, " ").trim() !== ex.replace(/\s+/g, " ").trim();
  return (
    <>
      <p className="whitespace-pre-line leading-relaxed text-obsidian/75">{open ? full : ex}</p>
      <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {more && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="eyebrow text-[0.58rem] text-muted-gray underline decoration-charcoal/25 underline-offset-[6px] transition-colors duration-500 hover:text-obsidian hover:decoration-champagne"
          >
            {open ? t("Show less") : t("Read more")}
          </button>
        )}
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="eyebrow text-[0.58rem] text-muted-gray underline decoration-charcoal/25 underline-offset-[6px] transition-colors duration-500 hover:text-obsidian hover:decoration-champagne">
            {vi ? t("View the original on Google") : t("View on Google")}
          </a>
        )}
      </p>
      {vi && <p className="mt-3 text-[0.7rem] text-muted-gray">{t("Translated from English by Aurora Saigon")}</p>}
    </>
  );
}
