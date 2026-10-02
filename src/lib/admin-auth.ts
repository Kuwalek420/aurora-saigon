import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "as_admin";
const SESSION_SECONDS = 60 * 60 * 8;

/** The admin area stays closed unless every secret is present and long enough: a missing or weak env var can never mean "open". */
export function adminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD?.length ?? 0) >= 8 && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32 && !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// no fallback: sessions are signed with ADMIN_SESSION_SECRET and nothing else
const secret = () => process.env.ADMIN_SESSION_SECRET!;
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function passwordMatches(input: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  return !!real && safeEqual(input, real);
}

export async function startSession() {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  (await cookies()).set(ADMIN_COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [exp, mac] = raw.split(".");
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false;
  return Number(exp) > Date.now() / 1000;
}
