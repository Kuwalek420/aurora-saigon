"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { authClient, setRemember, useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";

type Mode = "login" | "signup" | "reset" | "newpass";
const EASE = [0.22, 1, 0.36, 1] as const;
const field = "mt-2 w-full border-b border-charcoal/25 bg-transparent py-3 text-[0.95rem] outline-none transition-colors duration-500 placeholder:text-obsidian/30 focus:border-champagne";
const label = "eyebrow block text-[0.6rem] text-muted-gray";

/**
 * Customer sign-in (Supabase Auth): log in, create an account, ask for a password reset, or choose a new password
 * after following the reset link. A confirmation e-mail may be required before a new account can sign in.
 */
export default function AuthModal() {
  const t = useT();
  const panel = useStore((s) => s.panel);
  const setPanel = useStore((s) => s.setPanel);
  const { recovery } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRem] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const id = useId();
  const open = panel === "login";

  useEffect(() => { if (recovery) { setMode("newpass"); setPanel("login"); } }, [recovery, setPanel]);
  useEffect(() => {
    if (!open) return;
    setError(null); setNotice(null); setPassword("");
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, setPanel]);

  const friendly = (m: string) => {
    if (/invalid login/i.test(m)) return t("Email or password is not correct.");
    if (/not confirmed/i.test(m)) return t("Please confirm your email address first: we sent you a link.");
    if (/already registered|already been registered/i.test(m)) return t("An account with this email already exists. Try logging in.");
    if (/password.*(at least|short|weak)/i.test(m)) return t("Please choose a password of at least 8 characters.");
    if (/rate limit|too many/i.test(m)) return t("Too many attempts. Please wait a few minutes and try again.");
    return t("Something went wrong. Please try again.");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = authClient();
    setError(null); setNotice(null);
    if (!c) { setError(t("Accounts are not available right now.")); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        setRemember(remember);
        const { error: err } = await c.auth.signInWithPassword({ email: email.trim(), password });
        if (err) setError(friendly(err.message)); else setPanel(null);
      } else if (mode === "signup") {
        if (password.length < 8) { setError(t("Please choose a password of at least 8 characters.")); return; }
        setRemember(remember);
        const { data, error: err } = await c.auth.signUp({ email: email.trim(), password });
        if (err) setError(friendly(err.message));
        else if (data.session) setPanel(null);
        else setNotice(t("Almost done: we sent a confirmation link to your email. Open it, then log in."));
      } else if (mode === "reset") {
        const { error: err } = await c.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
        if (err) setError(friendly(err.message)); else setNotice(t("If this email has an account, a reset link is on its way."));
      } else {
        if (password.length < 8) { setError(t("Please choose a password of at least 8 characters.")); return; }
        const { error: err } = await c.auth.updateUser({ password });
        if (err) setError(friendly(err.message)); else { setNotice(t("Your password has been changed.")); setTimeout(() => setPanel(null), 1200); }
      }
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? t("LOGIN") : mode === "signup" ? t("Create an account") : mode === "reset" ? t("Lost password?") : t("Choose a new password");
  const cta = mode === "login" ? t("LOGIN") : mode === "signup" ? t("Create account") : mode === "reset" ? t("Send reset link") : t("Save password");
  const go = (m: Mode) => { setMode(m); setError(null); setNotice(null); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} onClick={() => setPanel(null)} role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[70] flex items-start justify-end bg-obsidian/45 md:items-start">
          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} transition={{ duration: 0.55, ease: EASE }} onClick={(e) => e.stopPropagation()} className="relative h-full w-full max-w-[28rem] overflow-y-auto bg-alabaster p-8 md:p-12">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow text-[0.8rem] text-obsidian">{title}</h2>
              <button onClick={() => setPanel(null)} aria-label={t("Close")} className="-mr-2 p-2 text-obsidian/60 transition-colors duration-500 hover:text-obsidian">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden><path d="M2 2l12 12M14 2 2 14" /></svg>
              </button>
            </div>

            <form onSubmit={submit} className="mt-12 space-y-8" noValidate>
              {mode !== "newpass" && (
                <div>
                  <label htmlFor={`${id}-email`} className={label}>{t("Email Address")} *</label>
                  <input id={`${id}-email`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                </div>
              )}
              {mode !== "reset" && (
                <div>
                  <label htmlFor={`${id}-pw`} className={label}>{mode === "newpass" ? t("New password") : t("Password")} *</label>
                  <input id={`${id}-pw`} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? undefined : 8} value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                </div>
              )}

              {(mode === "login" || mode === "signup") && (
                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-3 text-[0.85rem] text-obsidian/75">
                    <input type="checkbox" checked={remember} onChange={(e) => setRem(e.target.checked)} className="h-4 w-4 accent-obsidian" />
                    {t("Remember me")}
                  </label>
                  {mode === "login" && <button type="button" onClick={() => go("reset")} className="text-[0.85rem] text-obsidian/75 underline decoration-charcoal/30 underline-offset-[5px] transition-colors duration-500 hover:decoration-champagne">{t("Lost password?")}</button>}
                </div>
              )}

              <div aria-live="polite" className="min-h-[1.25rem] text-[0.85rem]">
                {error && <p className="text-[#8a3b2e]">{error}</p>}
                {notice && <p className="text-obsidian/75">{notice}</p>}
              </div>

              <button type="submit" disabled={busy} className="eyebrow w-full bg-obsidian px-6 py-4 text-[0.65rem] text-alabaster transition-colors duration-500 hover:bg-champagne-deep disabled:opacity-50">{busy ? t("One moment…") : cta}</button>
            </form>

            <div className="mt-10 text-center text-[0.85rem] text-obsidian/70">
              {mode === "login" && <button type="button" onClick={() => go("signup")} className="underline decoration-charcoal/30 underline-offset-[5px] transition-colors duration-500 hover:decoration-champagne">{t("New here? Create an account")}</button>}
              {(mode === "signup" || mode === "reset") && <button type="button" onClick={() => go("login")} className="underline decoration-charcoal/30 underline-offset-[5px] transition-colors duration-500 hover:decoration-champagne">{t("Back to login")}</button>}
            </div>
            {mode === "signup" && <p className="mt-8 text-[0.72rem] leading-relaxed text-muted-gray">{t("We keep your email only to run your account and reply to your enquiries.")}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
