/**
 * SAGE action catalog — 6 sourced actions. All math lives in calc-engine.ts
 * (applyAction); the catalog only declares WHICH transform applies, its
 * parameters, the pinned default target, and the cited cost basis.
 *
 * Pinned defaults (Oracle round-3/4/5):
 *   A1 = 40% (renewable share)  | bounds 0–100
 *   A2/A3/A5 = 20% (moderate program target) | bounds 0–50
 *   A4 = 15% (FIXED efficiency assumption, no slider) | bounds 15–15
 *   A6 = 1 (toggle ON) | bounds 0–1
 *
 * Cost model: A1/A4/A5 scale with impact (per-kW, per-kWh, per-tonne);
 * A2/A3 scale with tonnes/km reduced; A6 is a fixed program range.
 * Every cost is a RANGE with a basis + source — never a made-up single point.
 */

import type { ActionDefinition } from "./types";

export const ACTION_CATALOG: ActionDefinition[] = [
  {
    id: "A1",
    name: "Increase Renewable Share",
    short_name: "Renewable",
    affected_metric: "grid energy",
    target_field: "renewable_pct",
    unit: "pct",
    min: 0,
    max: 100,
    default_target: 40,
    default_target_rationale: "typical first-step solar share for an MSME roof",
    cost_range: { min: 36185, max: 53398 },
    cost_basis: "per kW solar capex (₹36,185–53,398/kW) @ 1,400 kWh/kWp yield",
    cost_source_url: "https://mnre.gov.in/solar/schemes/",
    difficulty: "medium",
    confidence: "high",
  },
  {
    id: "A2",
    name: "Reduce Material Waste",
    short_name: "Waste",
    affected_metric: "waste output",
    target_field: "waste_reduction_pct",
    unit: "pct",
    min: 0,
    max: 50,
    default_target: 20,
    default_target_rationale: "moderate waste-segregation / composting program target",
    cost_range: { min: 8000, max: 14000 },
    cost_basis: "per tonne/year diverted — segregation + composting/digester program",
    cost_source_url: "https://shaktifoundation.in/report/msme-waste/",
    difficulty: "low",
    confidence: "medium",
  },
  {
    id: "A3",
    name: "Optimize Transport & Logistics",
    short_name: "Transport",
    affected_metric: "transport distance",
    target_field: "transport_reduction_pct",
    unit: "pct",
    min: 0,
    max: 50,
    default_target: 20,
    default_target_rationale: "moderate route-consolidation / fleet-scheduling target",
    cost_range: { min: 18, max: 32 },
    cost_basis: "per km/year — route consolidation + fleet scheduling",
    cost_source_url: "https://teriin.org/sites/default/files/files/SFC-India-TERI.pdf",
    difficulty: "low",
    confidence: "medium",
  },
  {
    id: "A4",
    name: "Improve Energy Efficiency",
    short_name: "Efficiency",
    affected_metric: "grid energy",
    target_field: "efficiency_pct",
    unit: "pct",
    min: 15,
    max: 15,
    default_target: 15,
    default_target_rationale: "fixed assumption: LED + motor-retrofit program saves 15% of grid draw",
    cost_range: { min: 12, max: 18 },
    cost_basis: "per kWh/year saved — EESL UJALA-style efficiency retrofit",
    cost_source_url: "https://eeslindia.org/en/ourservices/",
    difficulty: "medium",
    confidence: "high",
  },
  {
    id: "A5",
    name: "Reduce Raw Material Intensity",
    short_name: "Materials",
    affected_metric: "raw material tonnes",
    target_field: "material_reduction_pct",
    unit: "pct",
    min: 0,
    max: 50,
    default_target: 20,
    default_target_rationale: "moderate process-optimization / scrap-recovery target",
    cost_range: { min: 6000, max: 10000 },
    cost_basis: "per tonne/year saved — process optimization + scrap recovery",
    cost_source_url: "https://www.ieefa.org/india-steel/",
    difficulty: "high",
    confidence: "medium",
  },
  {
    id: "A6",
    name: "Switch to Lower-Carbon Supplier",
    short_name: "Supplier",
    affected_metric: "raw material embodied factor",
    target_field: "supplier_switch",
    unit: "toggle",
    min: 0,
    max: 1,
    default_target: 1,
    default_target_rationale: "binary: source low-carbon material (EAF steel / recycled resin / blended cement)",
    cost_range: { min: 150000, max: 400000 },
    cost_basis: "fixed program — supplier audit, renegotiation & certification",
    cost_source_url: "https://www.ieefa.org/india-steel/",
    difficulty: "high",
    confidence: "medium",
  },
];

export function getAction(id: string): ActionDefinition {
  const a = ACTION_CATALOG.find((x) => x.id === id);
  if (!a) throw new Error(`unknown action: ${id}`);
  return a;
}

/** Actions applicable to a plant (A6 dropped for food — no sourced low-carbon factor). */
export function applicableActions(sector: import("./types").Sector, materialType: import("./types").MaterialType): ActionDefinition[] {
  if (materialType === "food") {
    return ACTION_CATALOG.filter((a) => a.id !== "A6");
  }
  return ACTION_CATALOG;
}