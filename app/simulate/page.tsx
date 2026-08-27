"use client";

/**
 * SAGE — What-If Simulator.
 * Four live levers (A1 renewable / A2 waste / A3 logistics / A5 materials)
 * recompute the footprint through the real engine pipeline:
 *   applyAction(base, id, target) → computeFootprint → computeGrade.
 * Every slider input is debounced 600ms; the grade box fades 0.5 → 1 on
 * each recalc. All numbers come from the engine — nothing hardcoded.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlant } from "@/lib/plant-store";
import { ProvenanceBadge } from "@/components/provenance-badge";
import {
  applyAction,
  computeFootprint,
  computeGrade,
  formatNumber,
} from "@/lib/calc-engine";
import { gradeThresholds } from "@/lib/optimizer";
import { getAction } from "@/lib/action-catalog";
import type { PlantInput } from "@/lib/types";

/** Slider granularity for every lever (catalog has no step field). */
const STEP = 0.5;
/** Recalc debounce window (ms) — the interaction contract. */
const DEBOUNCE_MS = 600;
/** Transient "SAVED" state duration (ms). */
const SAVED_MS = 2000;

/** Grade rank for delta math — lower rank = better grade. */
const GRADE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };

/** The four simulator levers, keyed by the action they drive. */
interface Levers {
  renewable: number; // A1 — renewable_pct
  waste: number; // A2 — waste_reduction_pct
  logistics: number; // A3 — transport_reduction_pct
  materials: number; // A5 — material_reduction_pct
}

/* ------------------------------------------------------------------ *
 * Engine wiring — action definitions pulled from the catalog so every *
 * min/max/default is engine truth, never a hardcoded number.          *
 * ------------------------------------------------------------------ */

const A1 = getAction("A1"); // renewable share, 0–100
const A2 = getAction("A2"); // waste reduction, 0–50
const A3 = getAction("A3"); // transport/logistics reduction, 0–50
const A5 = getAction("A5"); // material intensity reduction, 0–50

/**
 * Compose the scenario input from the ORIGINAL plant input.
 * A2/A3/A5 touch disjoint fields (waste_tonnes / transport_km /
 * raw_material.tonnes) so chaining them is safe. A1 reads the base
 * grid_kwh + renewable_pct (untouched by the others) and is applied
 * independently from base, then its energy_mix is merged — no compound
 * error, no double-application.
 */
function buildScenarioInput(base: PlantInput, l: Levers): PlantInput {
  const afterWaste = applyAction(base, "A2", { waste_reduction_pct: l.waste });
  const afterLogistics = applyAction(afterWaste, "A3", {
    transport_reduction_pct: l.logistics,
  });
  const afterMaterials = applyAction(afterLogistics, "A5", {
    material_reduction_pct: l.materials,
  });
  const withRenewable = applyAction(base, "A1", { renewable_pct: l.renewable });
  return { ...afterMaterials, energy_mix: withRenewable.energy_mix };
}

