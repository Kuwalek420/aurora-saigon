"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/use-t";

type Field = { label: string; value: string };

/** Clipboard API first, then the legacy command; returns whether the text really reached the clipboard. */
async function copyText(text: string, source: HTMLElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* blocked (no focus, insecure context): try the legacy path on the visible text */
  }
  if (!source) return false;
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(source);
  sel?.removeAllRanges();
  sel?.addRange(range);
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  }
}

/** One field with its own copy action. If copying is impossible the text is left selected, ready for Ctrl+C. */
function CopyField({ label, value }: Field) {
  const t = useT();
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");
  const text = useRef<HTMLElement>(null);
  const copy = async () => {
    const ok = await copyText(value, text.current);
    if (!ok && text.current) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(text.current);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setState(ok ? "copied" : "selected");
    window.setTimeout(() => setState("idle"), 2200);
  };
  return (
    <div className="flex items-end justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <dt className="eyebrow mb-2 text-[0.55rem] text-muted-gray">{label}</dt>
        <dd ref={text} className="break-words text-[1.05rem] font-medium leading-snug tracking-wide tabular-nums">{value}</dd>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`${t("Copy")} ${label.toLowerCase()}`}
        className="eyebrow shrink-0 border-b border-obsidian pb-1 text-[0.58rem] text-obsidian transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne"
      >
        <span aria-live="polite">{state === "copied" ? t("Copied") : state === "selected" ? t("Press Ctrl+C") : t("Copy")}</span>
      </button>
    </div>
  );
}

/** Bank transfer details in one quiet panel (no border box; a tonal surface on the page ground). */
export default function BankCard({ fields, note }: { fields: Field[]; note?: string }) {
  return (
    <div className="mx-auto max-w-[36rem] bg-obsidian/[0.04] p-7 md:p-9">
      <dl>
        {fields.map((f) => (
          <CopyField key={f.label} {...f} />
        ))}
      </dl>
      {note && <p className="mt-7 text-[0.8rem] leading-[1.7] text-muted-gray">{note}</p>}
    </div>
  );
}
