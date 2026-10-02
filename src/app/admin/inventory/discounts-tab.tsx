"use client";

import { useState } from "react";
import { applySale, categoryDiscount, clearSale } from "./actions";
import { inScope, salePrice, SCOPE_LABEL, type Scope, type SpotAdjustment, type StockRow } from "./admin-types";
import type { Api } from "./dashboard";
import SpotCalculator from "./spot-calculator";

const VND = new Intl.NumberFormat("vi-VN");
const PAGE = 30;
const input = "block border-b border-charcoal/30 bg-transparent py-2 text-base tabular-nums outline-none transition-colors duration-500 focus:border-obsidian";

function CategoryTool({ api }: { api: Api }) {
  const [scope, setScope] = useState<Scope>("rings");
  const [percentText, setPercentText] = useState("5");
  const [confirm, setConfirm] = useState<"apply" | "reset" | null>(null);
  const [busy, setBusy] = useState(false);

  const percent = Number(percentText.replace(",", "."));
  const valid = percentText.trim() !== "" && Number.isFinite(percent) && percent > 0 && percent < 100 && Math.round(percent * 100) === percent * 100;
  const inCat = api.rows.filter((r) => !r.is_archived && inScope(r, scope));
  const onSale = inCat.filter((r) => r.original_price_vnd != null);

  const run = async (kind: "apply" | "reset") => {
    setBusy(true);
    const res = await categoryDiscount(scope, kind === "apply" ? percent : null);
    setBusy(false);
    setConfirm(null);
    if (res.ok) {
      api.replaceRows(res.rows);
      api.toast(kind === "apply" ? `${percent}% off applied to ${res.rows.length} ${SCOPE_LABEL[scope].toLowerCase()}` : `Sale ended on ${res.rows.length} ${SCOPE_LABEL[scope].toLowerCase()}`);
    } else api.toast(res.error, "error");
  };

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">Category discount</h2>
      <p className="mt-2 max-w-xl text-[0.8rem] leading-relaxed text-muted-gray">Takes a percentage off every piece in a category. It always works from each piece&rsquo;s original price, so applying 5% twice is still 5%. Reset puts every price back.</p>
      <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-5">
        <label className="text-[0.8rem] text-muted-gray">Category
          <select value={scope} onChange={(e) => { setScope(e.target.value as Scope); setConfirm(null); }} className={`${input} mt-1 pr-4 text-obsidian`}>
            {(Object.keys(SCOPE_LABEL) as Scope[]).map((s) => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="text-[0.8rem] text-muted-gray">Percent off
          <span className="mt-1 flex items-baseline gap-1"><input inputMode="decimal" value={percentText} onChange={(e) => { setPercentText(e.target.value); setConfirm(null); }} className={`${input} w-20 text-right text-obsidian`} aria-invalid={!valid} /><span aria-hidden>%</span></span>
        </label>
        {confirm === "apply" ? (
          <span className="flex items-center gap-4">
            <button onClick={() => void run("apply")} disabled={busy} className="eyebrow bg-obsidian px-6 py-4 text-[0.6rem] text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-50">{busy ? "Applying" : `Confirm ${percent}% off ${inCat.length} pieces`}</button>
            <button onClick={() => setConfirm(null)} className="text-[0.8rem] text-muted-gray underline underline-offset-[5px]">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirm("apply")} disabled={!valid || inCat.length === 0 || busy} className="eyebrow border border-charcoal/30 px-6 py-4 text-[0.6rem] transition-colors duration-500 hover:border-champagne disabled:opacity-40 disabled:hover:border-charcoal/30">Apply to {inCat.length} pieces</button>
        )}
        {confirm === "reset" ? (
          <span className="flex items-center gap-4">
            <button onClick={() => void run("reset")} disabled={busy} className="eyebrow bg-obsidian px-6 py-4 text-[0.6rem] text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-50">{busy ? "Resetting" : `Confirm reset of ${onSale.length} pieces`}</button>
            <button onClick={() => setConfirm(null)} className="text-[0.8rem] text-muted-gray underline underline-offset-[5px]">Cancel</button>
          </span>
        ) : (
          <button onClick={() => setConfirm("reset")} disabled={onSale.length === 0 || busy} className="eyebrow border border-charcoal/30 px-6 py-4 text-[0.6rem] transition-colors duration-500 hover:border-champagne disabled:opacity-40 disabled:hover:border-charcoal/30">Reset {onSale.length} on sale</button>
        )}
      </div>
      {!valid && percentText.trim() !== "" && <p role="alert" className="mt-3 text-[0.78rem] text-obsidian">Enter a percentage above 0 and below 100.</p>}
    </section>
  );
}

