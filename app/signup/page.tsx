"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!signup(name, email, password)) {
      setErr("Fill name, email and password.");
      return;
    }
    router.push("/select-plant");
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-56px)] max-w-[1280px] grid-cols-12 gap-8 px-4 py-6 md:px-8 md:py-12">
      <div className="col-span-12 flex flex-col justify-center border border-line bg-bg-elevated p-8 md:col-span-5">
        <span className="label-caps text-[10px] text-ink-muted">SAGE — new workspace</span>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight">
          Create
          <br />
          your
          <br />
          <span className="text-accent">workspace.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">One account, 15 demo plants + your own. Grades stay traceable.</p>
        <div className="mt-6 border-t border-line pt-4 font-mono text-xs text-ink-muted">Step 1 of 2 — you’ll pick a plant next.</div>
        <div className="mt-8 hidden h-24 border border-line bg-surface p-3 md:block">
          <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,_var(--line)_1px,_transparent_0)] [background-size:16px_16px] opacity-30" />
        </div>
      </div>

      <div className="col-span-12 flex items-center md:col-span-7">
        <div className="w-full border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">Create account</h2>
          <p className="label-caps mt-1 text-[10px] text-ink-muted">Join SAGE</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="label-caps text-[10px] text-ink-muted" htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 w-full border border-line bg-bg-elevated px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent" />
            </div>
            <div>
              <label className="label-caps text-[10px] text-ink-muted" htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.in" className="mt-1 w-full border border-line bg-bg-elevated px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent" />
            </div>
            <div>
              <label className="label-caps text-[10px] text-ink-muted" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full border border-line bg-bg-elevated px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent" />
            </div>
            {err && <span className="font-mono text-xs text-accent" role="alert">{err}</span>}
            <button type="submit" className="btn-press border border-accent bg-accent px-4 py-2.5 text-accent-ink hover:bg-accent/90"><span className="label-caps uppercase">Create &amp; Continue</span></button>
          </form>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-mono text-xs text-ink-muted">Have an account?</span>
            <Link href="/login" className="label-caps text-xs text-accent hover:underline">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
