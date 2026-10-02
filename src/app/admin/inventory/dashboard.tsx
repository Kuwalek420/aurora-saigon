"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logout } from "./actions";
import type { ConsultationRow, SpotAdjustment, StockRow } from "./admin-types";
import AddProductTab from "./add-product-tab";
import BannerTab from "./banner-tab";
import ConsultationsTab from "./consultations-tab";
import DiscountsTab from "./discounts-tab";
import InventoryTab from "./inventory-tab";

export type RowCall = () => Promise<{ ok: true; row: StockRow } | { ok: false; error: string }>;

/** What every tab gets: the shared rows plus ways to change them and to tell the admin what happened. */
export interface Api {
  rows: StockRow[];
  replaceRows: (rows: StockRow[]) => void;
  addRow: (row: StockRow) => void;
  /** Optimistic update: show `optimistic` now, run the server call, then keep the stored row (or roll back and say why). */
  commit: (id: string, optimistic: Partial<StockRow> | null, call: RowCall, message?: string) => Promise<boolean>;
  toast: (message: string, kind?: "ok" | "error") => void;
}

const TABS = ["1. Inventory & Stock", "2. Add Product & Media", "3. Discounts & Pricing", "4. Storefront Banner", "5. Consultations & Bespoke Requests"] as const;

export default function Dashboard({ initialRows, announcement, consultations, spot }: { initialRows: StockRow[]; announcement: { enabled: boolean; message: string; link: string }; consultations: { rows: ConsultationRow[]; error: string | null }; spot: { ready: boolean; last: SpotAdjustment | null } }) {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState(initialRows);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const [note, setNote] = useState<{ id: number; message: string; kind: "ok" | "error" } | null>(null);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), note.kind === "error" ? 6000 : 2800);
    return () => clearTimeout(t);
  }, [note]);

  const toast = useCallback((message: string, kind: "ok" | "error" = "ok") => setNote({ id: Date.now(), message, kind }), []);
  const replaceRows = useCallback((next: StockRow[]) => setRows((all) => { const m = new Map(next.map((r) => [r.id, r])); return all.map((r) => m.get(r.id) ?? r); }), []);
  const addRow = useCallback((row: StockRow) => setRows((all) => [row, ...all]), []);

  const commit = useCallback<Api["commit"]>(async (id, optimistic, call, message = "Inventory updated successfully") => {
    const prev = rowsRef.current.find((r) => r.id === id);
    if (optimistic) setRows((all) => all.map((r) => (r.id === id ? { ...r, ...optimistic } : r)));
    const res = await call();
    if (res.ok) { replaceRows([res.row]); toast(message); return true; }
    if (prev) replaceRows([prev]);
    toast(res.error, "error");
    return false;
  }, [replaceRows, toast]);

  const api: Api = { rows, replaceRows, addRow, commit, toast };

  return (
    <div>
      <div className="hide-scroll mt-10 flex gap-8 overflow-x-auto border-b border-charcoal/10" role="tablist" aria-label="Admin sections">
        {TABS.map((label, i) => (
          <button key={label} role="tab" id={`tab-${i}`} aria-selected={tab === i} aria-controls={`panel-${i}`} onClick={() => setTab(i)} className={`eyebrow relative shrink-0 pb-4 text-[0.62rem] transition-colors duration-500 ${tab === i ? "text-obsidian" : "text-muted-gray hover:text-obsidian"}`}>
            {label}
            {tab === i && <span className="absolute inset-x-0 -bottom-px h-px bg-obsidian" />}
          </button>
        ))}
      </div>

      {/* all four stay mounted so a half-filled form or an upload in progress survives a tab switch */}
      <div role="tabpanel" id="panel-0" aria-labelledby="tab-0" hidden={tab !== 0}><InventoryTab api={api} /></div>
      <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" hidden={tab !== 1}><AddProductTab api={api} /></div>
      <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden={tab !== 2}><DiscountsTab api={api} spot={spot} /></div>
      <div role="tabpanel" id="panel-3" aria-labelledby="tab-3" hidden={tab !== 3}><BannerTab api={api} initial={announcement} /></div>
      <div role="tabpanel" id="panel-4" aria-labelledby="tab-4" hidden={tab !== 4}><ConsultationsTab api={api} initial={consultations.rows} error={consultations.error} /></div>

      <form action={logout} className="mt-16">
        <button className="eyebrow text-[0.6rem] text-muted-gray underline underline-offset-[6px] transition-colors hover:text-obsidian">Sign out</button>
      </form>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5">
        {note && note.kind === "ok" && <p key={note.id} className="bg-obsidian px-6 py-4 text-[0.85rem] text-alabaster">{note.message}</p>}
      </div>
      <div role="alert" className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5">
        {note && note.kind === "error" && <p key={note.id} className="max-w-md border border-obsidian bg-alabaster px-6 py-4 text-[0.85rem] text-obsidian">{note.message}</p>}
      </div>
    </div>
  );
}
