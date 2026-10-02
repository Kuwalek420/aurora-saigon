"use client";

import type { Dispatch, SetStateAction } from "react";
import { CHOICES, KARAT_OPTIONS, MAIN_METALS, METAL_OPTIONS, SHAPE_SUGGESTIONS, type ProductInput } from "./admin-types";
import { LABS, verifyUrl } from "@/lib/certificate";
import CertificateField from "./certificate-field";
import ImageDropzone from "./image-dropzone";

const field = "mt-2 block w-full border-b border-charcoal/30 bg-transparent py-3 text-base text-obsidian outline-none transition-colors duration-500 focus:border-obsidian disabled:text-obsidian/50";
const label = "block text-[0.8rem] text-muted-gray";

function CheckGroup({ legend, items, selected, onToggle, hint }: { legend: string; items: readonly { value: string; label: string }[]; selected: string[]; onToggle: (value: string, on: boolean) => void; hint?: string }) {
  return (
    <fieldset>
      <legend className={label}>{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {items.map((it) => (
          <label key={it.value} className="flex items-center gap-2 text-base">
            <input type="checkbox" checked={selected.includes(it.value)} onChange={(e) => onToggle(it.value, e.target.checked)} className="h-4 w-4 accent-obsidian" />
            {it.label}
          </label>
        ))}
      </div>
      {hint && <p className="mt-2 text-[0.72rem] leading-relaxed text-muted-gray">{hint}</p>}
    </fieldset>
  );
}

/** The one form behind both "Add product" and the edit modal. Fully controlled: the parent owns the value and does the saving. */
export default function ProductFields({ value, onChange, onBusy, priceLocked = false }: { value: ProductInput; onChange: Dispatch<SetStateAction<ProductInput>>; onBusy: (busy: boolean) => void; priceLocked?: boolean }) {
  const set = <K extends keyof ProductInput>(key: K, v: ProductInput[K]) => onChange((p) => ({ ...p, [key]: v }));
  const verify = verifyUrl(value.certLab, value.certNumber);
  const toggle = (key: "metals" | "karats", item: string, on: boolean) => onChange((p) => ({ ...p, [key]: on ? [...new Set([...p[key], item])] : p[key].filter((x) => x !== item) }));

  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
      <label className={`${label} md:col-span-2`}>Name
        <input value={value.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} placeholder="The Thảo Điền Solitaire" className={field} />
      </label>

      <label className={`${label} md:col-span-2`}>Name (Vietnamese)
        <input value={value.nameVi} onChange={(e) => set("nameVi", e.target.value)} maxLength={120} placeholder="Nhẫn Cầu Hôn Thảo Điền" className={field} />
        <span className="mt-1 block text-[0.72rem]">Optional. Shown when a visitor switches the site to Vietnamese; the English name is used if this is empty.</span>
      </label>

      <label className={label}>Category
        <select value={value.choice} onChange={(e) => set("choice", e.target.value as ProductInput["choice"])} className={field}>
          {CHOICES.map((c) => <option key={c}>{c}</option>)}
          {value.choice === "Other" && <option value="Other">Other fine jewellery (unchanged)</option>}
        </select>
      </label>
      <label className={label}>Price in VND
        <input value={value.price ?? ""} onChange={(e) => { const n = Number(e.target.value.replace(/[\s.,]/g, "")); set("price", e.target.value.trim() === "" ? null : Number.isNaN(n) ? value.price : n); }} inputMode="numeric" disabled={priceLocked} placeholder="58000000" className={`${field} tabular-nums`} />
        {priceLocked && <span className="mt-1 block text-[0.72rem]">On sale: change the price in Discounts &amp; Pricing.</span>}
      </label>

      <label className="flex items-center gap-3 text-base md:col-span-2">
        <input type="checkbox" checked={value.ready} onChange={(e) => set("ready", e.target.checked)} className="h-4 w-4 accent-obsidian" />
        Ready to ship
      </label>

      <div className="md:col-span-2 grid gap-6 border-t border-charcoal/10 pt-6 md:grid-cols-2">
        <CheckGroup
          legend="Metals offered"
          items={METAL_OPTIONS.map((m) => ({ value: m.code, label: `${m.name} (${m.code})` }))}
          selected={value.metals}
          onToggle={(code, on) => {
            toggle("metals", code, on);
            const name = METAL_OPTIONS.find((m) => m.code === code)?.name;
            if (on && name && !value.mainMetal) set("mainMetal", name);
          }}
        />
        <CheckGroup legend="Karats offered" items={KARAT_OPTIONS} selected={value.karats} onToggle={(k, on) => toggle("karats", k, on)} />
        <label className={label}>Main finish (the metal shown on the piece)
          <select value={value.mainMetal} onChange={(e) => set("mainMetal", e.target.value)} className={field}>
            <option value="" disabled>Choose the metal</option>
            {MAIN_METALS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <p className="self-end text-[0.72rem] leading-relaxed text-muted-gray">Shoppers can switch metal and karat only on pieces that have per-metal photography and prices. For other pieces these are recorded and the main finish is shown. Ready-to-ship pieces always show their one stated finish.</p>
      </div>

      <div className="md:col-span-2 grid gap-x-8 gap-y-6 border-t border-charcoal/10 pt-6 md:grid-cols-2">
        <label className={label}>Gemstone / stone type
          <input value={value.gemstone} onChange={(e) => set("gemstone", e.target.value)} maxLength={80} placeholder="Natural Topaz, IGI Lab Diamond" className={field} />
        </label>
        <label className={label}>Shape
          <input value={value.shape} onChange={(e) => set("shape", e.target.value)} list="shape-suggestions" maxLength={40} placeholder="Oval" className={field} />
          <datalist id="shape-suggestions">{SHAPE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
          <span className="mt-1 block text-[0.72rem]">Pick from the list so the shape filters find the piece.</span>
        </label>
        <label className={label}>Stone size
          <input value={value.stoneSize} onChange={(e) => set("stoneSize", e.target.value)} maxLength={40} placeholder="6.5 mm" className={field} />
        </label>
      </div>

      <fieldset className="md:col-span-2 grid gap-x-8 gap-y-6 border-t border-charcoal/10 pt-6 md:grid-cols-2">
        <legend className="font-display -mb-2 pr-4 text-xl">Certificate ledger</legend>
        <label className={label}>Gemological lab
          <select value={value.certLab} onChange={(e) => set("certLab", e.target.value)} className={field}>
            {LABS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className={label}>Certificate number
          <input value={value.certNumber} onChange={(e) => set("certNumber", e.target.value)} maxLength={40} disabled={value.certLab === "None"} placeholder="GIA 2458901234" className={`${field} tabular-nums`} />
          {verify ? (
            <span className="mt-1 block text-[0.72rem]">Verification page: <a href={verify} target="_blank" rel="noopener noreferrer" className="break-all text-champagne-deep underline underline-offset-[4px]">{verify}</a></span>
          ) : value.certLab === "HRD" && value.certNumber ? (
            <span className="mt-1 block text-[0.72rem]">HRD has no link we can build; the number is shown on the product page.</span>
          ) : null}
        </label>
        <label className={label}>Carat weight
          <input value={value.carat} onChange={(e) => set("carat", e.target.value)} maxLength={40} placeholder="1.2 ct" className={field} />
        </label>
        <label className={label}>Cut grade
          <input value={value.cutGrade} onChange={(e) => set("cutGrade", e.target.value)} maxLength={30} placeholder="Excellent" className={field} />
        </label>
        <label className={label}>Colour grade
          <input value={value.colour} onChange={(e) => set("colour", e.target.value)} maxLength={20} placeholder="E" className={field} />
        </label>
        <label className={label}>Clarity grade
          <input value={value.clarity} onChange={(e) => set("clarity", e.target.value)} maxLength={20} placeholder="VS1" className={field} />
        </label>
        <div className="md:col-span-2">
          <p className={`${label} mb-2`}>Certificate PDF (optional)</p>
          <CertificateField url={value.certificate} onChange={(url) => set("certificate", url)} onBusy={onBusy} />
        </div>
      </fieldset>

      <div className="md:col-span-2 border-t border-charcoal/10 pt-6">
        <p className={label}>Photos (the first is the main photo)</p>
        <div className="mt-2">
          <ImageDropzone urls={value.images} setUrls={(u) => onChange((p) => ({ ...p, images: typeof u === "function" ? u(p.images) : u }))} onBusy={onBusy} />
        </div>
      </div>

      <label className={`${label} md:col-span-2`}>Description (Vietnamese)
        <textarea value={value.descriptionVi} onChange={(e) => set("descriptionVi", e.target.value)} rows={5} maxLength={4000} className={`${field} resize-y`} />
        <span className="mt-1 block text-[0.72rem]">Optional. The English description is shown if this is empty.</span>
      </label>

      <label className={`${label} md:col-span-2`}>Description
        <textarea value={value.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={4000} className={`${field} resize-y`} />
      </label>
    </div>
  );
}