/** One lever stack: label + live value, range input, min/max row. */
function Lever({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <span className="label-caps text-[11px] text-ink-muted">{label}</span>
        <span className="font-mono text-lg tabular-nums">{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      <div className="flex justify-between font-mono text-[10px] text-ink-muted">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

export default function SimulatePage() {
  const { input, footprint } = usePlant();

  /* Current (baseline) engine numbers. */
  const currentTotal = footprint.total_tCO2e;
  const currentGrade = useMemo(
    () => computeGrade(footprint.per_unit_tCO2e, gradeThresholds()),
    [footprint.per_unit_tCO2e],
  );

  /* Lever state — slider positions update instantly. */
  const [levers, setLevers] = useState<Levers>(() => ({
    renewable: input.energy_mix.renewable_pct,
    waste: A2.default_target,
    logistics: A3.default_target,
    materials: A5.default_target,
  }));

  /* Reset levers when the demo plant switches (initializer runs once). */
  const plantKey = input.name;
  useEffect(() => {
    setLevers({
      renewable: input.energy_mix.renewable_pct,
      waste: A2.default_target,
      logistics: A3.default_target,
      materials: A5.default_target,
    });
  }, [plantKey]);

  /* Debounced snapshot — the values the engine actually computes on. */
  const [debounced, setDebounced] = useState<Levers>(levers);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(levers), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [levers]);

  /* Stale flag drives the grade fade (opacity 0.5 → 1, 300ms). */
  const stale =
    levers.renewable !== debounced.renewable ||
    levers.waste !== debounced.waste ||
    levers.logistics !== debounced.logistics ||
    levers.materials !== debounced.materials;

  /* Projected outcome — real engine pipeline on the debounced levers. */
  const scenarioInput = useMemo(
    () => buildScenarioInput(input, debounced),
    [input, debounced],
  );
  const projected = useMemo(() => computeFootprint(scenarioInput), [scenarioInput]);
  const projectedGrade = useMemo(
    () => computeGrade(projected.per_unit_tCO2e, gradeThresholds()),
    [projected.per_unit_tCO2e],
  );

  /* KPI math — rounded totals first, delta derived from them. */
  const currentTotalRounded = Math.round(currentTotal);
  const projectedTotalRounded = Math.round(projected.total_tCO2e);
  const reductionAbs = Math.max(0, currentTotalRounded - projectedTotalRounded);
  const reductionPct =
    currentTotalRounded > 0 ? (reductionAbs / currentTotalRounded) * 100 : 0;
  const levelDelta = GRADE_RANK[currentGrade] - GRADE_RANK[projectedGrade];

  /* Chart geometry — projected line ramps from the baseline start to an
     end point lower by the reduction fraction (spec formula). */
  const chart = useMemo(() => {
    const reduction =
      currentTotal > 0
        ? Math.min(1, Math.max(0, (currentTotal - projected.total_tCO2e) / currentTotal))
        : 0;
    const endY = 65 + 35 * reduction;
    const pts: [number, number][] = [0, 1, 2, 3, 4].map((i) => [
      i * 100,
      50 + ((endY - 50) * i) / 4,
    ]);
    return {
      polyline: pts.map(([x, y]) => `${x},${y}`).join(" "),
      circles: pts,
    };
  }, [currentTotal, projected.total_tCO2e]);

  /* Reset all levers to engine defaults and recalc immediately. */
  const handleReset = () => {
    const defaults: Levers = {
      renewable: input.energy_mix.renewable_pct,
      waste: A2.default_target,
      logistics: A3.default_target,
      materials: A5.default_target,
    };
    setLevers(defaults);
    setDebounced(defaults);
  };

  /* Save scenario: clipboard JSON summary + transient SAVED state. */
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = async () => {
    const summary = {
      plant: input.name,
      scenario: {
        renewable_pct: debounced.renewable,
        waste_reduction_pct: debounced.waste,
        transport_reduction_pct: debounced.logistics,
        material_reduction_pct: debounced.materials,
      },
      baseline: {
        total_tCO2e: Number(currentTotal.toFixed(2)),
        grade: currentGrade,
      },
      projected: {
        total_tCO2e: Number(projected.total_tCO2e.toFixed(2)),
        grade: projectedGrade,
        reduction_pct: Number(reductionPct.toFixed(1)),
      },
    };
    const text = JSON.stringify(summary, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), SAVED_MS);
  };

  return (
    <div className="blueprint-grid relative mx-auto flex max-w-[1280px] flex-col gap-8 px-8 py-8">
      {/* ============================================================ *
       * HEADER — title + live-adjust chip                             *
       * ============================================================ */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Simulator
          </h1>
          <p className="label-caps mt-1 text-[10px] text-ink-muted">
            What-If Scenario · {input.name}
          </p>
        </div>
        <div className="flex items-center gap-1.5 border border-line bg-surface px-2 py-1">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M2 5h7M11 5h3M2 11h3M7 11h7" stroke="currentColor" strokeWidth="1.2" />
            <rect x="9.5" y="3.5" width="3" height="3" stroke="currentColor" strokeWidth="1.2" />
            <rect x="5.5" y="9.5" width="3" height="3" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="label-caps text-[10px]">Live Adjust</span>
        </div>
      </header>

      {/* ============================================================ *
       * MAIN SPLIT — levers (5) | projected outcome (7)               *
       * ============================================================ */}
      <main className="grid grid-cols-12 gap-8">
        {/* ---------------- SIMULATION LEVERS ---------------- */}
        <section className="col-span-12 flex flex-col gap-6 border border-line bg-surface p-5 lg:col-span-5">
          <div className="border-b border-line pb-3">
            <span className="label-caps text-xs">Simulation Levers</span>
          </div>

          <div className="flex flex-col gap-8">
            <Lever
              label="Renewable Energy Allocation"
              value={levers.renewable}
              min={A1.min}
              max={A1.max}
              onChange={(v) => setLevers((p) => ({ ...p, renewable: v }))}
            />
            <Lever
              label="Waste Reduction Efficiency"
              value={levers.waste}
              min={A2.min}
              max={A2.max}
              onChange={(v) => setLevers((p) => ({ ...p, waste: v }))}
            />
            <Lever
              label="Supply Chain Optimization"
              value={levers.logistics}
              min={A3.min}
              max={A3.max}
              onChange={(v) => setLevers((p) => ({ ...p, logistics: v }))}
            />
            <Lever
              label="Materials Efficiency"
              value={levers.materials}
              min={A5.min}
              max={A5.max}
              onChange={(v) => setLevers((p) => ({ ...p, materials: v }))}
            />
          </div>

          <div className="mt-auto flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="btn-press border border-line bg-surface px-4 py-2"
            >
              <span className="label-caps uppercase">Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-press border border-accent bg-accent px-4 py-2 text-accent-ink"
            >
              <span className="label-caps uppercase">
                {saved ? "Saved" : "Save Scenario"}
              </span>
            </button>
          </div>
        </section>

        {/* ---------------- PROJECTED OUTCOME ---------------- */}
        <section className="relative col-span-12 flex flex-col border border-line bg-bg-elevated p-5 lg:col-span-7">
          <div className="absolute right-4 top-4">
            <ProvenanceBadge tag="scenario" />
          </div>

          <div className="border-b border-line pb-3">
            <span className="label-caps text-xs">Projected Outcome</span>
          </div>

          <div className="mt-4 flex flex-col items-start gap-8 md:flex-row">
            {/* Grade box */}
            <div className="flex min-w-[180px] flex-col gap-1.5">
              <div
                className={`flex min-w-[180px] flex-col items-center justify-center gap-1 border border-line bg-surface p-4 transition-opacity duration-300 ${
                  stale ? "opacity-50" : "opacity-100"
                }`}
              >
                <span className="label-caps text-[10px] text-ink-muted">
                  Target Grade
                </span>
                <span className="font-display text-[72px] font-bold leading-none tracking-tighter">
                  {projectedGrade}
                </span>
                <div className="flex w-full items-center justify-center gap-1.5 border-t border-line pt-2">
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5 text-accent"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 12 6.5 7.5 9.5 10.5 14 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 5h4v4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-mono text-xs tabular-nums">
                    {currentGrade} → {projectedGrade}
                  </span>
                  {levelDelta > 0 && (
                    <span className="font-mono text-xs text-accent">
                      +{levelDelta} LEVEL
                    </span>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] text-ink-muted">
                BASELINE {formatNumber(currentTotal, 0)} tCO2e
              </span>
            </div>

            {/* Chart area */}
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="label-caps text-[10px] text-ink-muted">
                  Footprint Trajectory (TCO2E)
                </span>
                <span className="font-mono text-xs text-ink-muted">2026</span>
              </div>
              <div className="h-48 border border-line bg-surface p-4">
                <svg
                  viewBox="0 0 400 150"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  aria-hidden
                >
                  {/* dashed gridlines */}
                  <line x1="0" y1="37.5" x2="400" y2="37.5" stroke="#75777c" opacity="0.3" strokeDasharray="2,2" />
                  <line x1="0" y1="75" x2="400" y2="75" stroke="#75777c" opacity="0.3" strokeDasharray="2,2" />
                  <line x1="0" y1="112.5" x2="400" y2="112.5" stroke="#75777c" opacity="0.3" strokeDasharray="2,2" />
                  {/* baseline trajectory (static) */}
                  <polyline
                    points="0,50 100,60 200,55 300,70 400,65"
                    stroke="#75777c"
                    strokeWidth="1"
                    opacity="0.5"
                    fill="none"
                  />
                  {/* projected trajectory (live) */}
                  <polyline
                    points={chart.polyline}
                    stroke="#FF7A1B"
                    strokeWidth="2"
                    fill="none"
                  />
                  {chart.circles.map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="3"
                      fill="#faf9f7"
                      stroke="#FF7A1B"
                      strokeWidth="1"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
            <div className="border-l border-line pl-3">
              <div className="label-caps text-[10px] text-ink-muted">
                Est. Reduction
              </div>
              <div className="mt-0.5 font-mono text-lg tabular-nums">
                {reductionPct > 0.05 ? `-${formatNumber(reductionPct, 1)}%` : "0.0%"}
              </div>
            </div>
            <div className="border-l border-line pl-3">
              <div className="label-caps text-[10px] text-ink-muted">
                Footprint Δ
              </div>
              <div className="mt-0.5 font-mono text-lg tabular-nums">
                {reductionAbs > 0.05
                  ? `-${formatNumber(reductionAbs, 0)} tCO2e`
                  : "0 tCO2e"}
              </div>
            </div>
            <div className="border-l border-line pl-3">
              <div className="label-caps text-[10px] text-ink-muted">
                Projected Total
              </div>
              <div className="mt-0.5 font-mono text-lg tabular-nums">
                {formatNumber(projected.total_tCO2e, 0)} tCO2e
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}