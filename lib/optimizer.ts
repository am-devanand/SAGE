/**
 * SAGE optimizer — action impact, 3-mode ranking, budget portfolio,
 * capped combined reduction, and peer-benchmark percentile.
 *
 * Contract (Oracle-pinned):
 *  - reduction = footprint(applyAction(input)) − footprint(input) — the ONLY
 *    reduction math, shared identically by cards, simulator and ranking.
 *  - Over-credit guard: per-term capping in fixed priority order
 *    (grid: A1 before A4; materials: A5 before A6). Σ of capped reductions
 *    can never exceed the plant's total footprint.
 *  - percentile = % of same-sector peers with HIGHER intensity (higher=better),
 *    falls back to the full seed set when <3 same-sector peers exist.
 */

import { ACTION_CATALOG, getAction } from "./action-catalog";
import {
  BREAKDOWN_LABELS,
  applyAction as applyActionFor,
  calibrateGradeThresholds as calibrateThresholds,
  computeFootprint,
  computeGrade,
  formatINR,
  gradeFromFootprint,
} from "./calc-engine";
import { DEMO_PLANT, SEED_PLANTS } from "./seed-data";
import type {
  ActionDefinition,
  ActionImpact,
  ActionParams,
  Grade,
  PlantInput,
  PortfolioResult,
  RankMode,
  TaggedNumber,
} from "./types";

/* ------------------------------------------------------------------ *
 * Impact                                                               *
 * ------------------------------------------------------------------ */

function costFor(action: ActionDefinition, input: PlantInput, reductionKwh: number, reductionTonnes: number, reductionKm: number): { min: number; max: number } {
  const c = action.cost_range;
  switch (action.id) {
    case "A1": {
      // kW of solar needed = renewable kWh delta / 1400 kWh/kWp yield.
      const kw = reductionKwh / 1400;
      return { min: c.min * kw, max: c.max * kw };
    }
    case "A2":
      return { min: c.min * reductionTonnes, max: c.max * reductionTonnes };
    case "A3":
      return { min: c.min * reductionKm, max: c.max * reductionKm };
    case "A4":
      return { min: c.min * reductionKwh, max: c.max * reductionKwh };
    case "A5":
      return { min: c.min * reductionTonnes, max: c.max * reductionTonnes };
    case "A6":
      return { ...c }; // fixed program range
    default:
      return { ...c };
  }
}

function impactFor(
  action: ActionDefinition,
  input: PlantInput,
  params: ActionParams,
  current: ReturnType<typeof computeFootprint>,
  currentGrade: Grade,
  thresholds: ReturnType<typeof gradeFromFootprint>["thresholds"],
): ActionImpact {
  const afterInput = applyActionFor(input, action.id, params);
  const after = computeFootprint(afterInput);
  const reduction = current.total_tCO2e - after.total_tCO2e;
  const afterGrade = computeGrade(after.per_unit_tCO2e, thresholds);

  // Scale quantities for cost estimation.
  const reductionKwh = Math.max(0, input.energy_mix.grid_kwh - afterInput.energy_mix.grid_kwh);
  const reductionKm = Math.max(0, input.transport_km - afterInput.transport_km);
  const reductionTonnes =
    Math.max(0, input.waste_tonnes - afterInput.waste_tonnes) +
    Math.max(0, input.raw_material.tonnes - afterInput.raw_material.tonnes);

  const cost = costFor(action, input, reductionKwh, reductionTonnes, reductionKm);
  const costMid = (cost.min + cost.max) / 2;

  return {
    action_id: action.id,
    name: action.name,
    reduction_tCO2e: {
      value: Math.max(0, reduction),
      tag: "estimated",
      derivation: `footprint after applying ${action.name} at target ${params[action.target_field]} vs current footprint (engine applyAction transform)`,
      unit: "tCO2e/yr",
    },
    cost_range: { min: Math.round(cost.min), max: Math.round(cost.max) },
    cost_mid: Math.round(costMid),
    difficulty: action.difficulty,
    confidence: action.confidence,
    score_delta: { from: currentGrade, to: afterGrade },
    tag: "estimated",
    applicable: action.id !== "A6" || input.raw_material.type !== "food",
  };
}

/** Default params for an action (its pinned default_target). */
export function defaultParams(action: ActionDefinition): ActionParams {
  return { [action.target_field]: action.default_target };
}

export function computeActionImpact(
  action: ActionDefinition,
  input: PlantInput,
  params?: ActionParams,
  ctx?: { footprint?: ReturnType<typeof computeFootprint>; grade?: Grade; thresholds?: ReturnType<typeof gradeFromFootprint>["thresholds"] },
): ActionImpact {
  const current = ctx?.footprint ?? computeFootprint(input);
  const grade = ctx?.grade ?? computeGrade(current.per_unit_tCO2e, ctx?.thresholds ?? gradeThresholds());
  return impactFor(action, input, params ?? defaultParams(action), current, grade, ctx?.thresholds ?? gradeThresholds());
}

/* ------------------------------------------------------------------ *
 * Grade thresholds (computed once from the seed distribution)          *
 * ------------------------------------------------------------------ */

let _thresholds: ReturnType<typeof gradeFromFootprint>["thresholds"] | null = null;

export function gradeThresholds() {
  if (_thresholds) return _thresholds;
  const perUnit = SEED_PLANTS.map((p) => computeFootprint(p).per_unit_tCO2e);
  _thresholds = calibrateThresholds(perUnit);
  return _thresholds;
}

/* ------------------------------------------------------------------ *
 * Ranking                                                              *
 * ------------------------------------------------------------------ */

