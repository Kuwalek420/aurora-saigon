"use client";

import { useEffect, useState } from "react";
import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

const REMEMBER_KEY = "aurora-auth-remember";

/** "Remember me" decides where the session lives: localStorage (kept) or sessionStorage (gone when the tab closes). */
const remembered = () => { try { return localStorage.getItem(REMEMBER_KEY) !== "0"; } catch { return true; } };
export const setRemember = (on: boolean) => { try { localStorage.setItem(REMEMBER_KEY, on ? "1" : "0"); } catch { /* storage blocked: the session just lasts this page */ } };

const storage = {
  getItem: (k: string) => { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => {
    try {
      const [keep, drop] = remembered() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      keep.setItem(k, v);
      drop.removeItem(k);
    } catch { /* ignore */ }
  },
  removeItem: (k: string) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* ignore */ } },
};

let client: SupabaseClient | null | undefined;
/** Customer auth client (anon key + the visitor's own session). Null when Supabase is not configured. Browser only. */
export function authClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage, storageKey: "aurora-saigon-auth" } }) : null;
  return client;
}

/** The signed-in customer (null when signed out), kept in step with Supabase. `recovery` is true after a password-reset link. */
export function useAuth(): { user: User | null; session: Session | null; ready: boolean; recovery: boolean } {
  const [state, setState] = useState<{ session: Session | null; ready: boolean; recovery: boolean }>({ session: null, ready: false, recovery: false });
  useEffect(() => {
    const c = authClient();
    if (!c) { setState({ session: null, ready: true, recovery: false }); return; }
    c.auth.getSession().then(({ data }) => setState((s) => ({ ...s, session: data.session, ready: true })));
    const { data } = c.auth.onAuthStateChange((event, session) => setState({ session, ready: true, recovery: event === "PASSWORD_RECOVERY" }));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user: state.session?.user ?? null, session: state.session, ready: state.ready, recovery: state.recovery };
}
