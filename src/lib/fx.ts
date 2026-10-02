import "server-only";
import type { Currency } from "./types";
import { FALLBACK_RATES } from "./currency";

/**
 * Units of each currency per 1 VND. Live mid-market rates, refreshed at most every 6 hours; if the lookup fails the
 * indicative fallback rates are used, so a price is never blank.
 */
export async function getRates(): Promise<{ rates: Record<Currency, number>; live: boolean; asOf: string | null }> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/VND", { next: { revalidate: 21600 }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    if (j.result !== "success" || !j.rates) throw new Error("bad payload");
    const rates = { ...FALLBACK_RATES };
    for (const c of Object.keys(rates) as Currency[]) {
      const r = c === "VND" ? 1 : j.rates[c];
      if (typeof r === "number" && r > 0 && r < 1) rates[c] = r; // sanity: 1 VND is worth far less than 1 of any of these
    }
    return { rates, live: true, asOf: j.time_last_update_utc ?? null };
  } catch (e) {
    console.error("[fx] using fallback rates:", e instanceof Error ? e.message : e);
    return { rates: FALLBACK_RATES, live: false, asOf: null };
  }
}
