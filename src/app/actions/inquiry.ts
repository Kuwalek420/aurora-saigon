"use server";

import { headers } from "next/headers";
import { adminDb } from "@/lib/supabase-admin";

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  /** yyyy-mm-dd, optional */
  preferredDate: string;
  message: string;
  /** What the visitor was looking at (ring configuration, a stone). Built by the page, not typed by the visitor. */
  context: string;
  /** Explicit consent to be contacted and to have these details stored. */
  consent: boolean;
  /** Honeypot: real visitors never see or fill this field. */
  website: string;
  /** When the form was shown (ms since epoch); a form submitted within seconds of rendering is a bot. */
  shownAt: number;
}
export type InquiryResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hits = new Map<string, number[]>(); // per-IP submission times (per server instance: a speed bump, not a guarantee)
const PER_HOUR = 5;

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Public enquiry from the custom-ring builder and the diamond pages. Stored as a "New Inquiry" in the private
 * `consultations` table, where the team sees it in the admin (tab 5). Needs the visitor's consent and email or phone.
 */
export async function submitInquiry(input: InquiryInput): Promise<InquiryResult> {
  if (!input || typeof input !== "object") return { ok: false, error: "Invalid request." };
  // bots: filled honeypot, or submitted faster than a person can type. Answer "ok" so they learn nothing.
  const elapsed = Date.now() - Number(input.shownAt);
  if (input.website || !(elapsed > 2500 && elapsed < 86_400_000)) return { ok: true };

  if (input.consent !== true) return { ok: false, error: "Please tick the box so we may contact you and keep these details." };
  const name = clip(input.name, 120);
  const email = clip(input.email, 200);
  const phone = clip(input.phone, 40);
  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (email && !EMAIL.test(email)) return { ok: false, error: "That email address does not look right." };
  if (phone && !/^[0-9+().\s-]{5,40}$/.test(phone)) return { ok: false, error: "That phone number does not look right." };
  if (!email && !phone) return { ok: false, error: "Please add an email address or a phone number so we can reply." };
  const date = clip(input.preferredDate, 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) return { ok: false, error: "That date is not valid." };
  const message = clip(input.message, 1500);
  const context = clip(input.context, 1500);

  const ip = ((await headers()).get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= PER_HOUR) return { ok: false, error: "Too many enquiries from this connection. Please try again later, or email us." };
  hits.set(ip, [...recent, now]);
  if (hits.size > 5000) hits.clear();

  const notes = [context && `From the website:\n${context}`, message && `Message:\n${message}`].filter(Boolean).join("\n\n");
  const { error } = await adminDb().from("consultations").insert({
    client_name: name,
    email: email || null,
    phone: phone || null,
    preferred_date: date || null,
    status: "New Inquiry",
    notes,
  });
  if (error) {
    console.error("[inquiry] could not save:", error.message);
    return { ok: false, error: "Sorry, we could not send your enquiry just now. Please email or call us instead." };
  }
  return { ok: true };
}
