"use client";

import { useEffect } from "react";
import { supabase } from "./supabase";
import { fromRow, PRODUCT_COLUMNS } from "./product-model";
import { useStore } from "./store";
import type { ProductRow } from "./types";

/**
 * Keeps the open catalog in step with Supabase. On mount it fetches only the rows changed after the page
 * was rendered (the server copy can be up to a minute old), then Realtime refetches a row whenever it is
 * inserted or updated. Edits to price, sale, metals, karats, is_sold or archiving therefore show in the grid and the open
 * modal without a reload.
 */
export function useLiveCatalog(asOf: string | null) {
  const upsertLive = useStore((s) => s.upsertLive);
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let alive = true;

    let since = db.from("products").select(PRODUCT_COLUMNS);
    if (asOf) since = since.gt("updated_at", asOf);
    since.limit(1000).then(({ data }) => {
      if (!alive || !data?.length) return;
      const rows = data as unknown as ProductRow[];
      upsertLive(rows.filter((r) => !r.is_archived).map(fromRow), rows.filter((r) => r.is_archived).map((r) => r.id));
    });

    const channel = db
      .channel("catalog")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async (payload) => {
        const id = (payload.new as { id?: string }).id;
        if (!id) return;
        const { data } = await db.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
        if (!alive || !data) return;
        const row = data as unknown as ProductRow;
        if (row.is_archived) upsertLive([], [row.id]);
        else upsertLive([fromRow(row)]);
      })
      .subscribe();
    return () => { alive = false; db.removeChannel(channel); };
  }, [asOf, upsertLive]);
}
