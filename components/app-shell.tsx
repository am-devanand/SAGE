"use client";

/**
 * App shell — blueprint-style sidebar nav + top bar with theme toggle.
 * Matches the reference structure: Dashboard/Scorecard/Optimizer/Simulator/Plan.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePlant } from "@/lib/plant-store";
import { useAuth } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/scorecard", label: "Scorecard", icon: "dial" },
  { href: "/optimize", label: "Optimizer", icon: "target" },
  { href: "/simulate", label: "Simulator", icon: "sliders" },
  { href: "/plan", label: "Plan", icon: "doc" },
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
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { input, plants, setPlant } = usePlant();
  const currentIndex = Math.max(0, plants.findIndex((p) => p.name === input.name));
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      {/* Sidebar — hidden on auth pages */}
      {isAuthPage ? null : <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-bg-elevated md:flex">
        <div className="border-b border-line px-5 py-4">
          <Link href="/" className="block">
            <div className="label-caps text-lg leading-none text-ink">{APP_NAME}</div>
            <div className="mt-1 text-[11px] leading-tight text-ink-muted">{APP_TAGLINE}</div>
          </Link>
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
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile brand */}
            <span className="label-caps text-base md:hidden">{APP_NAME}</span>
            <span className="label-caps hidden text-xs text-ink-muted md:inline">
              Sustainability Action &amp; Grade Engine
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="label-caps hidden text-[10px] text-ink-muted sm:inline">
              Grid · 0.7117 tCO₂/MWh
            </span>
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

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}