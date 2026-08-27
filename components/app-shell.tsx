"use client";

/**
 * App shell — blueprint-style sidebar nav + top bar with theme toggle.
 * Matches the reference structure: Dashboard/Scorecard/Optimizer/Simulator/Plan.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { SageMark } from "@/components/logo";
import { usePlant } from "@/lib/plant-store";
import { useAuth } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/scorecard", label: "Scorecard", icon: "dial" },
  { href: "/optimize", label: "Optimizer", icon: "target" },
  { href: "/simulate", label: "Simulator", icon: "sliders" },
  { href: "/plan", label: "Plan", icon: "doc" },
  { href: "/advisor", label: "Advisor", icon: "chat" },
  { href: "/compare", label: "Compare", icon: "grid" },
  { href: "/credits", label: "Credits", icon: "doc" },
  { href: "/timeline", label: "Timeline", icon: "sliders" },
  { href: "/register", label: "Register", icon: "plus" },
];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  dial: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M8 3v3M3 8h3M8 13v-3M13 8h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 8 5 11" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  sliders: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M2 5h7M11 5h3M2 11h3M7 11h7" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9.5" y="3.5" width="3" height="3" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5.5" y="9.5" width="3" height="3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10 2v3h3M6.5 8h4M6.5 11h4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M2 3.5h12v7H6l-3 2.5v-9.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 7h6M5 9h4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { input, plants, setPlant } = usePlant();
  const currentIndex = Math.max(0, plants.findIndex((p) => p.name === input.name));
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  React.useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      {/* Sidebar — hidden on auth pages */}
      {isAuthPage ? null : <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated md:flex">
        <div className="border-b border-line px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <SageMark className="h-7 w-7 shrink-0 text-ink" accent />
            <div>
              <div className="font-display text-sm font-bold uppercase tracking-tight leading-none text-ink">SAGE</div>
              <div className="mt-0.5 text-[10px] leading-none text-ink-muted">Sustainability Action</div>
            </div>
          </Link>
          <div className="label-caps mt-2 text-[10px] leading-tight text-ink-muted">{APP_TAGLINE}</div>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-0.5 px-2">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 border px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-accent bg-surface text-ink"
                        : "border-transparent text-ink-muted hover:border-line hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {ICONS[item.icon]}
                    <span className="label-caps text-xs tracking-wide">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-line px-5 py-4">
          <div className="label-caps text-[10px] text-ink-muted">Demo plant</div>
          <select
            value={currentIndex}
            onChange={(e) => setPlant(Number(e.target.value))}
            className="mt-1 w-full border border-line bg-surface px-1 py-1 font-mono text-xs text-ink outline-none transition-colors hover:border-accent focus:border-accent"
            aria-label="Select demo plant"
          >
            {plants.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </aside>}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 md:px-6" style={{ paddingTop: "env(safe-area-inset-top)" } as React.CSSProperties}>
          <div className="flex items-center gap-3">
            {isAuthPage ? null : (
              <button type="button" onClick={() => setDrawerOpen((v) => !v)} aria-label={drawerOpen ? "Close navigation" : "Open navigation"} aria-expanded={drawerOpen} className="inline-flex h-11 w-11 items-center justify-center border border-line bg-surface text-ink md:hidden">
                {drawerOpen ? (
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.2" /></svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.2" /></svg>
                )}
              </button>
            )}
            {/* Mobile brand */}
            <Link href="/" className="flex items-center gap-1.5 md:hidden" aria-label="SAGE home">
              <SageMark className="h-5 w-5 text-ink" accent />
              <span className="font-display text-xs font-bold uppercase tracking-tight">{APP_NAME}</span>
            </Link>
            <span className="label-caps hidden text-xs text-ink-muted md:inline">
              Sustainability Action &amp; Grade Engine
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="label-caps hidden text-[10px] text-ink-muted sm:inline">
              Grid · 0.7117 tCO₂/MWh
            </span>
            {isAuthPage ? null : (
              <a href="/notifications" aria-label="Notifications" className="hidden h-8 w-8 items-center justify-center border border-line bg-surface text-ink hover:border-accent sm:inline-flex">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden><path d="M8 3a4 4 0 0 0-4 4v2l-1 1h10l-1-1V7a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="1.2" /><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2" /></svg>
              </a>
            )}
            {isAuthPage ? null : user ? (
              <>
                <span className="hidden font-mono text-xs text-ink-muted sm:inline">{user.email}</span>
                <Link href="/select-plant" className="label-caps text-[10px] text-accent hover:underline">Switch plant</Link>
                <button type="button" onClick={() => { logout(); router.push("/login"); }} className="btn-press border border-line bg-surface px-2 py-1 text-ink hover:border-accent"><span className="label-caps text-[10px]">Logout</span></button>
              </>
            ) : (
              <Link href="/login" className="btn-press border border-accent bg-accent px-2 py-1 text-accent-ink"><span className="label-caps text-[10px]">Login</span></Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 pb-[env(safe-area-inset-bottom)]">{children}</main>
      </div>

      {/* Mobile drawer */}
      {isAuthPage || !drawerOpen ? null : (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-ink/30" />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-bg-elevated">
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <span className="flex items-center gap-2"><SageMark className="h-5 w-5 text-ink" /><span className="font-display text-xs font-bold uppercase tracking-tight">{APP_NAME}</span></span>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close" className="inline-flex h-11 w-11 items-center justify-center border border-line bg-surface"><svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.2" /></svg></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-0.5 px-2">
                {NAV.map((item) => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setDrawerOpen(false)} className={`flex min-h-11 items-center gap-3 border px-3 py-2 text-sm ${active ? "border-accent bg-surface text-ink" : "border-transparent text-ink-muted"}`}>{ICONS[item.icon]}<span className="label-caps text-xs tracking-wide">{item.label}</span></Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-line p-4">
              <div className="label-caps text-[10px] text-ink-muted">Demo plant</div>
              <select value={currentIndex} onChange={(e) => { setPlant(Number(e.target.value)); setDrawerOpen(false); }} className="mt-2 min-h-11 w-full border border-line bg-surface px-2 py-2 font-mono text-sm text-ink" aria-label="Select demo plant (mobile)">{plants.map((p, i) => (<option key={p.name} value={i}>{p.name}</option>))}</select>
              {user ? <button type="button" onClick={() => { logout(); setDrawerOpen(false); router.push("/login"); }} className="mt-3 w-full border border-line bg-surface px-3 py-2 text-left"><span className="label-caps text-xs">Logout — {user.email}</span></button> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}