function SaleRow({ row, api }: { row: StockRow; api: Api }) {
  const [original, setOriginal] = useState(String(row.original_price_vnd ?? row.price_vnd));
  const [percentText, setPercentText] = useState(row.discount_percent != null ? String(row.discount_percent) : "");
  const [busy, setBusy] = useState(false);
  const onSale = row.original_price_vnd != null;

  const o = Number(original.replace(/[\s.,]/g, ""));
  const p = Number(percentText.replace(",", "."));
  const valid = Number.isInteger(o) && o > 0 && percentText.trim() !== "" && Number.isFinite(p) && p > 0 && p < 100 && Math.round(p * 100) === p * 100;
  const preview = valid ? salePrice(o, p) : null;
  const wrap = async (call: () => ReturnType<typeof applySale>, msg: string) => { setBusy(true); await api.commit(row.id, null, call, msg); setBusy(false); };

  return (
    <li className="border-b border-charcoal/10 py-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-56">
          <p className="font-display truncate text-xl">{row.name}</p>
          <p className="mt-1 text-[0.75rem] tabular-nums text-muted-gray">
            {onSale ? <><s>{VND.format(row.original_price_vnd!)} ₫</s> <span aria-hidden>→</span> <span className="text-obsidian">{VND.format(row.price_vnd)} ₫</span> <span className="text-champagne-deep">(-{row.discount_percent}%)</span></> : <>{VND.format(row.price_vnd)} ₫</>}
          </p>
        </div>
        <label className="text-[0.72rem] text-muted-gray">Original price
          <input inputMode="numeric" value={original} onChange={(e) => setOriginal(e.target.value)} className={`${input} mt-1 w-36 text-right text-obsidian`} />
        </label>
        <label className="text-[0.72rem] text-muted-gray">% off
          <input inputMode="decimal" value={percentText} onChange={(e) => setPercentText(e.target.value)} className={`${input} mt-1 w-20 text-right text-obsidian`} />
        </label>
        <p className="w-36 pb-2 text-right text-[0.8rem] tabular-nums text-obsidian/70" aria-live="polite">{preview ? `${VND.format(preview)} ₫` : ""}</p>
        <div className="flex items-center gap-4 pb-1">
          <button onClick={() => void wrap(() => applySale(row.id, o, p), `Sale set on ${row.name}`)} disabled={!valid || busy} className="eyebrow border border-charcoal/30 px-5 py-3 text-[0.6rem] transition-colors duration-500 hover:border-champagne disabled:opacity-40 disabled:hover:border-charcoal/30">{onSale ? "Update sale" : "Apply sale"}</button>
          {onSale && <button onClick={() => void wrap(() => clearSale(row.id), `Sale ended on ${row.name}`)} disabled={busy} className="text-[0.8rem] text-muted-gray underline underline-offset-[5px] hover:text-obsidian disabled:opacity-50">End sale</button>}
        </div>
      </div>
    </li>
  );
}

export default function DiscountsTab({ api, spot }: { api: Api; spot: { ready: boolean; last: SpotAdjustment | null } }) {
  const [query, setQuery] = useState("");
  const [saleOnly, setSaleOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const q = query.trim().toLowerCase();
  const active = api.rows.filter((r) => !r.is_archived);
  const list = active.filter((r) => (!saleOnly || r.original_price_vnd != null) && (!q || r.name.toLowerCase().includes(q) || r.slug.includes(q) || r.id.toLowerCase().includes(q)));
  const onSaleCount = active.filter((r) => r.original_price_vnd != null).length;

  return (
    <div>
      <SpotCalculator api={api} ready={spot.ready} initialLast={spot.last} />
      <CategoryTool api={api} />
      <section className="mt-16 border-t border-charcoal/10 pt-8">
        <h2 className="font-display text-2xl">Per-product sale pricing</h2>
        <p className="mt-2 max-w-xl text-[0.8rem] leading-relaxed text-muted-gray">Set the original price and the percentage off. The storefront shows a Sale badge, the old price struck through and the new price. {onSaleCount} pieces are on sale now.</p>
        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }} placeholder="Search by name or slug" aria-label="Search pieces" className="w-full max-w-xs border-b border-charcoal/30 bg-transparent py-3 text-base outline-none transition-colors duration-500 focus:border-obsidian" />
          <label className="flex items-center gap-2 py-3 text-[0.8rem] text-obsidian/80"><input type="checkbox" checked={saleOnly} onChange={(e) => { setSaleOnly(e.target.checked); setShown(PAGE); }} className="h-4 w-4 accent-obsidian" />On sale only</label>
        </div>
        <ul className="mt-4">{list.slice(0, shown).map((r) => <SaleRow key={`${r.id}|${r.price_vnd}|${r.original_price_vnd}`} row={r} api={api} />)}</ul>
        {list.length === 0 && <p className="py-12 text-muted-gray">No piece matches.</p>}
        {shown < list.length && <button onClick={() => setShown((n) => n + PAGE)} className="eyebrow mt-10 border border-charcoal/30 px-8 py-4 text-[0.6rem] transition-colors duration-500 hover:border-champagne">Show more ({list.length - shown} remaining)</button>}
      </section>
    </div>
  );
}
