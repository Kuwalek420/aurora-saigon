"use client";

import { useState } from "react";
import { createProduct } from "./actions";
import type { ProductInput } from "./admin-types";
import type { Api } from "./dashboard";
import ProductFields from "./product-fields";

/** Ready-to-ship pieces default to 18k. */
const BLANK: ProductInput = {
  name: "", description: "", nameVi: "", descriptionVi: "", price: null, choice: "Ring", ready: true, metals: [], karats: ["18k"], mainMetal: "",
  gemstone: "", carat: "", stoneSize: "", shape: "", colour: "", clarity: "", certLab: "None", certNumber: "", cutGrade: "", images: [], certificate: null,
};

export default function AddProductTab({ api }: { api: Api }) {
  const [value, setValue] = useState<ProductInput>(BLANK);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await createProduct(value);
    setSaving(false);
    if (res.ok) {
      api.addRow(res.row);
      api.toast(`Created ${res.row.name}. It is on the storefront now.`);
      setValue(BLANK);
    } else setError(res.error);
  };

  return (
    <form onSubmit={submit} className="mt-8">
      <ProductFields value={value} onChange={setValue} onBusy={setBusy} />
      <div className="mt-8">
        {error && <p role="alert" className="mb-4 text-[0.85rem] text-obsidian">{error}</p>}
        <button disabled={saving || busy || value.images.length === 0} className="eyebrow bg-obsidian px-10 py-5 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-40 disabled:hover:bg-obsidian disabled:hover:text-alabaster">
          {saving ? "Creating" : busy ? "Uploading" : "Create piece"}
        </button>
      </div>
    </form>
  );
}
