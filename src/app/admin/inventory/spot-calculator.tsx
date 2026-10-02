"use client";

import { useEffect, useRef, useState } from "react";
import { applySpot, previewSpot, undoSpot } from "./actions";
import { SPOT_KEYS, type SpotAdjustment, type SpotSample } from "./admin-types";
import type { Api } from "./dashboard";

const VND = new Intl.NumberFormat("vi-VN");
const keyLabel = (k: string) => SPOT_KEYS.find((x) => x.key === k)?.label ?? k;
const fmtPct = (p: number) => `${p > 0 ? "+" : ""}${p}%`;
const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

interface Review { count: number; samples: SpotSample[]; keys: string[]; percent: number }

function ConfirmDialog({ review, busy, onConfirm, onCancel }: { review: Review; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancel.current?.focus(); // the safe choice has focus
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [busy, onCancel]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/40 px-5">
      <div role="dialog" aria-modal="true" aria-labelledby="spot-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto bg-alabaster p-8 md:p-10">
        <h3 id="spot-title" className="font-display text-3xl leading-tight">Re-calculate {review.count} product prices?</h3>
        <p className="mt-4 text-[0.9rem] leading-relaxed text-obsidian/80">
          {fmtPct(review.percent)} on {review.keys.map(keyLabel).join(", ")}. Every other metal keeps its price. Ready-to-ship pieces and archived pieces are not touched.
        </p>
        {review.samples.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-charcoal/10 pt-4 text-[0.8rem]">
            {review.samples.map((s) => (
              <li key={s.name} className="flex flex-wrap justify-between gap-x-4">
                <span className="truncate">{s.name} <span className="text-muted-gray">({keyLabel(s.key)})</span></span>
                <span className="tabular-nums"><s className="text-muted-gray">{VND.format(s.from)}</s> <span aria-hidden>→</span> {VND.format(s.to)} ₫</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-[0.75rem] leading-relaxed text-muted-gray">The previous prices are saved, so the last adjustment can be undone from this screen.</p>
        <div className="mt-8 flex items-center gap-4">
          <button onClick={onConfirm} disabled={busy} className="eyebrow bg-obsidian px-8 py-4 text-[0.62rem] text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-50">{busy ? "Updating prices" : `Re-calculate ${review.count} prices`}</button>
          <button ref={cancel} onClick={onCancel} disabled={busy} className="text-[0.85rem] text-muted-gray underline underline-offset-[5px] hover:text-obsidian">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function SpotCalculator({ api, ready, initialLast }: { api: Api; ready: boolean; initialLast: SpotAdjustment | null }) {
  const [keys, setKeys] = useState<string[]>([]);
  const [percentText, setPercentText] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [last, setLast] = useState(initialLast);
  const [busy, setBusy] = useState(false);

  const percent = Number(percentText.replace(",", "."));
  const valid = percentText.trim() !== "" && Number.isFinite(percent) && percent !== 0 && Math.abs(percent) <= 50 && Math.round(percent * 100) === percent * 100;

  const openReview = async () => {
    setBusy(true);
    const res = await previewSpot(keys, percent);
    setBusy(false);
    if (!res.ok) return api.toast(res.error, "error");
    if (res.count === 0) return api.toast("No piece has those metals.", "error");
    setReview({ count: res.count, samples: res.samples, keys, percent });
  };

  const confirm = async () => {
    if (!review) return;
    setBusy(true);
    const res = await applySpot(review.keys, review.percent);
    setBusy(false);
    setReview(null);
    if (res.ok) {
      api.replaceRows(res.rows);
      setLast(res.adjustment);
      setPercentText("");
      api.toast(`${res.rows.length} prices re-calculated (${fmtPct(res.adjustment.percent)})`);
    } else api.toast(res.error, "error");
  };

  const undo = async () => {
    setBusy(true);
    const res = await undoSpot();
    setBusy(false);
    if (res.ok) {
      api.replaceRows(res.rows);
      setLast(null);
      api.toast(`Restored ${res.rows.length} prices to before the ${fmtPct(res.undone.percent)} adjustment`);
    } else api.toast(res.error, "error");
  };

  return (
    <section className="mt-8 border-b border-charcoal/10 pb-12">
      <h2 className="font-display text-2xl">Global metal price multiplier</h2>
      <p className="mt-2 max-w-xl text-[0.8rem] leading-relaxed text-muted-gray">When the gold or platinum price moves, shift the matching prices in one step: for example +5% on 18k gold. Only the metals you tick change; the others keep their price. It applies to pieces with metal options, not ready-to-ship stock.</p>

      <fieldset className="mt-6">
        <legend className="text-[0.8rem] text-muted-gray">Metals to adjust</legend>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {SPOT_KEYS.map((k) => (
            <label key={k.key} className="flex items-center gap-2 text-base">
              <input type="checkbox" checked={keys.includes(k.key)} onChange={(e) => setKeys((c) => (e.target.checked ? [...c, k.key] : c.filter((x) => x !== k.key)))} className="h-4 w-4 accent-obsidian" />
              {k.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
        <label className="text-[0.8rem] text-muted-gray">Offset
          <span className="mt-1 flex items-baseline gap-1"><input inputMode="decimal" value={percentText} onChange={(e) => setPercentText(e.target.value)} placeholder="+5 or -3" aria-invalid={percentText.trim() !== "" && !valid} className="block w-24 border-b border-charcoal/30 bg-transparent py-2 text-right text-base tabular-nums text-obsidian outline-none transition-colors duration-500 focus:border-obsidian" /><span aria-hidden>%</span></span>
        </label>
        <button onClick={() => void openReview()} disabled={!ready || !keys.length || !valid || busy} className="eyebrow border border-charcoal/30 px-6 py-4 text-[0.6rem] transition-colors duration-500 hover:border-champagne disabled:opacity-40 disabled:hover:border-charcoal/30">Review changes</button>
      </div>
      {percentText.trim() !== "" && !valid && <p role="alert" className="mt-3 text-[0.78rem] text-obsidian">Enter a percentage between -50 and +50.</p>}
      {!ready && <p role="alert" className="mt-4 max-w-xl text-[0.78rem] leading-relaxed text-obsidian">Adjustments are switched off until the price log exists. Run the latest supabase/schema.sql in the Supabase SQL editor, then reload.</p>}

      {last && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8rem] text-obsidian/80">
          <span>Last adjustment: {fmtPct(last.percent)} on {last.metal_keys.map(keyLabel).join(", ")}, {last.item_count} pieces, {fmtDate(last.created_at)}.</span>
          <button onClick={() => void undo()} disabled={busy} className="text-champagne-deep underline underline-offset-[5px] hover:text-obsidian disabled:opacity-50">Undo</button>
        </p>
      )}

      {review && <ConfirmDialog review={review} busy={busy} onConfirm={() => void confirm()} onCancel={() => setReview(null)} />}
    </section>
  );
}
