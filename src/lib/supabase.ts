import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Public (anon) client: read-only by row level security. Null when the env vars are missing. */
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const CERTIFICATE_TYPE = "application/pdf";
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** What the server hands back for one upload: where to put the file and a one-time token that allows exactly that write. */
export type SignedUpload = { ok: true; path: string; token: string } | { ok: false; error: string };

/**
 * Upload one file to the public `product-images` bucket as `[timestamp]-[filename]` (certificate PDFs under `certificates/`) and return its public URL.
 * The bucket stays closed to the anon key: `sign` is the admin-only server action that checks the session cookie
 * and issues a one-time upload token, so only a signed-in admin can write while the file itself goes straight to Storage.
 */
export async function uploadProductFile(file: File, sign: (name: string, type: string, size: number) => Promise<SignedUpload>): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const ticket = await sign(file.name, file.type, file.size);
  if (!ticket.ok) throw new Error(ticket.error);
  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  const { error } = await bucket.uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return bucket.getPublicUrl(ticket.path).data.publicUrl;
}

/** Photos and certificates share one helper; the server decides the folder from the file type. */
export const uploadProductImage = uploadProductFile;
