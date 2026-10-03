import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminDb } from "@/lib/supabase-admin";
import { CATALOG_TAG } from "@/lib/catalog";

/**
 * Stripe webhook: when a Checkout Session completes, the pieces named in its `metadata.product_ids`
 * (comma-separated ids) are marked sold. Stripe is not connected to this storefront yet (payments are demos), so this
 * answers 503 until STRIPE_WEBHOOK_SECRET is set. The signature is checked exactly as Stripe documents it
 * (HMAC-SHA256 of `${timestamp}.${rawBody}`, 5 minute tolerance), so nobody else can call it.
 */
function verified(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > 300 || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Stripe is not connected." }, { status: 503 });
  const raw = await req.text();
  if (!verified(raw, req.headers.get("stripe-signature"), secret)) return NextResponse.json({ error: "Bad signature." }, { status: 400 });

  const event = JSON.parse(raw) as { type?: string; data?: { object?: { metadata?: { product_ids?: string } } } };
  if (event.type === "checkout.session.completed") {
    const ids = (event.data?.object?.metadata?.product_ids ?? "").split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9._-]{1,40}$/.test(s)).slice(0, 50);
    if (ids.length) {
      const { error } = await adminDb().from("products").update({ is_sold: true }).in("id", ids).eq("is_sold", false);
      if (error) return NextResponse.json({ error: "Could not update stock." }, { status: 500 }); // Stripe retries
      revalidateTag(CATALOG_TAG);
      revalidatePath("/catalog");
      revalidatePath("/");
    }
  }
  return NextResponse.json({ received: true });
}
