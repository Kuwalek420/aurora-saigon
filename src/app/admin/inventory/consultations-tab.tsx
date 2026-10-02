"use client";

import { useState } from "react";
import { createConsultation, updateConsultation } from "./actions";
import { STATUSES, type ConsultationInput, type ConsultationRow, type Status } from "./admin-types";
import type { Api } from "./dashboard";

const field = "mt-2 block w-full border-b border-charcoal/30 bg-transparent py-3 text-base text-obsidian outline-none transition-colors duration-500 focus:border-obsidian";
const label = "block text-[0.8rem] text-muted-gray";
const BLANK: ConsultationInput = { client_name: "", email: "", phone: "", preferred_date: "", status: "New Inquiry", notes: "" };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Item({ row, onChange, api }: { row: ConsultationRow; onChange: (r: ConsultationRow) => void; api: Api }) {
  const [notes, setNotes] = useState(row.notes);
  const [busy, setBusy] = useState(false);
  const dirty = notes.trim() !== row.notes;

  const setStatus = async (status: Status) => {
    const prev = row;
    onChange({ ...row, status }); // optimistic
    const res = await updateConsultation(row.id, { status });
    if (res.ok) { onChange(res.row); api.toast("Inquiry updated"); }
    else { onChange(prev); api.toast(res.error, "error"); }
  };
  const saveNotes = async () => {
    setBusy(true);
    const res = await updateConsultation(row.id, { notes });
    setBusy(false);
    if (res.ok) { onChange(res.row); setNotes(res.row.notes); api.toast("Notes saved"); }
    else api.toast(res.error, "error");
  };

  return (
    <li className="border-b border-charcoal/10 py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
        <div className="min-w-0 flex-1 basis-60">
          <p className="font-display text-xl">{row.client_name}</p>
          <p className="mt-1 flex flex-wrap gap-x-4 text-[0.8rem] text-obsidian/80">
            {row.email && <a href={`mailto:${row.email}`} className="underline decoration-charcoal/25 underline-offset-[4px] hover:decoration-champagne">{row.email}</a>}
            {row.phone && <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className="underline decoration-charcoal/25 underline-offset-[4px] hover:decoration-champagne">{row.phone}</a>}
          </p>
          <p className="mt-1 text-[0.75rem] text-muted-gray">
            {row.preferred_date ? `Preferred date ${fmt(row.preferred_date)}` : "No preferred date"} <span aria-hidden>·</span> logged {fmt(row.created_at)}
          </p>
        </div>
        <label className="text-[0.75rem] text-muted-gray">Status
          <select value={row.status} onChange={(e) => void setStatus(e.target.value as Status)} className="mt-1 block border-b border-charcoal/30 bg-transparent py-2 text-base text-obsidian outline-none focus:border-obsidian">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-[0.75rem] text-muted-gray">Internal notes (staff only)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={4000} className="mt-1 block w-full resize-y border border-charcoal/15 bg-transparent p-3 text-[0.9rem] text-obsidian outline-none transition-colors duration-500 focus:border-obsidian" />
      </label>
      {dirty && <button onClick={() => void saveNotes()} disabled={busy} className="eyebrow mt-3 border border-charcoal/30 px-5 py-3 text-[0.6rem] transition-colors duration-500 hover:border-champagne disabled:opacity-50">{busy ? "Saving" : "Save notes"}</button>}
    </li>
  );
}

export default function ConsultationsTab({ api, initial, error }: { api: Api; initial: ConsultationRow[]; error: string | null }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ConsultationInput>(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])) as Record<Status, number>;
  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const set = <K extends keyof ConsultationInput>(k: K, v: ConsultationInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const res = await createConsultation(form);
    setSaving(false);
    if (res.ok) { setRows((r) => [res.row, ...r]); setForm(BLANK); setOpen(false); api.toast("Inquiry added"); }
    else setFormError(res.error);
  };

  if (error) {
    return <p role="alert" className="mt-8 max-w-xl text-sm leading-relaxed text-obsidian">Could not read the consultations table: {error}. Run the latest supabase/schema.sql in the Supabase SQL editor (it creates the table), then reload.</p>;
  }

  return (
    <div>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3" role="group" aria-label="Filter by status">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`eyebrow pb-2 text-[0.6rem] transition-colors duration-500 ${filter === s ? "border-b border-obsidian text-obsidian" : "text-muted-gray hover:text-obsidian"}`}>
            {s === "all" ? `All (${rows.length})` : `${s} (${counts[s]})`}
          </button>
        ))}
      </div>

      <section className="mt-8 border-b border-charcoal/10 pb-6">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-2 text-left">
          <span className="font-display text-2xl">Log an inquiry</span>
          <span aria-hidden className="relative block h-3 w-3"><span className="absolute left-0 top-1/2 h-px w-full bg-current" /><span className={`absolute left-0 top-1/2 h-px w-full bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-0" : "rotate-90"}`} /></span>
        </button>
        {open && (
          <form onSubmit={add} className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
            <label className={`${label} md:col-span-2`}>Client name
              <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} required maxLength={120} className={field} />
            </label>
            <label className={label}>Email
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={200} className={field} />
            </label>
            <label className={label}>Phone
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} className={field} />
            </label>
            <label className={label}>Preferred date
              <input type="date" value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} className={field} />
            </label>
            <label className={label}>Status
              <select value={form.status} onChange={(e) => set("status", e.target.value as Status)} className={field}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className={`${label} md:col-span-2`}>Notes (staff only)
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} maxLength={4000} className={`${field} resize-y`} />
            </label>
            <div className="md:col-span-2">
              {formError && <p role="alert" className="mb-3 text-[0.85rem] text-obsidian">{formError}</p>}
              <button disabled={saving} className="eyebrow bg-obsidian px-8 py-4 text-[0.62rem] text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-50">{saving ? "Adding" : "Add inquiry"}</button>
            </div>
          </form>
        )}
      </section>

      <ul>{shown.map((r) => <Item key={r.id} row={r} api={api} onChange={(n) => setRows((all) => all.map((x) => (x.id === n.id ? n : x)))} />)}</ul>
      {shown.length === 0 && <p className="py-12 text-muted-gray">{rows.length === 0 ? "No inquiries yet. Log the first one above." : "Nothing with this status."}</p>}
    </div>
  );
}
