import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service-role client: bypasses row level security. Server only, and only ever called after isAdmin(). */
export function adminDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}
