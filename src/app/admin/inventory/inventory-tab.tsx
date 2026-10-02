"use client";

import { useState } from "react";
import { setFlag, setPrice, updateCertificate, updateImages } from "./actions";
import { inScope, SCOPE_LABEL, type Scope, type StockRow } from "./admin-types";
import type { Api } from "./dashboard";
import CertificateField from "./certificate-field";
import EditModal from "./edit-modal";
import ImageDropzone from "./image-dropzone";

const PAGE = 40;

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l.9 12.5h9.2L17.5 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  );
}

function Switch({ on, label, onClick, disabled }: { on: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} role="switch" aria-checked={on} className="group flex items-center gap-3 py-2 text-left disabled:opacity-50">
      <span className={`relative block h-5 w-9 shrink-0 border transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "border-obsidian bg-obsidian" : "border-charcoal/30"}`}>
        <span className={`absolute top-[3px] block h-3 w-3 transition-[left,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${on ? "left-[19px] bg-alabaster" : "left-[3px] bg-charcoal/50"}`} />
      </span>
      <span className="text-[0.78rem] text-obsidian/80">{label}</span>
    </button>
  );
}

function PriceInput({ row, api }: { row: StockRow; api: Api }) {
  const [draft, setDraft] = useState(String(row.price_vnd));
  const onSale = row.original_price_vnd != null;
  const save = () => {
    const n = Number(draft.replace(/[\s.,]/g, ""));
    if (onSale || n === row.price_vnd) { setDraft(String(row.price_vnd)); return; }
    void api.commit(row.id, null, () => setPrice(row.id, n)).then((ok) => { if (!ok) setDraft(String(row.price_vnd)); });
  };
  return (
    <label className="flex items-center gap-2 text-[0.75rem] text-muted-gray">
      <span className="sr-only">Price in VND for {row.name}</span>
      <input
        inputMode="numeric"
        value={onSale ? String(row.price_vnd) : draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        disabled={onSale}
        title={onSale ? "On sale: change the price in Discounts & Pricing" : undefined}
        className="w-36 border-b border-charcoal/30 bg-transparent py-2 text-right text-base tabular-nums text-obsidian outline-none transition-colors duration-500 focus:border-obsidian disabled:border-transparent disabled:text-obsidian/60"
      />
      <span aria-hidden>₫</span>
      {onSale && <span className="eyebrow text-[0.55rem] text-champagne-deep">On sale</span>}
    </label>
  );
}

function Media({ row, api }: { row: StockRow; api: Api }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState(row.images);
  const [busy, setBusy] = useState(false);
  const dirty = urls.length !== row.images.length || urls.some((u, i) => u !== row.images[i]);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="eyebrow mt-3 text-[0.58rem] text-muted-gray underline underline-offset-[6px] transition-colors hover:text-obsidian">
        Photos ({row.images.length}){row.certificate_url ? " and certificate" : ""}
      </button>
      {open && (
        <div className="mt-4 space-y-5">
          <ImageDropzone urls={urls} setUrls={setUrls} onBusy={setBusy} />
          <p className="text-[0.72rem] leading-relaxed text-muted-gray">Saving replaces all of this piece&rsquo;s photos, including any per-metal finish photos it had.</p>
          <button
            onClick={() => void api.commit(row.id, null, () => updateImages(row.id, urls))}
            disabled={!dirty || busy || urls.length === 0}
            className="eyebrow border border-charcoal/30 px-6 py-3 text-[0.6rem] transition-colors duration-500 hover:border-champagne disabled:opacity-40 disabled:hover:border-charcoal/30"
          >
            {busy ? "Uploading photos" : "Save photos"}
          </button>
          <div>
            <p className="mb-2 text-[0.8rem] text-muted-gray">GIA / IGI certificate</p>
            <CertificateField url={row.certificate_url} onChange={(url) => void api.commit(row.id, null, () => updateCertificate(row.id, url))} />
          </div>
        </div>
      )}
    </>
  );
}

