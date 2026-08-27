"use client";

/**
 * SAGE — Plant Scorecard.
 * Instrument dial grade, footprint breakdown, peer-benchmark percentile and
 * a full provenance table. Every number is live engine data from usePlant();
 * nothing is hardcoded. Blueprint aesthetic: 0px radius, 1px borders,
 * tonal layering, amber schematic accents.
 */

import { useEffect, useRef, useState } from "react";
import { usePlant } from "@/lib/plant-store";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { BREAKDOWN_LABELS, computeGrade, formatNumber } from "@/lib/calc-engine";
import { SECTOR_LABELS } from "@/lib/seed-data";
import type { BreakdownKey } from "@/lib/types";

/** Order the five footprint terms are always rendered in. */
const BREAKDOWN_ORDER: BreakdownKey[] = ["grid", "diesel", "materials", "waste", "transport"];

/** Fixed segment colors — literal hex so segments stay distinct in both themes.
 *  Label colors are also fixed (not theme tokens): each label must contrast its
 *  own segment bg in BOTH themes, since the segment bg never changes. */
const SEGMENT_STYLE: Record<BreakdownKey, { bg: string; label: string }> = {
  grid: { bg: "bg-[#1A1C1B]", label: "text-[#FAF9F7]" },
  diesel: { bg: "bg-[#45474B]", label: "text-[#FAF9F7]" },
  materials: { bg: "bg-[#FF7A1B]", label: "text-[#5E2700]" },
  waste: { bg: "bg-[#5B6B7A]", label: "text-[#FAF9F7]" },
  transport: { bg: "bg-[#C5C6CC]", label: "text-[#1A1C1B]" },
};

/* Dial geometry — semicircular gauge, 180° sweep left→right over the top. */
const DIAL_CX = 100;
const DIAL_CY = 100;
const DIAL_R = 100;
/** Fraction of the 180° sweep the needle points at (reference: ~72%). */
const NEEDLE_SWEEP = 0.72;
const NEEDLE_LENGTH = 78;
const TICK_ANGLES = [0, 45, 90, 135, 180];

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: DIAL_CX + radius * Math.cos(rad), y: DIAL_CY - radius * Math.sin(rad) };
}

/** Measures the segmented-bar container so % labels can be hidden when a
 *  segment renders narrower than 40px. */
function useBarWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export default function ScorecardPage() {
  const { input, footprint, grade, percentile, history } = usePlant();
  const { ref: barRef, width: barWidth } = useBarWidth();

  const gradeLetter = computeGrade(footprint.per_unit_tCO2e, grade.thresholds);
  const total = footprint.total_tCO2e;
  const needleAngle = 180 - NEEDLE_SWEEP * 180;
  const needleTip = polar(needleAngle, NEEDLE_LENGTH);
  // Clamp the marker so the pill never clips at the ruler edges.
  const markerLeft = Math.min(98, Math.max(2, percentile.percentile));

  return (
    <div className="relative mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
      {/* ============================================================ *
       * HEADER ROW                                                    *
       * ============================================================ */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Scorecard</h1>
          <div className="label-caps mt-1 text-[10px] text-ink-muted">
            {input.name.toUpperCase()} · {SECTOR_LABELS[input.sector].toUpperCase()}
          </div>
        </div>
        <ProvenanceBadge tag="measured" />
      </header>

      {/* ============================================================ *
       * DATA WORKSPACE (blueprint grid behind the cards only)         *
       * ============================================================ */}
      <div className="blueprint-grid relative border border-line bg-bg p-4">
        <div className="relative flex flex-col gap-4">
          {/* -------------------------------------------------------- *
           * CARD 1 — PLANT SCORECARD (joined top row)                 *
           * -------------------------------------------------------- */}
          <div className="grid grid-cols-12 gap-4">
            {/* INSTRUMENT DIAL */}
            <div className="col-span-12 flex flex-col items-center border border-line bg-surface p-5 lg:col-span-4">
              <div className="label-caps text-[10px] text-ink-muted">Current Grade</div>

              <svg viewBox="0 0 200 100" className="mt-4 w-full max-w-[220px]" fill="none" aria-hidden>
                {/* semicircular arc — 180° left to right over the top */}
                <path
                  d="M 0 100 A 100 100 0 0 1 200 100"
                  className="text-line"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* 5 tick marks along the arc (no numeric labels) */}
                {TICK_ANGLES.map((a) => {
                  const outer = polar(a, DIAL_R);
                  const inner = polar(a, DIAL_R - 4);
                  return (
                    <line
                      key={a}
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      className="text-ink-muted"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  );
                })}
                {/* needle */}
                <line
                  x1={DIAL_CX}
                  y1={DIAL_CY}
                  x2={needleTip.x}
                  y2={needleTip.y}
                  className="text-ink"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* pivot dot */}
                <circle cx={DIAL_CX} cy={DIAL_CY} r="3" className="text-accent" fill="currentColor" />
              </svg>

              <div className="mt-4 flex items-center gap-2">
                <span className="font-display text-5xl font-bold uppercase leading-none">{gradeLetter}</span>
                <ProvenanceBadge tag={grade.letter.tag} />
              </div>

              <div className="mt-3 flex flex-col items-center gap-1">
                <div className="font-mono text-sm tabular-nums">
                  {formatNumber(total, 0)} tCO2e / yr
                </div>
                <div className="font-mono text-xs tabular-nums text-ink-muted">
                  {formatNumber(footprint.per_unit_tCO2e, 4)} tCO2e/unit
                </div>
              </div>
            </div>

            {/* FOOTPRINT BREAKDOWN */}
            <div className="col-span-12 flex flex-col justify-center border border-line bg-bg-elevated p-5 lg:col-span-8">
              <div className="label-caps text-[10px] text-ink-muted">Footprint Breakdown (tCO2e/yr)</div>

              {/* segmented bar — butt-jointed, no gaps */}
              <div ref={barRef} className="mt-4 flex h-8 w-full">
                {BREAKDOWN_ORDER.map((key) => {
                  const seg = footprint.breakdown[key];
                  const pct = total > 0 ? (seg.value / total) * 100 : 0;
                  const px = (pct / 100) * barWidth;
                  const showLabel = px >= 40;
                  return (
                    <div
                      key={key}
                      className={`flex min-w-[8px] items-center justify-center ${SEGMENT_STYLE[key].bg}`}
                      style={{ width: `${pct}%` }}
                    >
                      {showLabel && (
                        <span className={`font-mono text-[10px] tabular-nums ${SEGMENT_STYLE[key].label}`}>
                          {pct.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* biggest contributor delta line */}
              <div className="mt-4 border-t border-line pt-3">
                <div className="label-caps text-[10px] text-ink-muted">Biggest Contributor</div>
                <div className="mt-1 inline-block border-b-2 border-accent font-display text-sm font-bold uppercase">
                  {BREAKDOWN_LABELS[footprint.biggestContributor]}
                </div>
              </div>

              {/* legend */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {BREAKDOWN_ORDER.map((key) => {
                  const seg = footprint.breakdown[key];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 ${SEGMENT_STYLE[key].bg}`} />
                      <span className="label-caps text-[10px] text-ink-muted">{BREAKDOWN_LABELS[key]}</span>
                      <span className="font-mono text-xs tabular-nums">{formatNumber(seg.value, 0)} tCO2e</span>
                    </div>
                  );
                })}
              </div>

              {/* total footer */}
              <div className="mt-4 flex items-baseline justify-end gap-2">
                <span className="label-caps text-[10px] text-ink-muted">Total</span>
                <span className="font-mono text-lg tabular-nums">{formatNumber(total, 0)} tCO2e</span>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------- *
           * CARD 2 — PEER BENCHMARK (full width)                     *
           * -------------------------------------------------------- */}
          <div className="relative border border-line bg-surface p-5">
            <div className="label-caps text-[10px] text-ink-muted">
              Peer Benchmark — Percentile vs {percentile.peerCount}{" "}
              {percentile.peerSet === "sector" ? "Sector Peers" : "All Peers"}
            </div>

            {/* ruler */}
            <div className="relative mt-6 pt-12">
              {/* axis line */}
              <div className="border-t border-line" />

              {/* CURRENT marker — pill + needle above the axis */}
              <div className="absolute top-0 -translate-x-1/2" style={{ left: `${markerLeft}%` }}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 border border-line bg-accent px-2 py-0.5 text-accent-ink">
                    <span className="label-caps text-[10px] leading-none">Current</span>
                    <span className="font-mono text-[10px] leading-none tabular-nums">
                      {percentile.percentile.toFixed(0)}th
                    </span>
                  </div>
                  <div className="h-7 w-0.5 bg-accent" />
                </div>
              </div>

              {/* below-axis ticks + current dot */}
              <div className="relative h-8">
                {[0, 25, 50, 75, 100].map((p) => (
                  <div key={p} className="absolute top-0" style={{ left: `${p}%` }}>
                    <div className="mx-auto h-2 w-px bg-line" />
                    {p > 0 && p < 100 && (
                      <div
                        className="label-caps mt-1 text-[10px] text-ink-muted"
                        style={{ transform: "translateX(-50%)" }}
                      >
                        P{p}
                      </div>
                    )}
                  </div>
                ))}
                <div className="absolute top-0 -translate-x-1/2" style={{ left: `${markerLeft}%` }}>
                  <div className="h-0 w-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-accent" />
                </div>
              </div>
            </div>

            {/* grade thresholds legend */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3">
              <span className="label-caps text-[10px] text-ink-muted">Grade Thresholds</span>
              <span className="font-mono text-[10px] tabular-nums text-ink-muted">
                A ≤ {formatNumber(grade.thresholds.A, 4)}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-ink-muted">
                B ≤ {formatNumber(grade.thresholds.B, 4)}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-ink-muted">
                C ≤ {formatNumber(grade.thresholds.C, 4)}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-ink-muted">
                D ≤ {formatNumber(grade.thresholds.D, 4)}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-ink-muted">
                F &gt; {formatNumber(grade.thresholds.F, 4)}
              </span>
            </div>
          </div>

          {/* -------------------------------------------------------- *
            * CARD 3 — TREND (6 records)                               *
            * -------------------------------------------------------- */}
          <div className="border border-line bg-surface p-5">
            <div className="label-caps text-[10px] text-ink-muted">Trend — Last 6 Records</div>
            {history.length < 2 ? (
              <div className="mt-4 border border-dashed border-line p-4 text-center font-mono text-xs text-ink-muted">Not enough history yet — change plant inputs to build a trend.</div>
            ) : (
              <div className="mt-4">
                <svg viewBox="0 0 300 80" className="h-20 w-full" preserveAspectRatio="none" aria-hidden>
                  <polyline fill="none" stroke="var(--line)" strokeWidth="1" points={history.map((h, i) => `${(i / (history.length - 1)) * 300},${80 - (h.total / Math.max(...history.map((x) => x.total)) ) * 60 - 10}`).join(" ")} />
                  {history.map((h, i) => (
                    <circle key={h.date + i} cx={(i / (history.length - 1)) * 300} cy={80 - (h.total / Math.max(...history.map((x) => x.total)) ) * 60 - 10} r="2" fill="var(--accent)" />
                  ))}
                </svg>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {history.map((h) => (
                    <div key={h.date} className="border-l border-line pl-2">
                      <div className="label-caps text-[9px] text-ink-muted">{h.date.slice(5)}</div>
                      <div className="font-mono text-xs">{h.total} t</div>
                      <div className="font-mono text-[10px] text-accent">{h.grade}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* -------------------------------------------------------- *
            * CARD 4 — BREAKDOWN TABLE (full width)                    *
            * -------------------------------------------------------- */}
          <div className="border border-line bg-surface p-5">
            <div className="label-caps text-[10px] text-ink-muted">Breakdown Table</div>

            <div className="mt-4 grid grid-cols-12 items-center gap-x-4 border-b border-line pb-2">
              <div className="col-span-5 label-caps text-[10px] text-ink-muted">Contributor</div>
              <div className="col-span-3 text-right label-caps text-[10px] text-ink-muted">tCO2e / yr</div>
              <div className="col-span-2 text-right label-caps text-[10px] text-ink-muted">Share</div>
              <div className="col-span-2 text-right label-caps text-[10px] text-ink-muted">Provenance</div>
            </div>

            {BREAKDOWN_ORDER.map((key) => {
              const seg = footprint.breakdown[key];
              const share = total > 0 ? (seg.value / total) * 100 : 0;
              return (
                <div key={key} className="grid grid-cols-12 items-center gap-x-4 border-b border-line py-2">
                  <div className="col-span-5 label-caps text-xs">{BREAKDOWN_LABELS[key]}</div>
                  <div className="col-span-3 text-right font-mono text-sm tabular-nums">
                    {formatNumber(seg.value, 0)} tCO2e
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm tabular-nums">{share.toFixed(1)}%</div>
                  <div className="col-span-2 flex justify-end">
                    <ProvenanceBadge tag={seg.tag} />
                  </div>
                </div>
              );
            })}

            <div className="grid grid-cols-12 items-center gap-x-4 pt-3">
              <div className="col-span-5 font-display text-sm font-bold uppercase">Total</div>
              <div className="col-span-3 text-right font-mono text-sm tabular-nums">
                {formatNumber(total, 0)} tCO2e
              </div>
              <div className="col-span-2 text-right font-mono text-sm tabular-nums">100%</div>
              <div className="col-span-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}