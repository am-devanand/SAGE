"use client";

/**
 * SAGE — Optimization Engine.
 * Budget slider + strategic priority → live findBestPortfolio() run against
 * the real engine. Every number is engine output; nothing is hardcoded.
 * Blueprint aesthetic: 0px radius, 1px borders, tonal layering, amber accents.
 */

import { useMemo, useState } from "react";
import { usePlant } from "@/lib/plant-store";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { findBestPortfolio, gradeThresholds } from "@/lib/optimizer";
import { computeGrade, formatINR, formatNumber } from "@/lib/calc-engine";
import type { PortfolioResult, RankMode } from "@/lib/types";

type Mode = "cost-effective" | "fastest" | "biggest" | "grade";

const MODES: { value: Mode; label: string }[] = [
  { value: "cost-effective", label: "MIN COST" },
  { value: "biggest", label: "MAX CO2" },
  { value: "fastest", label: "FASTEST" },
  { value: "grade", label: "BEST GRADE" },
];

/** Grade letter rank — lower is better (A < B < C < D < F). */
const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };

const BUDGET_MIN = 0;
const BUDGET_MAX = 10_000_000;
const BUDGET_STEP = 250_000;
const BUDGET_DEFAULT = 4_500_000;

export default function OptimizePage() {
  const { input, grade } = usePlant();
  const [budget, setBudget] = useState(BUDGET_DEFAULT);
  const [mode, setMode] = useState<Mode>("cost-effective");
  const [runId, setRunId] = useState(0);

  // Current grade letter — same engine math as the scorecard.
  const gradeLetter = useMemo(
    () => computeGrade(grade.per_unit, gradeThresholds()),
    [grade.per_unit],
  );

  // Live portfolio: recomputed on mount, budget change, mode change, and
  // explicit RUN ENGINE presses. 'grade' mode runs all 3 real RankModes and
  // keeps the best projected grade. Guarded — a bad input never crashes.
  const portfolio = useMemo<PortfolioResult | null>(() => {
    try {
      if (mode === "grade") {
        const runs = (["cost-effective", "fastest", "biggest"] as RankMode[]).map((m) =>
          findBestPortfolio(input, budget, m),
        );
        return [...runs].sort(
          (a, b) => GRADE_ORDER[a.projected_grade] - GRADE_ORDER[b.projected_grade],
        )[0];
      }
      return findBestPortfolio(input, budget, mode);
    } catch {
      return null;
    }
  }, [input, budget, mode, runId]);

  // Confidence level: most common confidence among chosen actions
  // (ties → higher priority), fallback MEDIUM.
  const confidenceLevel = useMemo(() => {
    if (!portfolio || portfolio.actions.length === 0) return "MEDIUM";
    const priority: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const counts: Record<string, number> = {};
    for (const a of portfolio.actions) {
      counts[a.confidence] = (counts[a.confidence] ?? 0) + 1;
    }
    const best = Object.entries(counts).sort(
      (x, y) => y[1] - x[1] || priority[x[0]] - priority[y[0]],
    )[0][0];
    return best.toUpperCase();
  }, [portfolio]);

  const topAction = portfolio?.actions[0] ?? null;
  const restActions = portfolio?.actions.slice(1) ?? [];

  return (
    <div className="blueprint-grid relative mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
      {/* ============================================================ *
       * HEADER                                                         *
       * ============================================================ */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Optimization Engine
          </h1>
          <p className="label-caps mt-1 text-[10px] text-ink-muted">
            Recommended Portfolio · {input.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProvenanceBadge tag="estimated" />
          <div className="flex items-center gap-2 border border-line bg-surface px-2 py-1">
            <span className="label-caps text-[10px] text-ink-muted">Current Grade</span>
            <span className="font-mono text-xs tabular-nums">{gradeLetter}</span>
          </div>
        </div>
      </header>

      {/* ============================================================ *
       * MAIN SPLIT — CONTROLS | RECOMMENDED PORTFOLIO                  *
       * ============================================================ */}
      <div className="grid grid-cols-12 gap-8">
        {/* ---------------- LEFT — CONTROLS ---------------- */}
        <aside className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          {/* Budget */}
          <div>
            <div className="label-caps text-[10px] text-ink-muted">Total Budget</div>
            <div className="mt-1 font-mono text-2xl tabular-nums">{formatINR(budget)}</div>
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={BUDGET_STEP}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-4 w-full"
              aria-label="Total budget"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-muted">
              <span>₹0</span>
              <span>₹10.0M</span>
            </div>
          </div>

          {/* Strategic priority */}
          <div>
            <div className="label-caps text-[10px] text-ink-muted">Strategic Priority</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MODES.map((m) => {
                const selected = mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    aria-pressed={selected}
                    className={`flex items-center justify-between border px-3 py-3 text-left transition-colors ${
                      selected
                        ? "border-accent text-ink outline outline-2 outline-offset-[-2px] outline-accent"
                        : "border-line text-ink-muted hover:border-line hover:text-ink"
                    }`}
                  >
                    <span className="label-caps text-xs">{m.label}</span>
                    <span
                      className={`inline-block h-2 w-2 ${selected ? "bg-accent" : "bg-line"}`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run */}
          <button
            type="button"
            onClick={() => setRunId((n) => n + 1)}
            className="btn-press w-full border border-line bg-accent px-4 py-3 text-accent-ink transition-colors hover:bg-accent/90"
          >
            <span className="label-caps uppercase">Run Engine</span>
          </button>
        </aside>

        {/* ---------------- RIGHT — RECOMMENDED PORTFOLIO ---------------- */}
        <section className="col-span-12 lg:col-span-8">
          <div className="relative border border-line bg-bg-elevated p-5">
            {/* Panel header */}
            <div className="flex items-center justify-between">
              <span className="label-caps text-xs">Recommended Portfolio</span>
              <div className="flex items-center gap-2">
                <span className="label-caps text-[10px] text-ink-muted">Conf. Level</span>
                <span className="font-mono text-xs tabular-nums">{confidenceLevel}</span>
              </div>
            </div>

            {portfolio === null ? (
              /* ---- Engine error guard ---- */
              <div className="mt-4 border border-line bg-bg-elevated p-3">
                <span className="label-caps text-xs">Engine Error — Check Plant Data</span>
              </div>
            ) : portfolio.actions.length === 0 ? (
              /* ---- Empty state ---- */
              <div className="flex flex-col items-center gap-3 py-10">
                <svg
                  viewBox="0 0 16 16"
                  className="h-5 w-5 text-ink-muted"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M8 2 15 14H1z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6.5v3.5M8 12.2v.3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="label-caps text-xs text-ink-muted">
                  No Actions Fit This Budget — Raise the Slider
                </span>
              </div>
            ) : (
              <>
                {/* ---- Summary strip ---- */}
                <div className="mt-4 mb-4 grid grid-cols-3 gap-4 border-b border-line pb-4">
                  <div>
                    <div className="label-caps text-[10px] text-ink-muted">Investment</div>
                    <div className="mt-0.5 font-mono text-lg tabular-nums">
                      {formatINR(portfolio.total_investment)}
                    </div>
                  </div>
                  <div>
                    <div className="label-caps text-[10px] text-ink-muted">CO2 Reduction</div>
                    <div className="mt-0.5 font-mono text-lg tabular-nums text-accent">
                      {formatNumber(portfolio.capped_reduction_tCO2e, 0)} tCO2e
                    </div>
                  </div>
                  <div>
                    <div className="label-caps text-[10px] text-ink-muted">Projected Grade</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-lg tabular-nums">
                        {portfolio.current_grade} → {portfolio.projected_grade}
                      </span>
                      <ProvenanceBadge tag="scenario" />
                    </div>
                  </div>
                </div>

                {/* ---- Action cards ---- */}
                <div className="flex flex-col gap-3">
                  {/* Prominent hero card — top-ranked action */}
                  {topAction && (
                    <div className="flex flex-col gap-3 border border-line bg-surface p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                          {topAction.name}
                        </h3>
                        <ProvenanceBadge tag={topAction.tag} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-line pt-3">
                        <div>
                          <div className="label-caps text-[10px] text-ink-muted">
                            Est. Cost Range
                          </div>
                          <div className="mt-0.5 font-mono text-sm tabular-nums">
                            {formatINR(topAction.cost_range.min)} –{" "}
                            {formatINR(topAction.cost_range.max)}
                          </div>
                        </div>
                        <div>
                          <div className="label-caps text-[10px] text-ink-muted">
                            CO2 Reduction
                          </div>
                          <div className="mt-0.5 font-mono text-sm tabular-nums text-accent">
                            {formatNumber(topAction.reduction_tCO2e.value, 0)} tCO2e
                          </div>
                        </div>
                        <div>
                          <div className="label-caps text-[10px] text-ink-muted">
                            Implementation
                          </div>
                          <div className="label-caps mt-0.5 text-sm uppercase">
                            {topAction.difficulty}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 border-t border-line pt-2">
                        <span className="label-caps text-[10px] text-ink-muted">
                          Grade Impact
                        </span>
                        <span className="font-mono text-sm tabular-nums">
                          {topAction.score_delta.from} → {topAction.score_delta.to}
                        </span>
                        <ProvenanceBadge tag="scenario" />
                      </div>
                    </div>
                  )}

                  {/* Compact cards — remaining actions */}
                  {restActions.map((a) => (
                    <div
                      key={a.action_id}
                      className="flex items-center justify-between gap-3 border border-line bg-surface px-4 py-3"
                    >
                      <span className="font-display text-sm font-bold uppercase tracking-tight">
                        {a.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs tabular-nums text-accent">
                          {formatNumber(a.reduction_tCO2e.value, 0)} tCO2e
                        </span>
                        <span className="font-mono text-xs tabular-nums text-ink-muted">
                          {formatINR(a.cost_mid)}
                        </span>
                        <ProvenanceBadge tag={a.tag} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}