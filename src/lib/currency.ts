import type { Currency } from "./types";

export const CURRENCIES: Currency[] = ["VND", "USD", "EUR", "GBP", "AUD", "NZD"];
export const SYMBOL: Record<Currency, string> = { VND: "₫", USD: "$", EUR: "€", GBP: "£", AUD: "A$", NZD: "NZ$" };

/** Indicative rates (units per 1 VND), used until/unless live rates load (see lib/fx.ts). */
export const FALLBACK_RATES: Record<Currency, number> = { VND: 1, USD: 1 / 25400, EUR: 1 / 29600, GBP: 1 / 33800, AUD: 1 / 16600, NZD: 1 / 15100 };

let rates: Record<Currency, number> = FALLBACK_RATES;
/** Called once per page by Providers with the server's rates, before anything renders a price. */
export function applyRates(next: Record<Currency, number>) { rates = next; }
export const currentRates = () => rates;

export function formatMoney(vnd: number, c: Currency): string {
  const v = vnd * rates[c];
  if (c === "VND") return new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " ₫";
  return SYMBOL[c] + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(v));
}
