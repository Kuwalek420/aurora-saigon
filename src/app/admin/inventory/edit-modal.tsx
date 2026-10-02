"use client";

import { useEffect, useRef, useState } from "react";
import { getProductForEdit, updateProduct } from "./actions";
import { inputFromRow, type EditRow, type ProductInput } from "./admin-types";
import type { Api } from "./dashboard";
import ProductFields from "./product-fields";

/** Full edit of one piece, loaded fresh from Supabase. Saves with one UPDATE and refreshes the list row. */
export default function EditModal({ id, api, onClose }: { id: string; api: Api; onClose: () => void }) {
  const [row, setRow] = useState<EditRow | null>(null);
  const [value, setValue] = useState<ProductInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    getProductForEdit(id).then((res) => {
      if (!alive) return;
      if (res.ok) { setRow(res.row); setValue(inputFromRow(res.row, res.row.certificate_url)); }
      else setError(res.error);
    });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose, saving]);

  useEffect(() => { if (value) first.current?.querySelector("input")?.focus(); }, [row]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setSaving(true);
    setError(null);
    const res = await updateProduct(id, value);
    setSaving(false);
    if (res.ok) {
      api.replaceRows([res.row]);
      api.toast("Inventory updated successfully");
      onClose();
    } else setError(res.error);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={row ? `Edit ${row.name}` : "Edit piece"} className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-alabaster">
      <form onSubmit={save} className="mx-auto max-w-3xl px-5 pb-32 pt-14 md:px-10">
        <div className="flex items-start justify-between gap-6">
          <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-light leading-tight">{row ? `Edit ${row.name}` : "Edit piece"}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="eyebrow shrink-0 text-[0.6rem] text-muted-gray transition-colors hover:text-obsidian">Close</button>
        </div>
        {row && <p className="mt-2 text-[0.75rem] text-muted-gray">{row.id} <span aria-hidden>·</span> {row.slug}</p>}

        {!value && !error && <p className="mt-12 text-muted-gray" role="status">Loading</p>}
        {!value && error && <p role="alert" className="mt-12 text-obsidian">{error}</p>}

        {value && row && (
          <>
            <div ref={first} className="mt-10">
              <ProductFields value={value} onChange={(u) => setValue((v) => (v ? (typeof u === "function" ? u(v) : u) : v))} onBusy={setBusy} priceLocked={row.original_price_vnd != null} />
            </div>
            <p className="mt-6 text-[0.72rem] leading-relaxed text-muted-gray">Changing the photos replaces all of this piece&rsquo;s photos, including any per-metal finish photos. Leave them alone to keep them.</p>
            <div className="sticky bottom-0 -mx-5 mt-8 bg-alabaster px-5 py-5 md:-mx-10 md:px-10">
              {error && <p role="alert" className="mb-3 text-[0.85rem] text-obsidian">{error}</p>}
              <div className="flex items-center gap-6">
                <button disabled={saving || busy || value.images.length === 0} className="eyebrow bg-obsidian px-10 py-5 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-40 disabled:hover:bg-obsidian disabled:hover:text-alabaster">
                  {saving ? "Saving" : busy ? "Uploading" : "Save changes"}
                </button>
                <button type="button" onClick={onClose} disabled={saving} className="text-[0.85rem] text-muted-gray underline underline-offset-[5px] hover:text-obsidian">Cancel</button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
