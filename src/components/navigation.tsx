"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { scrollToId } from "@/lib/lenis";
import { catalogHref } from "@/lib/catalog-url";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import type { Facets } from "@/lib/products";
import type { Filters } from "@/lib/types";
import EngagementMegaMenu from "./engagement-mega-menu";
import WeddingMegaMenu from "./wedding-mega-menu";

type MenuId = "engagement" | "wedding";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Header links: Ready-to-ship, Engagement Rings (opens the mega menu on hover or keyboard focus; a click goes to its
 * catalogue page), Wedding Rings, Pendants & Necklaces and Showroom.
 */
export default function Navigation({ facets, onOpenChange, tone }: { facets: Facets; onOpenChange: (open: boolean) => void; tone: string }) {
  const { applyFilters, openViewing } = useStore();
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<MenuId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const set = useCallback((o: MenuId | null) => { setOpen(o); onOpenChange(o !== null); }, [onOpenChange]);
  const later = (o: MenuId | null, ms: number) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => set(o), ms); };
  const keep = () => { if (timer.current) clearTimeout(timer.current); };

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && set(null);
    const away = (e: MouseEvent) => !root.current?.contains(e.target as Node) && set(null);
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", away);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", away); };
  }, [open, set]);

  // filter links work in place on the home page and /catalog; from anywhere else they carry the filters to /catalog
  const go = (patch: Partial<Filters>) => {
    applyFilters(patch);
    set(null);
    if (pathname === "/" || pathname === "/catalog") requestAnimationFrame(() => scrollToId("catalog"));
    else router.push("/catalog#catalog");
  };

  const cls = `eyebrow relative py-5 transition-colors duration-500 hover:text-champagne ${tone}`;
  const direct = (href: string, label: React.ReactNode) => (
    <Link href={href} onClick={() => set(null)} onMouseEnter={() => later(null, 90)} className={cls}>{label}</Link>
  );

  /** A header link that opens its mega menu on hover or keyboard focus; a click goes to its catalogue page. */
  const trigger = (id: MenuId, href: string, label: string) => (
    <Link
      href={href}
      onClick={() => set(null)}
      onMouseEnter={() => later(id, 90)}
      onFocus={() => later(id, 0)}
      aria-expanded={open === id}
      aria-controls={`menu-${id}`}
      className={cls}
    >
      {label}
      <span className={`absolute inset-x-0 bottom-3.5 h-px origin-left bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open === id ? "scale-x-100" : "scale-x-0"}`} />
    </Link>
  );

  return (
    <div ref={root} onMouseEnter={keep} onMouseLeave={() => open && later(null, 220)} className="hidden lg:block">
      <nav aria-label={t("Primary")} className="flex items-center gap-4 xl:gap-6 2xl:gap-9 [&>*]:whitespace-nowrap [&_.eyebrow]:tracking-[0.12em]! xl:[&_.eyebrow]:tracking-[0.16em]! 2xl:[&_.eyebrow]:tracking-[0.28em]!">
        {direct(catalogHref("Ready to Ship"), t("Ready-to-ship"))}
        {trigger("engagement", catalogHref("Engagement Rings"), t("Engagement Rings"))}
        {trigger("wedding", catalogHref("Wedding Rings"), t("Wedding Rings"))}
        {direct(catalogHref("Pendants & Necklaces"), <><span className="xl:hidden">{t("Pendants")}</span><span className="max-xl:hidden">{t("Pendants & Necklaces")}</span></>)}
        {direct("/showroom", t("Showroom"))}
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            key={open}
            id={`menu-${open}`}
            initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0.6 }}
            animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
            exit={{ clipPath: "inset(0 0 100% 0)", opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="absolute inset-x-0 top-full border-b border-charcoal/10 bg-alabaster text-obsidian shadow-[0_30px_50px_-40px_rgba(13,14,14,0.3)]"
          >
            {open === "engagement" ? (
              <EngagementMegaMenu facets={facets} go={go} close={() => set(null)} onBook={() => { set(null); openViewing(null); }} />
            ) : (
              <WeddingMegaMenu close={() => set(null)} onBook={() => { set(null); openViewing(null); }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
