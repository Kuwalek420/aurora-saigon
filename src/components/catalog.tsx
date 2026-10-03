"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { catalogQuery, categoryFromSlug, genderFromParam, metalFromParam, styleFromParam } from "@/lib/catalog-url";
import { scrollToId } from "@/lib/lenis";
import { weddingGender, weddingStyles } from "@/lib/wedding-gender";
import { metalOptions, METAL_LABEL, unitPrice, useStore } from "@/lib/store";
import { useLiveCatalog } from "@/lib/use-live-catalog";
import { useT } from "@/lib/use-t";
import type { Product } from "@/lib/types";
import CatalogFilters from "./catalog-filters";
import ProductCard from "./product-card";

const READY = "Ready to Ship";
const CATEGORIES = [READY, "All", "Engagement Rings", "Wedding Rings", "Pendants & Necklaces", "Fine Jewellery"];
const TAB_LABEL: Record<string, string> = { All: "All Pieces" };
const PAGE = 24;
const GENDERS = ["Women", "Men"];

/** Title and one-line subtitle for the active tab; `n` is the number of pieces in that tab. */
function heading(category: string, gender: string, n: number): [string, string, Record<string, number>] {
  const vars = { n };
  switch (category) {
    case READY: return ["Ready to Ship", "{n} pieces in stock for immediate delivery in Ho Chi Minh City.", vars];
    case "Engagement Rings": return ["Engagement Rings", "{n} engagement rings with live pricing by metal. Choose a shape and a setting, then select a piece to view it and pick your size.", vars];
    case "Wedding Rings":
      return ["Wedding Rings", gender === "Women" ? "{n} women's wedding rings with live pricing by metal. Choose a finish, then select a band to view it and pick your size." : gender === "Men" ? "{n} men's wedding rings with live pricing by metal. Choose a finish, then select a band to view it and pick your size." : "{n} wedding rings with live pricing by metal. Choose a finish, then select a band to view it and pick your size.", vars];
    case "Pendants & Necklaces": return ["Pendants & Necklaces", "{n} pendants and necklaces with live pricing by metal. Choose a finish, then select a piece to view it.", vars];
    case "Fine Jewellery": return ["Fine Jewellery", "{n} fine jewellery pieces with live pricing by metal. Choose a finish, then select a piece to view it.", vars];
    default: return ["Atelier Collection", "{n} pieces with live pricing by metal. Choose a finish, then select a piece to view it and pick your size. Free insured delivery in Ho Chi Minh City.", vars];
  }
}

