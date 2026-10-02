import "server-only";
import { createClient } from "@supabase/supabase-js";

export const SETTINGS_TAG = "site-settings";

export interface Announcement { enabled: boolean; message: string; link: string | null }
const OFF: Announcement = { enabled: false, message: "", link: null };

/** The site-wide announcement bar (site_settings row id 'global'). Any failure means no bar: it is never worth breaking a page for. */
/** Only internal paths and https links; anything else is dropped rather than rendered as a link. */
export function safeLink(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return /^\/(?!\/)\S*$/.test(s) || /^https:\/\/\S+$/i.test(s) ? s : null;
}

export async function getAnnouncement(): Promise<Announcement> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return OFF;
  try {
    const db = createClient(url, anon, {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60, tags: [SETTINGS_TAG] } }) },
    });
    const { data, error } = await db.from("site_settings").select("announcement_enabled,announcement_text,announcement_link").eq("id", "global").maybeSingle();
    if (error || !data) return OFF;
    const message = (data.announcement_text ?? "").trim().slice(0, 200);
    return { enabled: data.announcement_enabled === true && message.length > 0, message, link: safeLink(data.announcement_link) };
  } catch {
    return OFF;
  }
}
