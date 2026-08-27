/**
 * Core domain types for the SAGE engine.
 * Provenance rule (spec 4): every displayed number is a TaggedNumber.
 * A number without a one-sentence derivation does not ship.
 */

export type ProvenanceTag = "measured" | "estimated" | "scenario";

export interface TaggedNumber {
  value: number;
  tag: ProvenanceTag;
  /** One-sentence derivation shown in the badge tooltip. */
  derivation: string;
  /** Optional display unit, e.g. "tCO2e/yr". */
  unit?: string;
}

export type MaterialType =
  | "steel"
  | "cement"
  | "plastic"
  | "textile"
  | "food"
  | "aluminium"
  | "copper"
  | "glass"
  | "paper"
  | "ceramic"
  | "e_waste"
  | "battery";
export type Sector =
  | "textiles"
  | "metal_fabrication"
  | "plastics"
  | "food_processing"
  | "engineering"
  | "cement"
  | "aluminium"
  | "copper"
  | "glass"
  | "foundry"
  | "paper"
  | "ceramics"
  | "e_waste"
  | "battery";
export type SizeCategory = "small" | "medium" | "large";
export type TruckClass = "HCV";

export interface EnergyMix {
  /** Grid-PURCHASED kWh per year, net of any on-site renewables. */
  grid_kwh: number;
  /** Diesel litres per year (generators, captive fleet). */
  diesel_l: number;
  /**
   * Share of on-site renewable generation, 0-100.
   * NOT a footprint term — never enters computeFootprint.
   * Used only by Action 1's transform and the simulator.
   */
  renewable_pct: number;
}

export interface RawMaterial {
  /** Emission factor is keyed by material type ONLY, never by sector. */
  type: MaterialType;
  /** Tonnes consumed per year. */
  tonnes: number;
  /** Set by Action 6 (supplier switch) — overrides MATERIAL_EF for this plant. */
  ef_override?: number;
}

export interface PlantInput {
  name: string;
  sector: Sector;
  size_category: SizeCategory;
  energy_mix: EnergyMix;
  raw_material: RawMaterial;
  waste_tonnes: number;
  /** Tonne-km model: truck_class factor × assumed payload × km. */
  transport_km: number;
  truck_class: TruckClass;
  /** Used ONLY for normalization (per-unit intensity). Not a footprint term. */
  production_units: number;
}

export type BreakdownKey = "grid" | "diesel" | "materials" | "waste" | "transport";

export interface FootprintBreakdown {
  grid: TaggedNumber;
  diesel: TaggedNumber;
  materials: TaggedNumber;
  waste: TaggedNumber;
  transport: TaggedNumber;
}

export interface FootprintResult {
  total_tCO2e: number;
  per_unit_tCO2e: number;
  breakdown: FootprintBreakdown;
  biggestContributor: BreakdownKey;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface GradeResult {
  letter: TaggedNumber; // always tagged 'estimated' — thresholds are a calibration assumption
  per_unit: number;
  thresholds: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export type Difficulty = "low" | "medium" | "high";
export type Confidence = "high" | "medium" | "low";
export type RankMode = "cost-effective" | "fastest" | "biggest";

/** A single action target parameter (matches the catalog's target_field). */
export type ActionParams = Record<string, number>;

export interface CostRange {
  min: number;
  max: number;
}

export interface ActionDefinition {
  id: string;
  name: string;
  short_name: string;
  affected_metric: string;
  target_field: string;
  unit: "pct" | "toggle";
  min: number;
  max: number;
  /** The target shown on cards / used when no explicit params are passed. */
  default_target: number;
  default_target_rationale: string;
  cost_range: CostRange;
  cost_basis: string;
  cost_source_url: string;
  difficulty: Difficulty;
  confidence: Confidence;
}

export interface ActionImpact {
  action_id: string;
  name: string;
  /** Reduction vs current footprint when this action is applied at target. */
  reduction_tCO2e: TaggedNumber;
  cost_range: CostRange;
  cost_mid: number;
  difficulty: Difficulty;
  confidence: Confidence;
  /** "C → B" style grade delta. */
  score_delta: { from: Grade; to: Grade };
  tag: ProvenanceTag;
  /** Whether this action is applicable to the plant (A6 dropped for food). */
  applicable: boolean;
}

export interface PortfolioResult {
  actions: ActionImpact[];
  total_investment: number;
  total_reduction_tCO2e: number;
  projected_grade: Grade;
  current_grade: Grade;
  /** Capped combined reduction — never promises more CO2 than the plant emits. */
  capped_reduction_tCO2e: number;
}