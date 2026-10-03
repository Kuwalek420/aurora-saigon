import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Currency, Filters, MetalKey, Product } from "./types";
import type { Lang } from "./i18n";
import { formatMoney as formatMoneyWith } from "./currency";

export const RING_SIZES = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];

export const METAL_DOT: Record<MetalKey, string> = { yellow: "#D4AF37", white: "#E5E5E5", rose: "#E0A996", platinum: "#D1D5DB", silver: "#D1D5DB" };

const CUT_SHAPES = new Set(["Round", "Oval", "Emerald", "Pear", "Marquise", "Cushion", "Princess", "Heart", "Radiant", "Trillant", "Kite", "Baguette"]);
/** "Oval Cut" for cut shapes, the plain shape name otherwise. */
export function cutLabel(p: Product): string {
  if (p.shape === "Other") return "—";
  return CUT_SHAPES.has(p.shape) ? `${p.shape} Cut` : p.shape;
}
/** Card subtitle, e.g. "Oval Cut • Lab Diamond". Falls back gracefully when a piece has no shape or stone. */
export function cardSubtitle(p: Product): string {
  const shape = p.shape !== "Other" ? (CUT_SHAPES.has(p.shape) ? `${p.shape} Cut` : p.shape) : "";
  const stone = p.gemstone === "None" ? "" : /lab[- ]grown diamond/i.test(p.gemstone) ? "Lab Diamond" : p.gemstone;
  const parts = [shape, stone].filter(Boolean);
  return parts.length ? parts.join(" • ") : METAL_LABEL[p.metal];
}

/** "Oval Solitaire | 18K Gold" style subtitle. */
export function subtitle(p: Product, metal: MetalKey, karat?: number | null): string {
  const t = p.title.toLowerCase();
  const kind = /solitaire/.test(t) ? "Solitaire" : /halo/.test(t) ? "Halo" : /trilogy|three[- ]stone/.test(t) ? "Trilogy" : /band/.test(t) ? "Band" : /necklace|pendant/.test(t) ? "Pendant" : /earring|stud/.test(t) ? "Earrings" : /bracelet/.test(t) ? "Bracelet" : /ring/.test(t) || p.isRing ? "Ring" : "";
  const left = [p.shape !== "Other" ? p.shape : "", kind].filter(Boolean).join(" ");
  const right = metal === "platinum" ? "Platinum" : metal === "silver" ? "925 Silver" : `${karat ? `${karat}K` : p.metalImages ? "18K" : p.karat || "18K"} ${METAL_LABEL[metal]}`;
  return [left, right].filter(Boolean).join(" | ");
}
export const METAL_LABEL: Record<MetalKey, string> = {
  yellow: "Yellow Gold",
  white: "White Gold",
  rose: "Rose Gold",
  platinum: "Platinum",
  silver: "925 Silver",
};
/** Indicative rates from the VND base; replace with a live FX feed in production. */
/** "16in" -> "16 in (41 cm)": lengths are published in inches. */
export function chainLabel(len: string): string {
  const inches = parseFloat(len);
  return `${inches} in (${Math.round(inches * 2.54)} cm)`;
}
/** Indicative rates live in lib/currency.ts (replaced by live rates from lib/fx.ts). */

/** Metal swatches to render: only what the live page offers (e.g. Lydia has no rose gold); none to choose for fixed stock. */
/** What the shopper paid before a sale, scaled to the selected metal/karat (price_vnd and original_price_vnd share the same ratio across metals). */
export function wasPrice(p: Product, now: number): number | null {
  return p.originalPrice ? Math.round((now * p.originalPrice) / p.regular) : null;
}

export function metalOptions(p: Product): MetalKey[] {
  return p.metals;
}

export const DEFAULT_KARAT = 18;
/** 18k is the list price; used only when the source page has no price for a purity. */
const KARAT_FACTOR: Record<number, number> = { 18: 1, 14: 0.85, 9: 0.7 };
/** Purity that applies to a selection: null for platinum, silver, fixed stock or pieces with no karat choice. */
export function activeKarat(p: Product, metal: MetalKey, karat: number = DEFAULT_KARAT): number | null {
  if (!p.karats.length || metal === "platinum" || metal === "silver") return null;
  return p.karats.includes(karat) ? karat : p.karats[p.karats.length - 1];
}
export function metalLabel(metal: MetalKey, karat?: number | null): string {
  return karat ? `${karat}k ${METAL_LABEL[metal]}` : METAL_LABEL[metal];
}
export function unitPrice(p: Product, metal: MetalKey, karat: number = DEFAULT_KARAT): number {
  if (p.readyToShip || !p.metalImages) return p.sale ?? p.regular;
  if (metal === "platinum" && p.byMetal.platinum) return p.byMetal.platinum;
  if (metal === "silver") return p.sale ?? p.regular;
  const k = activeKarat(p, metal, karat) ?? DEFAULT_KARAT;
  const listed = p.byMetal[`${k}k` as "9k" | "14k" | "18k"];
  if (listed) return listed;
  if (p.byMetal["18k"]) return Math.round(p.byMetal["18k"] * (KARAT_FACTOR[k] ?? 1));
  return p.sale ?? p.regular;
}
export const formatMoney = formatMoneyWith;

