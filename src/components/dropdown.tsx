"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/use-t";

/** Custom listbox replacing native <select>. */
export default function Dropdown({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <span className="eyebrow mb-2 block text-[0.6rem] text-muted-gray">{label}</span>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} className="flex w-full items-center justify-between border-b border-charcoal/10 py-2 text-left text-sm text-obsidian transition-colors hover:border-champagne">
        <span className={value === "All" ? "text-obsidian/60" : ""}>{t(value)}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1" className={`text-champagne-deep transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden><path d="M1 1l4 4 4-4" /></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" data-lenis-prevent initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-charcoal/10 bg-alabaster py-1 shadow-[0_24px_48px_-28px_rgba(13,14,14,0.25)]">
            {["All", ...options].map((o) => (
              <li key={o} role="option" aria-selected={o === value}>
                <button onClick={() => { onChange(o); setOpen(false); }} className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-charcoal/5 ${o === value ? "text-champagne-deep" : "text-obsidian/80"}`}>
                  {t(o)}
                  {o === value && <span className="h-1 w-1 rounded-full bg-champagne" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
