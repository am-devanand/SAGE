"use client";

/**
 * SAGE — Dashboard landing page.
 * Hero (asymmetric 55/45) + bento workspace grid. Every number is live
 * engine data from usePlant(); nothing is hardcoded. Blueprint aesthetic:
 * 0px radius, 1px borders, tonal layering, amber schematic line art.
 */

import Link from "next/link";
import { useMemo } from "react";
import { usePlant } from "@/lib/plant-store";
import { ProvenanceBadge } from "@/components/provenance-badge";
import {
  BREAKDOWN_LABELS,
  computeGrade,
  formatINR,
  formatNumber,
} from "@/lib/calc-engine";
import { findBestPortfolio, gradeThresholds } from "@/lib/optimizer";

/** Default portfolio budget for the Optimization panel (₹45,00,000). */
const PORTFOLIO_BUDGET = 4500000;

const ICONS: Record<string, React.ReactNode> = {
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
  factory: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M2 14V6l4 3V6l4 3V6l4 3v5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 14v-2M8 14v-2M11 14v-2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
};

export default function Home() {
  const { input, footprint, percentile } = usePlant();

  // Grade letter — same engine math the scorecard uses (thresholds are
  // memoized module-level, so this is cheap and deterministic).
  const gradeLetter = useMemo(
    () => computeGrade(footprint.per_unit_tCO2e, gradeThresholds()),
    [footprint.per_unit_tCO2e],
  );

  // Budget portfolio — guarded so a bad input can never crash the page.
  const portfolio = useMemo(() => {
    try {
      return findBestPortfolio(input, PORTFOLIO_BUDGET, "cost-effective");
    } catch {
      return null;
    }
  }, [input]);

  const topAction = portfolio?.actions[0] ?? null;
  const biggest = footprint.breakdown[footprint.biggestContributor];

  return (
    <div className="relative mx-auto max-w-[1280px] px-8 py-8">
      {/* ============================================================ *
       * SECTION 1 — HERO (asymmetric 55/45, blueprint sheet)          *
       * ============================================================ */}
      <section className="blueprint-grid relative border border-line bg-bg-elevated p-6 md:p-8">
        <div className="relative grid grid-cols-12 gap-6 md:gap-8">
          {/* LEFT — copy + CTAs + live stats */}
          <div className="col-span-12 md:col-span-7">
            <ProvenanceBadge tag="measured" />

            <h1 className="mt-4 break-words font-display text-[2rem] font-bold uppercase leading-[0.95] tracking-tight md:text-6xl">
              Industrial Decarbonization,
              <br className="hidden md:block" />
              Scored and <span className="text-accent">Actioned</span>.
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
              SAGE measures a plant&apos;s carbon footprint, grades it A–F
              against 25 sector peers, and optimizes an action portfolio to
              your budget — every number traced to its source.
            </p>

            {/* CTA row */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/scorecard"
                className="btn-press border border-line bg-accent px-5 py-2.5 text-accent-ink transition-colors hover:bg-accent/90"
              >
                <span className="label-caps uppercase">Open Scorecard</span>
              </Link>
              <Link
                href="/optimize"
                className="btn-press border border-line bg-surface px-5 py-2.5 text-ink transition-colors hover:border-accent"
              >
                <span className="label-caps uppercase">Optimize</span>
              </Link>
              <Link
                href="/register"
                className="btn-press border border-line bg-surface px-5 py-2.5 text-ink transition-colors hover:border-accent"
              >
                <span className="label-caps uppercase">Register Plant</span>
              </Link>
            </div>

            {/* Live stat strip */}
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              <div className="border-l border-line pl-3">
                <div className="label-caps text-[10px] text-ink-muted">Footprint</div>
                <div className="mt-0.5 font-mono text-lg tabular-nums">
                  {formatNumber(footprint.total_tCO2e, 0)} tCO2e
                </div>
              </div>
              <div className="border-l border-line pl-3">
                <div className="label-caps text-[10px] text-ink-muted">Grade</div>
                <div className="mt-0.5 font-mono text-lg tabular-nums">{gradeLetter}</div>
              </div>
              <div className="border-l border-line pl-3">
                <div className="label-caps text-[10px] text-ink-muted">vs. Peers</div>
                <div className="mt-0.5 font-mono text-lg tabular-nums">
                  {percentile.percentile.toFixed(0)}th pct
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — factory schematic */}
          <div className="col-span-12 md:col-span-5">
            <div className="relative border border-line bg-surface p-4">
              <div className="relative text-accent-ink">
                <svg viewBox="0 0 320 260" className="h-auto w-full" fill="none" aria-hidden>
                  <defs>
                    <pattern id="blueprint-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="1.5" cy="1.5" r="1" fill="currentColor" opacity="0.35" />
                    </pattern>
                  </defs>

                  {/* faint drafting dots */}
                  <rect width="320" height="260" fill="url(#blueprint-dots)" />

                  {/* ground line */}
                  <path d="M20 232 H300" stroke="currentColor" strokeWidth="1.2" />

                  {/* wind turbine */}
                  <path d="M30 232 V176" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="25.5" y="170" width="9" height="6" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="30" cy="172" r="2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M30 172 L16 154 M30 172 L46 156 M30 172 L30 150" stroke="currentColor" strokeWidth="1.2" />
                  <text x="14" y="200" fontSize="7" fill="currentColor" className="font-mono">WT</text>

                  {/* main hall */}
                  <rect x="86" y="150" width="104" height="82" stroke="currentColor" strokeWidth="1.2" />
                  <polyline points="78,150 120,126 162,150" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M86 146 L120 131 M120 131 L154 146" stroke="currentColor" strokeWidth="1" />
                  <rect x="92" y="170" width="9" height="8" stroke="currentColor" strokeWidth="1" />
                  <rect x="105" y="170" width="9" height="8" stroke="currentColor" strokeWidth="1" />
                  <rect x="124" y="198" width="22" height="34" stroke="currentColor" strokeWidth="1.2" />

                  {/* right wing + loading dock */}
                  <rect x="190" y="182" width="58" height="50" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="202" y="206" width="16" height="26" stroke="currentColor" strokeWidth="1" />

                  {/* smokestacks + vent */}
                  <rect x="92" y="112" width="10" height="38" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="126" y="120" width="10" height="30" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="216" y="146" width="8" height="36" stroke="currentColor" strokeWidth="1.2" />
                  <text x="70" y="140" fontSize="7" fill="currentColor" className="font-mono">S1</text>
                  <text x="140" y="140" fontSize="7" fill="currentColor" className="font-mono">S2</text>

                  {/* emission plumes (dashed) */}
                  <path d="M97 112 C 99 104 94 99 97 90 C 100 81 94 76 97 68" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 3" />
                  <path d="M131 120 C 133 113 129 109 131 102 C 133 95 129 91 131 84" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 3" />
                  <path d="M220 146 C 221 141 218 139 220 134" stroke="currentColor" strokeWidth="1" strokeDasharray="2.5 3" />

                  {/* power lines */}
                  <path d="M266 232 V148" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M254 152 H278" stroke="currentColor" strokeWidth="1" />
                  <path d="M298 232 V158" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M288 160 H308" stroke="currentColor" strokeWidth="1" />
                  <path d="M254 152 C 272 168 290 166 298 158" stroke="currentColor" strokeWidth="1" />
                  <path d="M278 152 C 290 164 298 164 308 160" stroke="currentColor" strokeWidth="1" />

                  {/* dimension arrows */}
                  <path d="M86 244 H190" stroke="currentColor" strokeWidth="1" />
                  <path d="M86 240 V248 M190 240 V248 M138 240 V248" stroke="currentColor" strokeWidth="1" />
                  <path d="M86 244 L92 241 L92 247 Z" fill="currentColor" />
                  <path d="M190 244 L184 241 L184 247 Z" fill="currentColor" />
                  <text x="138" y="262" textAnchor="middle" fontSize="8" fill="currentColor" className="font-mono">40 M</text>
                  <path d="M310 148 V232" stroke="currentColor" strokeWidth="1" />
                  <path d="M306 148 H314 M306 232 H314 M306 190 H314" stroke="currentColor" strokeWidth="1" />
                  <path d="M310 148 L307 154 L313 154 Z" fill="currentColor" />
                  <path d="M310 232 L307 226 L313 226 Z" fill="currentColor" />
                  <text x="322" y="192" fontSize="8" fill="currentColor" className="font-mono">18 M</text>

                  {/* elbow leader lines (ink-muted, per spec) */}
                  <polyline points="97,112 97,78 84,78 84,20" className="text-ink-muted" stroke="currentColor" strokeWidth="1" />
                  <circle cx="97" cy="112" r="1.5" className="text-ink-muted" fill="currentColor" />
                  <polyline points="216,210 282,210 282,220" className="text-ink-muted" stroke="currentColor" strokeWidth="1" />
                  <circle cx="216" cy="210" r="1.5" className="text-ink-muted" fill="currentColor" />
                </svg>

                {/* callout label — ENERGY */}
                <div className="absolute left-3 top-3 border border-line bg-surface px-2 py-1">
                  <div className="label-caps text-[10px] text-ink-muted">Energy</div>
                  <div className="font-mono text-sm tabular-nums text-ink">
                    {formatNumber(footprint.breakdown.grid.value, 0)} tCO2e
                  </div>
                </div>

                {/* callout label — WASTE */}
                <div className="absolute bottom-3 right-3 border border-line bg-surface px-2 py-1">
                  <div className="label-caps text-[10px] text-ink-muted">Waste</div>
                  <div className="font-mono text-sm tabular-nums text-ink">
                    {formatNumber(footprint.breakdown.waste.value, 0)} t
                  </div>
                </div>
              </div>

              {/* caption strip */}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
                <span className="label-caps text-[10px] text-ink-muted">
                  Fig. 01 — Live Plant Schematic
                </span>
                <span className="font-mono text-[10px] tabular-nums text-ink-muted">
                  DEMO · {input.name.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ *
       * SECTION 2 — BENTO WORKSPACE GRID                              *
       * ============================================================ */}
      <section className="mt-8 grid grid-cols-12 gap-4">
        {/* PANEL A — SCORECARD */}
        <Link
          href="/scorecard"
          className="group col-span-12 flex flex-col border border-line bg-surface p-5 transition-colors hover:border-accent md:col-span-4"
        >
          <div className="flex items-center gap-2 text-ink-muted">
            {ICONS.dial}
            <span className="label-caps text-xs">Scorecard</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-tight">
            Grade Your Plant
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
            Footprint decomposition, instrument dial grade, and peer-benchmark
            percentile in one view.
          </p>
          <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
            <div>
              <div className="label-caps text-[10px] text-ink-muted">Current Grade</div>
              <div className="font-display text-3xl font-bold leading-none">{gradeLetter}</div>
            </div>
            <div className="text-right">
              <div className="label-caps text-[10px] text-ink-muted">Peer Rank</div>
              <div className="font-mono text-sm tabular-nums">
                {percentile.percentile.toFixed(0)}th pct
              </div>
            </div>
          </div>
        </Link>

        {/* PANEL B — OPTIMIZATION ENGINE (largest) */}
        <div className="relative col-span-12 flex flex-col border border-line bg-bg-elevated p-5 md:col-span-8">
          <div className="absolute right-5 top-5">
            <ProvenanceBadge tag="scenario" />
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            {ICONS.target}
            <span className="label-caps text-xs">Optimization Engine</span>
          </div>
          <h3 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight">
            Build Your Portfolio
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            Ranked actions by cost-effectiveness, capped to your budget —
            projected grade included.
          </p>

          {topAction ? (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="border-l border-line pl-3">
                <div className="label-caps text-[10px] text-ink-muted">Budget</div>
                <div className="mt-0.5 font-mono text-lg tabular-nums">
                  {formatINR(PORTFOLIO_BUDGET)}
                </div>
              </div>
              <div className="border-l border-line pl-3">
                <div className="label-caps text-[10px] text-ink-muted">Top Action</div>
                <div className="mt-0.5 font-display text-sm font-bold uppercase">
                  {topAction.name}
                </div>
                <div className="font-mono text-sm tabular-nums">
                  −{formatNumber(topAction.reduction_tCO2e.value, 0)} tCO2e
                </div>
              </div>
              <div className="border-l border-line pl-3">
                <div className="label-caps text-[10px] text-ink-muted">Projected Grade</div>
                <div className="mt-0.5 font-display text-3xl font-bold leading-none">
                  {portfolio?.projected_grade}
                </div>
              </div>
              <Link
                href="/optimize"
                className="btn-press ml-auto border border-line bg-accent px-4 py-2 text-accent-ink transition-colors hover:bg-accent/90"
              >
                <span className="label-caps uppercase">Apply Changes</span>
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <p className="text-sm text-ink-muted">
                4 actions ranked by cost-effectiveness — open the optimizer to
                build a portfolio.
              </p>
              <Link
                href="/optimize"
                className="btn-press ml-auto border border-line bg-accent px-4 py-2 text-accent-ink transition-colors hover:bg-accent/90"
              >
                <span className="label-caps uppercase">Apply Changes</span>
              </Link>
            </div>
          )}
        </div>

        {/* PANEL C — WHAT-IF SIMULATOR */}
        <Link
          href="/simulate"
          className="group col-span-12 flex flex-col border border-line bg-surface p-5 transition-colors hover:border-accent md:col-span-4"
        >
          <div className="flex items-center gap-2 text-ink-muted">
            {ICONS.sliders}
            <span className="label-caps text-xs">Simulator</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-tight">
            Simulate Changes
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
            Move levers, watch the grade react in real time.
          </p>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
            <span className="inline-block h-1.5 w-1.5 animate-pulse bg-accent" />
            <span className="font-mono text-sm text-accent">Live Adjust</span>
          </div>
        </Link>

        {/* PANEL D — ACTION PLAN / CERTIFICATION (dark) */}
        <Link
          href="/plan"
          className="group col-span-12 flex flex-col border border-line bg-ink p-5 text-bg transition-colors hover:border-accent md:col-span-4"
        >
          <div className="flex items-center gap-2 text-bg/70">
            {ICONS.doc}
            <span className="label-caps text-xs">Certification</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-tight">
            Export Report
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-bg/80">
            Generate a certification report with full provenance — one-click
            PDF export.
          </p>
          <div className="mt-4 border-t border-bg/20 pt-3 font-mono text-sm text-accent">
            PDF EXPORT
          </div>
        </Link>

        {/* PANEL E — LIVE PLANT */}
        <div className="col-span-12 flex flex-col border border-line bg-surface p-5 md:col-span-4">
          <div className="flex items-center gap-2 text-ink-muted">
            {ICONS.factory}
            <span className="label-caps text-xs">Live Plant</span>
          </div>
          <h3 className="mt-3 font-display text-xl font-bold uppercase tracking-tight">
            Plant Profile
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
            Biggest contributor, live from the engine.
          </p>
          <div className="mt-4 border-t border-line pt-3">
            <div className="flex items-baseline justify-between">
              <span className="label-caps text-[10px] text-ink-muted">
                {BREAKDOWN_LABELS[footprint.biggestContributor]}
              </span>
              <span className="font-mono text-sm tabular-nums">
                {formatNumber(biggest.value, 0)} tCO2e
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="label-caps text-[10px] text-ink-muted">Materials</span>
              <span className="font-mono text-sm tabular-nums">
                {formatNumber(footprint.breakdown.materials.value, 0)} tCO2e
              </span>
            </div>
          </div>
        </div>

        {/* PANEL F — REGISTER CTA BANNER */}
        <Link
          href="/register"
          className="group col-span-12 flex flex-col items-start justify-between gap-4 border border-accent bg-accent/5 p-5 transition-colors hover:bg-accent/10 md:flex-row md:items-center"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-accent text-accent">
              {ICONS.plus}
            </span>
            <div>
              <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                Register Your Plant
              </h3>
              <p className="text-sm text-ink-muted">
                Add your company to the shared registry — scored by the same SAGE engine as the demos.
              </p>
            </div>
          </div>
          <span className="btn-press border border-accent bg-accent px-5 py-2.5 text-accent-ink transition-colors group-hover:bg-accent/90">
            <span className="label-caps uppercase">Get Started</span>
          </span>
        </Link>
      </section>
    </div>
  );
}