function Row({ row, api, onEdit }: { row: StockRow; api: Api; onEdit: () => void }) {
  const flag = (key: "is_sold" | "is_ready_to_ship") => void api.commit(row.id, { [key]: !row[key] }, () => setFlag(row.id, key, !row[key]));
  const archive = () => void api.commit(row.id, { is_archived: true }, () => setFlag(row.id, "is_archived", true), `Moved ${row.name} to the archive`);
  return (
    <li className="border-b border-charcoal/10 py-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className={`font-display truncate text-xl ${row.is_sold ? "text-obsidian/50" : ""}`}>{row.name}</p>
          <p className="mt-1 truncate text-[0.75rem] text-muted-gray">{row.id} <span aria-hidden>·</span> {row.slug}</p>
        </div>
        <PriceInput key={row.price_vnd} row={row} api={api} />
        <div className="flex items-center gap-6">
          <Switch on={row.is_sold} label="Sold out" onClick={() => flag("is_sold")} />
          <Switch on={row.is_ready_to_ship} label="Ready to ship" onClick={() => flag("is_ready_to_ship")} />
          <button onClick={onEdit} aria-label={`Edit ${row.name}`} className="eyebrow border border-charcoal/25 px-4 py-2.5 text-[0.58rem] transition-colors duration-500 hover:border-champagne">Edit</button>
          <button onClick={archive} aria-label={`Archive / Trash ${row.name}`} title="Archive / Trash" className="flex h-9 w-9 items-center justify-center text-muted-gray transition-colors duration-500 hover:text-obsidian"><TrashIcon /></button>
        </div>
      </div>
      <Media key={row.images.join("|")} row={row} api={api} />
    </li>
  );
}

export default function InventoryTab({ api }: { api: Api }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope | "all">("all");
  const [readyOnly, setReadyOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [showArchive, setShowArchive] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const active = api.rows.filter((r) => !r.is_archived);
  const archived = api.rows.filter((r) => r.is_archived);
  const list = active.filter((r) => (scope === "all" || inScope(r, scope)) && (!readyOnly || r.is_ready_to_ship) && (!q || r.name.toLowerCase().includes(q) || r.slug.includes(q) || r.id.toLowerCase().includes(q)));
  const reset = () => setShown(PAGE);

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-5">
        <input value={query} onChange={(e) => { setQuery(e.target.value); reset(); }} placeholder="Search by name or slug" aria-label="Search pieces" className="w-full max-w-xs border-b border-charcoal/30 bg-transparent py-3 text-base outline-none transition-colors duration-500 focus:border-obsidian" />
        <label className="text-[0.8rem] text-muted-gray">
          <span className="sr-only">Category</span>
          <select value={scope} onChange={(e) => { setScope(e.target.value as Scope | "all"); reset(); }} className="border-b border-charcoal/30 bg-transparent py-3 text-base text-obsidian outline-none focus:border-obsidian">
            <option value="all">All categories</option>
            {(Object.keys(SCOPE_LABEL) as Scope[]).map((s) => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 py-3 text-[0.8rem] text-obsidian/80">
          <input type="checkbox" checked={readyOnly} onChange={(e) => { setReadyOnly(e.target.checked); reset(); }} className="h-4 w-4 accent-obsidian" />
          Ready to ship only
        </label>
        <p className="ml-auto pb-3 text-[0.8rem] text-muted-gray">{list.length} of {active.length} pieces</p>
      </div>

      <ul className="mt-4">{list.slice(0, shown).map((r) => <Row key={r.id} row={r} api={api} onEdit={() => setEditId(r.id)} />)}</ul>
      {list.length === 0 && <p className="py-12 text-muted-gray">No piece matches.</p>}
      {shown < list.length && <button onClick={() => setShown((n) => n + PAGE)} className="eyebrow mt-10 border border-charcoal/30 px-8 py-4 text-[0.6rem] transition-colors duration-500 hover:border-champagne">Show more ({list.length - shown} remaining)</button>}

      {editId && <EditModal key={editId} id={editId} api={api} onClose={() => setEditId(null)} />}

      <section className="mt-16 border-t border-charcoal/10 pt-6">
        <button onClick={() => setShowArchive((o) => !o)} aria-expanded={showArchive} className="flex w-full items-center justify-between py-2 text-left">
          <span className="font-display text-2xl">Archive ({archived.length})</span>
          <span aria-hidden className="relative block h-3 w-3"><span className="absolute left-0 top-1/2 h-px w-full bg-current" /><span className={`absolute left-0 top-1/2 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showArchive ? "rotate-0" : "rotate-90"}`} /></span>
        </button>
        {showArchive && (
          <div className="mt-4">
            <p className="text-[0.78rem] text-muted-gray">Archived pieces are hidden from the storefront. Nothing is deleted.</p>
            <ul>
              {archived.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-6 border-b border-charcoal/10 py-4">
                  <div className="min-w-0">
                    <p className="font-display truncate text-lg text-obsidian/60">{r.name}</p>
                    <p className="mt-0.5 truncate text-[0.72rem] text-muted-gray">{r.id}</p>
                  </div>
                  <button onClick={() => void api.commit(r.id, { is_archived: false }, () => setFlag(r.id, "is_archived", false), `Restored ${r.name}`)} className="eyebrow shrink-0 border border-charcoal/25 px-5 py-3 text-[0.6rem] transition-colors duration-500 hover:border-champagne">Restore</button>
                </li>
              ))}
            </ul>
            {archived.length === 0 && <p className="py-6 text-muted-gray">The archive is empty.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
