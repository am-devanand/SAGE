"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("judge@sage.in");
  const [password, setPassword] = useState("sage123");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!login(email, password)) {
      setErr("Enter a valid email and password.");
      return;
    }
    router.push("/select-plant");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[1280px] items-center justify-center px-8 py-12">
      <div className="w-full max-w-sm border border-line bg-bg-elevated p-6">
        <h1 className="font-display text-xl font-bold uppercase tracking-tight">Login</h1>
        <p className="label-caps mt-1 text-[10px] text-ink-muted">SAGE — Sustainability Action &amp; Grade Engine</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.in" className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent" />
          </div>
          <div>
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent" />
          </div>
          {err && <span className="font-mono text-xs text-accent" role="alert">{err}</span>}
          <button type="submit" className="btn-press border border-accent bg-accent px-4 py-2.5 text-accent-ink hover:bg-accent/90"><span className="label-caps uppercase">Login &amp; Continue</span></button>
        </form>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <span className="font-mono text-xs text-ink-muted">No account?</span>
          <Link href="/signup" className="label-caps text-xs text-accent hover:underline">Create account</Link>
        </div>
        <div className="mt-2 text-center">
          <Link href="/select-plant" onClick={(e) => { e.preventDefault(); login("guest@sage.in", "guest"); router.push("/select-plant"); }} className="font-mono text-xs text-ink-muted hover:text-ink">Continue as guest →</Link>
        </div>
        <p className="mt-3 font-mono text-[10px] text-ink-muted">Demo: judge@sage.in / sage123 — any email + password works (mock auth for SIH demo).</p>
      </div>
    </div>
  );
}