export function rankActions(impacts: ActionImpact[], mode: RankMode = "cost-effective"): ActionImpact[] {
  const sorted = [...impacts].filter((i) => i.applicable);
  switch (mode) {
    case "fastest":
      return sorted.sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty) || tiebreak(a, b));
    case "biggest":
      return sorted.sort((a, b) => b.reduction_tCO2e.value - a.reduction_tCO2e.value || tiebreak(a, b));
    case "cost-effective":
    default:
      return sorted.sort((a, b) => eff(b) - eff(a) || tiebreak(a, b));
  }
}

function eff(i: ActionImpact): number {
  return i.cost_mid > 0 ? i.reduction_tCO2e.value / i.cost_mid : 0;
}

const DIFFICULTY_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };
function difficultyRank(d: string): number {
  return DIFFICULTY_ORDER[d] ?? 2;
}
function tiebreak(a: ActionImpact, b: ActionImpact): number {
  return a.action_id.localeCompare(b.action_id);
}

/* ------------------------------------------------------------------ *
 * Combined capped reduction — never promises more than the plant emits *
 * ------------------------------------------------------------------ */

export function computeCombinedCappedReduction(
  input: PlantInput,
  actions: ActionDefinition[],
  paramsMap: Record<string, ActionParams>,
): number {
  const current = computeFootprint(input);
  const breakdown = current.breakdown;

  let gridSum = 0;
  let materialsSum = 0;

  // Fixed cap order: grid → A1 before A4; materials → A5 before A6.
  const order = ["A1", "A4", "A5", "A6", "A2", "A3"];
  const sorted = [...actions].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  let total = 0;
  for (const a of sorted) {
    const after = computeFootprint(applyActionFor(input, a.id, paramsMap[a.id] ?? defaultParams(a)));
    const standalone = current.total_tCO2e - after.total_tCO2e;
    if (standalone <= 0) continue;

    if (a.id === "A4") {
      const cap = Math.max(0, breakdown.grid.value - gridSum);
      total += Math.min(standalone, cap);
      gridSum += Math.min(standalone, cap);
    } else if (a.id === "A6") {
      const cap = Math.max(0, breakdown.materials.value - materialsSum);
      total += Math.min(standalone, cap);
      materialsSum += Math.min(standalone, cap);
    } else if (a.id === "A1") {
      gridSum += standalone;
      total += standalone;
    } else if (a.id === "A5") {
      materialsSum += standalone;
      total += standalone;
    } else {
      total += standalone;
    }
  }
  return Math.min(total, current.total_tCO2e);
}

/* ------------------------------------------------------------------ *
 * Budget portfolio — greedy by cost-effectiveness within a budget      *
 * ------------------------------------------------------------------ */

export function findBestPortfolio(
  input: PlantInput,
  budget: number,
  mode: RankMode = "cost-effective",
  excludedIds: string[] = [],
): PortfolioResult {
  const thresholds = gradeThresholds();
  const current = computeFootprint(input);
  const currentGrade = computeGrade(current.per_unit_tCO2e, thresholds);

  const catalog = ACTION_CATALOG.filter((a) => !excludedIds.includes(a.id) && (a.id !== "A6" || input.raw_material.type !== "food"));
  const impacts = catalog.map((a) => computeActionImpact(a, input, defaultParams(a), { footprint: current, grade: currentGrade, thresholds }));
  const ranked = rankActions(impacts, mode);

  // Greedy knapsack: take highest cost-effectiveness first while budget allows.
  const chosen: ActionImpact[] = [];
  let spent = 0;
  for (const impact of ranked) {
    if (impact.cost_mid <= 0) {
      chosen.push(impact); // zero-cost actions always included
      continue;
    }
    if (spent + impact.cost_mid <= budget) {
      chosen.push(impact);
      spent += impact.cost_mid;
    }
  }

  const chosenActions = chosen.map((c) => getAction(c.action_id));
  const capped = computeCombinedCappedReduction(
    input,
    chosenActions,
    Object.fromEntries(chosenActions.map((a) => [a.id, defaultParams(a)])),
  );

  // Projected grade: apply all chosen actions cumulatively (honest — capped by reality).
  let projectedInput = input;
  for (const a of chosenActions) {
    projectedInput = applyActionFor(projectedInput, a.id, defaultParams(a));
  }
  const projected = computeFootprint(projectedInput);
  const projectedGrade = computeGrade(projected.per_unit_tCO2e, thresholds);

  return {
    actions: chosen,
    total_investment: spent,
    total_reduction_tCO2e: chosen.reduce((s, c) => s + c.reduction_tCO2e.value, 0),
    projected_grade: projectedGrade,
    current_grade: currentGrade,
    capped_reduction_tCO2e: Math.round(capped * 100) / 100,
  };
}

/* ------------------------------------------------------------------ *
 * Peer benchmark percentile                                            *
 * ------------------------------------------------------------------ */

/**
 * % of peers with HIGHER per-unit intensity → 0-100, higher = better.
 * Computed within the plant's own sector stratum when ≥3 same-sector peers
 * exist, otherwise over the full seed set. DEMO_PLANT is never a peer.
 */
export function computePercentile(plantPerUnit: number, input: PlantInput): { percentile: number; peerSet: "sector" | "full"; peerCount: number } {
  const sectorPeers = SEED_PLANTS.filter((p) => p.sector === input.sector);
  const peers = sectorPeers.length >= 3 ? sectorPeers : SEED_PLANTS;
  const peerCount = peers.length;
  const higher = peers.filter((p) => computeFootprint(p).per_unit_tCO2e > plantPerUnit).length;
  const percentile = peerCount === 0 ? 0 : (higher / peerCount) * 100;
  return { percentile, peerSet: sectorPeers.length >= 3 ? "sector" : "full", peerCount };
}

export { BREAKDOWN_LABELS, DEMO_PLANT, SEED_PLANTS, formatINR };