export const PRICE_CEILING = 500_000_000;
// the catalogue opens on Ready to Ship everywhere (home page and /catalog); the "All Pieces" tab sets "All" explicitly
export const DEFAULT_FILTERS: Filters = { category: "Ready to Ship", shape: "All", metal: "All", gemstone: "All", setting: "All", band: "All", gender: "All", style: "All", price: [0, PRICE_CEILING] };

interface State {
  items: CartItem[];
  drawerOpen: boolean;
  currency: Currency;
  /** Interface language; product names and descriptions follow it when a Vietnamese version exists. */
  lang: Lang;
  setLang: (l: Lang) => void;
  filters: Filters;
  /** Pieces changed in Supabase since the page was rendered (id -> fresh product); overrides what the server sent. */
  live: Record<string, Product | null>;
  /** Pieces just bought in this browser: shown as sold at once, before the page data catches up. */
  sold: Record<string, true>;
  markSold: (ids: string[]) => void;
  /** Changed pieces replace the server copy; archived ones (removed ids) are stored as null and drop out of the grid. */
  upsertLive: (products: Product[], removedIds?: string[]) => void;
  /** Fullscreen product inspection view. */
  detail: { product: Product; metal: MetalKey } | null;
  openDetail: (p: Product, metal: MetalKey) => void;
  closeDetail: () => void;
  /** Private viewing request dialog; remembers which piece it was opened from. */
  /** Customer account overlays: the login modal or the signed-in drawer. */
  panel: "login" | "account" | null;
  setPanel: (p: "login" | "account" | null) => void;
  viewing: { open: boolean; product: Product | null };
  openViewing: (p: Product | null) => void;
  closeViewing: () => void;
  /** Ring awaiting a size choice inside the drawer. */
  pending: { product: Product; metal: MetalKey; karat: number | null } | null;
  startPurchase: (p: Product, metal: MetalKey, karat?: number) => void;
  cancelPending: () => void;
  confirmPending: (size: string) => void;
  addItem: (p: Product, o: { size: string | null; metal: MetalKey; karat?: number; chain?: string; qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCurrency: (c: Currency) => void;
  setFilter: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  resetFilters: () => void;
  /** Replace every filter at once (mega-menu links); anything not given resets to "All". */
  applyFilters: (patch: Partial<Filters>) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      currency: "VND",
      lang: "en",
      setLang: (lang) => set({ lang }),
      filters: DEFAULT_FILTERS,
      pending: null,
      live: {},
      sold: {},
      markSold: (ids) => set((s) => ({ sold: { ...s.sold, ...Object.fromEntries(ids.map((id) => [id, true as const])) } })),
      upsertLive: (products, removedIds = []) => set((s) => ({ live: { ...s.live, ...Object.fromEntries(products.map((p) => [p.id, p])), ...Object.fromEntries(removedIds.map((id) => [id, null])) } })),
      detail: null,
      openDetail: (product, metal) => set({ detail: { product, metal } }),
      closeDetail: () => set({ detail: null }),
      panel: null,
      setPanel: (panel) => set({ panel }),
      viewing: { open: false, product: null },
      openViewing: (product) => set({ viewing: { open: true, product } }),
      closeViewing: () => set((s) => ({ viewing: { ...s.viewing, open: false } })),
      startPurchase: (p, metal, karat) => {
        if (p.isSold) return;
        if (!p.isRing) { useStore.getState().addItem(p, { size: null, metal, karat }); return; }
        set({ pending: { product: p, metal, karat: activeKarat(p, metal, karat) }, drawerOpen: true });
      },
      cancelPending: () => set({ pending: null }),
      confirmPending: (size) => {
        const pend = useStore.getState().pending;
        if (!pend) return;
        useStore.getState().addItem(pend.product, { size, metal: pend.metal, karat: pend.karat ?? undefined });
        set({ pending: null });
      },
      addItem: (p, { size, metal, karat, chain, qty = 1 }) =>
        set((s) => {
          if (p.isSold) return {};
          const k = activeKarat(p, metal, karat);
          const ch = p.chainLengths.length ? (chain && p.chainLengths.includes(chain) ? chain : p.chainLengths[0]) : null;
          const key = `${p.id}|${metal}|${k ?? "-"}|${size ?? "-"}|${ch ?? "-"}`;
          const hit = s.items.find((i) => i.key === key);
          const items = hit
            ? s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(9, i.qty + qty) } : i))
            : [
                ...s.items,
                { key, productId: p.id, title: p.title, titleVi: p.titleVi || undefined, image: p.metalImages?.[metal] ?? p.images[0], size, metal, karat: k, chain: ch, gemstone: p.gemstone, unitVnd: unitPrice(p, metal, k ?? undefined), qty },
              ];
          return { items, drawerOpen: true };
        }),
      setQty: (key, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(9, qty)) } : i)) })),
      removeItem: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clearCart: () => set({ items: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false, pending: null }),
      setCurrency: (currency) => set({ currency }),
      setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      applyFilters: (patch) => set({ filters: { ...DEFAULT_FILTERS, ...patch } }),
    }),
    { name: "aurora-saigon", partialize: (s) => ({ items: s.items, currency: s.currency, lang: s.lang }), skipHydration: true },
  ),
);