export default function Catalog({ products: served, asOf }: { products: Product[]; asOf: string | null }) {
  const { filters, setFilter, applyFilters, live, sold } = useStore();
  const t = useT();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const own = useRef<string | null>(null); // the query string this component last wrote itself (no re-apply, no scroll)
  useLiveCatalog(asOf);
  // what the server rendered, replaced or extended by anything that changed in Supabase since
  const products = useMemo(() => {
    const ids = new Set(served.map((p) => p.id));
    const base = served.flatMap((p) => { const l = live[p.id]; return l === null ? [] : [l ?? p]; }); // null = archived since the page rendered
    return [...base, ...Object.values(live).filter((p): p is Product => !!p && !ids.has(p.id))].map((p) => (sold[p.id] ? { ...p, isSold: true } : p));
  }, [served, live, sold]);
  const [shown, setShown] = useState(PAGE);
  const readyCount = useMemo(() => products.filter((p) => p.readyToShip && !p.isSold).length, [products]);

  // deep links: /catalog?category=wedding-rings&gender=women picks the tab, then scrolls to the grid
  const query = params.toString();
  useEffect(() => {
    if (own.current === query) { own.current = null; return; }
    const category = categoryFromSlug(params.get("category"));
    // /catalog on its own opens on Ready to Ship (unless filters were already chosen, e.g. from a mega-menu link)
    if (!category) {
      if (pathname === "/catalog" && useStore.getState().filters.category === "All") applyFilters({ category: READY });
      return;
    }
    // wedding rings open on the Women tab unless the link names a gender
    const gender = category === "Wedding Rings" ? (params.get("gender") ? genderFromParam(params.get("gender")) : "Women") : "All";
    const wedding = category === "Wedding Rings";
    const metal = wedding ? metalFromParam(params.get("metal")) : "All";
    const style = wedding ? styleFromParam(params.get("style")) : "All";
    const cur = useStore.getState().filters;
    if (cur.category !== category || cur.gender !== gender || cur.metal !== metal || cur.style !== style) applyFilters({ category, gender, metal, style });
    const id = setTimeout(() => scrollToId("catalog"), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /** Tab / gender clicks keep the address bar shareable on /catalog. */
  const choose = (category: string, gender: string) => {
    const same = category === filters.category;
    // a new tab starts with its own filters; the Women / Men toggle keeps the metal and style the visitor picked
    if (same) { setFilter("gender", gender); } else { applyFilters({ category, gender }); }
    if (pathname !== "/catalog") return;
    const q = catalogQuery(category, gender, same ? { metal: filters.metal, style: filters.style } : {});
    own.current = q;
    router.replace(`/catalog?${q}`, { scroll: false });
  };

  // any change to the filters (bar, tabs, or the mega menu) starts the grid from the top again
  useEffect(() => { setShown(PAGE); }, [filters]);

  const filtered = useMemo(
    () => {
      const pendantTab = filters.category === "Pendants & Necklaces";
      const list = products.filter((p) => {
        // sold stock leaves the Ready to Ship tab; elsewhere it stays visible as Atelier archive
        if (filters.category === READY) { if (!p.readyToShip || p.isSold) return false; }
        else if (filters.category !== "All" && p.category !== filters.category) return false;
        if (filters.shape !== "All" && p.shape !== filters.shape) return false;
        // a piece matches a metal if it is offered in it (not only the one it was photographed in)
        // pendants have no metal filter (their bar offers Gem and Style instead)
        if (!pendantTab && filters.metal !== "All" && !metalOptions(p).some((m) => METAL_LABEL[m] === filters.metal)) return false;
        // pendant gems are named loosely ("Swiss Blue Topaz" is a Blue Topaz), so they match by name
        if (filters.gemstone !== "All" && (pendantTab ? !p.gemstone.toLowerCase().includes(filters.gemstone.toLowerCase()) : p.gemstone !== filters.gemstone)) return false;
        // setting style and band type only describe rings; a stale choice must not empty the pendants view
        if (filters.category === "Wedding Rings" && filters.gender !== "All" && weddingGender(p.id) !== filters.gender) return false;
        if (filters.category === "Wedding Rings" && filters.style !== "All" && !weddingStyles(p.id).includes(filters.style)) return false;
        const ringFilters = filters.category !== "Pendants & Necklaces";
        if (ringFilters && filters.setting !== "All" && !p.setting.includes(filters.setting)) return false;
        if (ringFilters && filters.band !== "All" && p.band !== filters.band) return false;
        const price = unitPrice(p, p.metal);
        return price >= filters.price[0] && price <= filters.price[1];
      });
      // archive pieces follow the pieces that can still be bought (stable, so the order is otherwise unchanged)
      // wedding rings: women's first, then men's (this is the order of the "all" view; the Women / Men toggle narrows it)
      if (filters.category === "Wedding Rings") {
        const rank = (p: Product) => { const g = weddingGender(p.id); return g === "Women" ? 0 : g === "Men" ? 1 : 2; };
        list.sort((a, b) => rank(a) - rank(b));
      }
      return [...list.filter((p) => !p.isSold), ...list.filter((p) => p.isSold)];
    },
    [products, filters],
  );

  const inTab = useMemo(
    () => products.filter((p) => (filters.category === READY ? p.readyToShip && !p.isSold : filters.category === "All" || p.category === filters.category) && (filters.category !== "Wedding Rings" || filters.gender === "All" || weddingGender(p.id) === filters.gender)).length,
    [products, filters.category, filters.gender],
  );
  const [title, subtitle, vars] = heading(filters.category, filters.gender, filters.category === "All" ? products.length : inTab);

  return (
    <section id="catalog" className="bg-alabaster pt-28 md:pt-36">
      <div className="mx-auto max-w-[1500px] px-5 pb-24 md:px-10 md:pb-36">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-display text-[clamp(2.8rem,5.4vw,5.4rem)] font-light leading-none">{t(title)}</h2>
          <p className="max-w-sm text-sm leading-relaxed text-obsidian/60">{t(subtitle, vars)}</p>
        </div>

        <div className="hide-scroll flex gap-8 overflow-x-auto" role="tablist" aria-label={t("Category")}>
          {CATEGORIES.map((c) => (
            <button key={c} role="tab" aria-selected={filters.category === c} onClick={() => choose(c, c === "Wedding Rings" ? "Women" : "All")} className={`eyebrow relative shrink-0 pb-4 transition-colors ${filters.category === c ? "text-champagne-deep" : "text-obsidian/60 hover:text-obsidian"}`}>
              {c === READY ? t("Ready to Ship ({n} pieces)", { n: readyCount }) : t(TAB_LABEL[c] ?? c)}
              {filters.category === c && <span className="absolute inset-x-0 -bottom-px h-px bg-champagne" />}
            </button>
          ))}
        </div>

        {filters.category === "Wedding Rings" && (
          <div role="group" aria-label={t("Wedding rings for")} className="mt-8 inline-flex border border-charcoal/20">
            {GENDERS.map((g) => (
              <button key={g} type="button" aria-pressed={filters.gender === g} onClick={() => choose("Wedding Rings", filters.gender === g ? "All" : g)} className={`px-9 py-3 text-[0.72rem] uppercase tracking-[0.18em] transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${filters.gender === g ? "bg-[#D8C2B3] text-obsidian" : "text-obsidian/70 hover:text-obsidian"}`}>
                {t(g)}
              </button>
            ))}
          </div>
        )}

        <CatalogFilters products={products} count={filtered.length} />

        <div className="pt-12">
          {filters.category === READY && (
            <p className="mb-16 flex items-start justify-center gap-3 text-center text-[0.85rem] leading-snug md:items-center">
              <span aria-hidden className="mt-[0.4rem] block h-1.5 w-1.5 shrink-0 rounded-full bg-champagne md:mt-0" />
              <span>{t("Hand-Crafted & In Stock at Our Thảo Điền Showroom")} <span className="text-muted-gray">•</span> {t("Ready for Immediate Delivery")}</span>
            </p>
          )}
          {filtered.length === 0 ? (
            <p className="font-display py-24 text-center text-3xl text-obsidian/60">{t("No pieces match. Try widening your filters.")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-10 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, shown).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}

          {shown < filtered.length && (
            <div className="mt-20 text-center">
              <button onClick={() => setShown((n) => n + PAGE)} className="eyebrow border border-charcoal/30 px-10 py-4 transition-colors duration-500 hover:border-champagne hover:bg-champagne hover:text-obsidian">
                {t("Show more ({n} remaining)", { n: filtered.length - shown })}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
