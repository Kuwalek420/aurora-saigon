"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="mt-10 space-y-5">
      <label className="block">
        <span className="text-[0.8rem] text-muted-gray">Password</span>
        <input name="password" type="password" required autoFocus autoComplete="current-password" className="mt-2 block w-full border-b border-charcoal/30 bg-transparent py-3 text-base outline-none transition-colors duration-500 focus:border-obsidian" />
      </label>
      {state.error && <p role="alert" className="text-[0.8rem] text-obsidian">{state.error}</p>}
      <button disabled={pending} className="eyebrow w-full bg-obsidian py-5 text-alabaster transition-colors duration-500 hover:bg-champagne hover:text-obsidian disabled:opacity-40">
        {pending ? "Checking" : "Sign in"}
      </button>
    </form>
  );
}
