// Pure price arithmetic for the spot-price tool (no imports, so Node can run it directly in tests).

export interface PriceFields {
  /** Base price: the 18k price for configurable pieces. */
  price_vnd: number;
  /** Price before a sale; null when not on sale. */
  original_price_vnd: number | null;
  /** Multipliers of price_vnd keyed by "9k" | "14k" | "18k" | "platinum". */
  metal_pricing: Record<string, number>;
}

/**
 * Move the chosen metals' prices by `percent` and leave every other metal's price exactly where it is.
 * Works on absolute prices (price_vnd * multiplier), then re-expresses them against the new base, so the storefront
 * (round(price_vnd * multiplier)) shows precisely the new figures. Returns null when the piece has none of the keys.
 */
export function adjustSpot(r: PriceFields, keys: string[], percent: number): PriceFields | null {
  const present = keys.filter((k) => typeof r.metal_pricing[k] === "number");
  if (!present.length) return null;
  const f = 1 + percent / 100;
  const abs: Record<string, number> = {};
  for (const [k, m] of Object.entries(r.metal_pricing)) {
    const now = Math.round(r.price_vnd * m);
    abs[k] = present.includes(k) ? Math.round(now * f) : now;
  }
  // the base is the 18k price; without an 18k entry the base cannot move
  const base = abs["18k"] ?? r.price_vnd;
  const metal_pricing: Record<string, number> = {};
  for (const [k, v] of Object.entries(abs)) metal_pricing[k] = v / base;
  const original = r.original_price_vnd == null ? null : Math.round((r.original_price_vnd * base) / r.price_vnd);
  return { price_vnd: base, original_price_vnd: original, metal_pricing };
}

/** What the storefront shows for a metal: round(price_vnd * multiplier). */
export const shown = (r: Pick<PriceFields, "price_vnd" | "metal_pricing">, key: string): number => Math.round(r.price_vnd * r.metal_pricing[key]);
