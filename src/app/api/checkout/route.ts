import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminDb } from "@/lib/supabase-admin";
import { CATALOG_TAG } from "@/lib/catalog";

/**
 * Demo checkout completion: the pieces in the bag are marked sold, so they leave "Ready to Ship" and show as
 * "Sold / Atelier archive" elsewhere (`is_sold`, the same flag the admin switch uses; nothing else on the row changes).
 *
 * No payment is taken here, so anyone who can open the storefront could trigger this. It therefore does nothing unless
 * the owner turns it on with CHECKOUT_MARKS_SOLD=1 (server environment variable). Even then it only touches Ready to
 * Ship pieces that are still for sale, takes at most 20 ids, and is limited to 10 calls per hour per IP.
 * An admin can put a piece back on sale from /admin/inventory.
 */
const hits = new Map<string, number[]>();
const ID = /^[A-Za-z0-9._-]{1,40}$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? [...new Set((body!.ids as unknown[]).filter((x): x is string => typeof x === "string" && ID.test(x)))].slice(0, 20) : [];
  if (!ids.length) return NextResponse.json({ ok: false, error: "No pieces given." }, { status: 400 });

  if (process.env.CHECKOUT_MARKS_SOLD !== "1") return NextResponse.json({ ok: true, enabled: false, sold: [] });

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 10) return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  const { data, error } = await adminDb().from("products").update({ is_sold: true }).in("id", ids).eq("is_ready_to_ship", true).eq("is_sold", false).eq("is_archived", false).select("id");
  if (error) return NextResponse.json({ ok: false, error: "Could not update stock." }, { status: 500 });

  revalidateTag(CATALOG_TAG);
  revalidatePath("/catalog");
  revalidatePath("/");
  return NextResponse.json({ ok: true, enabled: true, sold: (data ?? []).map((r) => r.id as string) });
}
