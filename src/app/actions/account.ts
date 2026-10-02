"use server";

import { adminDb } from "@/lib/supabase-admin";

export type MyEnquiry = { id: string; createdAt: string; status: string; preferredDate: string | null; summary: string };

/**
 * The signed-in customer's own enquiries and consultation requests. The `consultations` table is private (no policy
 * for the public key), so this runs with the service role, but only after checking the caller's access token with
 * Supabase and only ever returns rows whose email equals that verified account's email, in a trimmed shape.
 */
export async function myEnquiries(accessToken: string): Promise<{ ok: true; items: MyEnquiry[] } | { ok: false }> {
  if (!accessToken || accessToken.length > 4000) return { ok: false };
  try {
    const db = adminDb();
    const { data: who, error } = await db.auth.getUser(accessToken);
    const email = who?.user?.email;
    if (error || !email) return { ok: false };
    const { data, error: qErr } = await db.from("consultations").select("id,created_at,status,preferred_date,notes").ilike("email", email).order("created_at", { ascending: false }).limit(20);
    if (qErr) return { ok: false };
    return {
      ok: true,
      items: (data ?? []).map((r) => ({
        id: String(r.id),
        createdAt: String(r.created_at),
        status: String(r.status ?? ""),
        preferredDate: r.preferred_date ? String(r.preferred_date) : null,
        // the first line after "From the website:" names what the enquiry was about; the visitor's own message is not echoed
        summary: String(r.notes ?? "").replace(/^From the website:\s*/i, "").split("\n")[0].slice(0, 120),
      })),
    };
  } catch {
    return { ok: false };
  }
}
