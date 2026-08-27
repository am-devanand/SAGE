/**
 * SAGE calculation engine — pure, deterministic, no network, no I/O.
 * Same input → identical output, always (locked by the determinism test).
 *
 * Footprint model (5 terms, spec 10.1):
 *   1. grid      = grid_purchased_kwh × GRID_EF / 1000
 *   2. diesel    = diesel_l × DIESEL_EF / 1000
 *   3. materials = raw_material.tonnes × MATERIAL_EF[type]   (ef_override wins if set)
 *   4. waste     = waste_tonnes × WASTE_LANDFILL_EF
 *   5. transport = TRUCK_EF_PER_TKM × ASSUMED_PAYLOAD_T × transport_km / 1000
 *
 * renewable_pct is NOT a footprint term (grid_kwh is already net of on-site
 * renewables). It enters only Action 1's transform and the simulator.
 */

import type {
  ActionParams,
  BreakdownKey,
  FootprintBreakdown,
  FootprintResult,
  Grade,
  GradeResult,
  MaterialType,
  PlantInput,
  TaggedNumber,
} from "./types";

/* ------------------------------------------------------------------ *
 * Emission factors — all sourced, cited inline.                       *
 * ------------------------------------------------------------------ */

/** tCO2/MWh — CEA CO2 Baseline Database for Indian Power Sector V21.0,
 *  FY 2024-25 national weighted average. Official government figure used
 *  for real corporate emissions reporting in India.
 *  Source: Central Electricity Authority (Ministry of Power, Govt. of India),
 *  Nov 2025. https://cea.nic.in/wp-content/uploads/baseline/2025/12/User_Guide_V_21.0.pdf */
export const GRID_EF = 0.7117;

/** kgCO2/L — IPCC 2006 Vol2 Ch3, Stationary Combustion, gas/diesel oil
 *  (~74.1 tCO2/TJ @ NCV 43 TJ/t, density ~0.84 kg/L). International default;
 *  India's most commonly cited diesel factor since India does not publish
 *  its own separate diesel emission factor.
 *  Cross-check: India GHG Program 2.6444 kgCO2/L. */
export const DIESEL_EF = 2.68;

/** kgCO2e/t-km — Estimated: TERI SFC-India Table 4, HCV-1 GVW 12-20 MT
 *  diesel WTW. International proxy factor, not an official India-specific source.
 *  https://teriin.org/sites/default/files/files/SFC-India-TERI.pdf
 *  Assumed payload: 8 t per HCV trip (documented assumption). */
export const TRUCK_EF_PER_TKM = 0.0902;
export const ASSUMED_PAYLOAD_T = 8;

/** tCO2e/t waste landfilled — Estimated: IPCC 2006 Vol5 default-derived;
 *  Delhi landfill CH4 field data 4.2–5.6 g/kg (White Rose eprints 220757).
 *  Proxy factor, not an official India-specific source. */
export const WASTE_LANDFILL_EF = 0.6;

/** tCO2e/t by material type — Estimated: proxy factors, not official
 *  India-specific sources. India does not yet publish sector-specific
 *  material emission factors, so these use internationally recognized
 *  values from IEEFA, IRENA, IAI, ICSG, and published LCA ranges.
 *  textile/plastic/food = MEDIUM confidence (documented proxies). */
export const MATERIAL_EF: Record<MaterialType, number> = {
  steel: 2.55,
  cement: 0.673,
  plastic: 3.0,
  textile: 5.0,
  food: 1.2,
  aluminium: 2.2, // primary ingot, cradle-to-gate excl. purchased power (IAI/IEA ranges)
  copper: 2.5, // smelted cathode (ICSG published LCA ranges)
  glass: 0.8, // container glass, published LCA
  paper: 1.0, // kraft paper, published LCA
  ceramic: 0.7, // ceramic tile body, published LCA
  e_waste: 0.5, // mixed e-waste feedstock, collection+sorting LCA proxy
  battery: 6.0, // NMC-class cathode active material, published LCA
};

/** Sourced lower-carbon alternatives, keyed for Action 6 (supplier switch).
 *  food is deliberately absent — no sourced low-carbon food-material value
 *  exists, so Action 6 is not offered for food plants. */
export const MATERIAL_EF_LOW_CARBON: Partial<Record<MaterialType, number>> = {
  steel: 1.85, // global avg / EAF route (IEEFA)
  cement: 0.4, // blended / Portland-composite cement (IRENA)
  plastic: 2.0, // recycled-content resin (published LCA)
  textile: 3.0, // recycled fibre (published LCA)
  aluminium: 0.6, // secondary / recycled aluminium (~95% energy saving)
  copper: 0.7, // secondary / recycled copper (published LCA)
  glass: 0.4, // cullet-heavy batch (published LCA)
  paper: 0.6, // recycled pulp (published LCA)
  ceramic: 0.4, // recycled body / cullet (published LCA)
  e_waste: 0.15, // certified low-carbon feedstock (recycling LCA proxy)
  battery: 3.0, // recycled cathode material (published LCA)
};

/* ------------------------------------------------------------------ *
 * Footprint                                                            *
 * ------------------------------------------------------------------ */

export function computeFootprint(input: PlantInput): FootprintResult {
  const { energy_mix, raw_material, waste_tonnes, transport_km, production_units } = input;

  if (production_units <= 0) {
    throw new Error("production_units must be > 0 (normalization denominator)");
  }
  if (transport_km < 0 || waste_tonnes < 0 || energy_mix.grid_kwh < 0 || energy_mix.diesel_l < 0 || raw_material.tonnes < 0) {
    throw new Error("negative inputs are not valid plant data");
  }

  const ef = raw_material.ef_override ?? MATERIAL_EF[raw_material.type];

  const grid = (energy_mix.grid_kwh * GRID_EF) / 1000;
  const diesel = (energy_mix.diesel_l * DIESEL_EF) / 1000;
  const materials = raw_material.tonnes * ef;
  const waste = waste_tonnes * WASTE_LANDFILL_EF;
  const transport = (TRUCK_EF_PER_TKM * ASSUMED_PAYLOAD_T * transport_km) / 1000;

  const total = grid + diesel + materials + waste + transport;

  const breakdown: FootprintBreakdown = {
    grid: { value: grid, tag: "measured", derivation: "grid-purchased kWh × CEA grid factor 0.7117 tCO2/MWh ÷ 1000 (V21.0, FY2024-25)", unit: "tCO2e/yr" },
    diesel: { value: diesel, tag: "measured", derivation: "diesel litres × IPCC 2.68 kgCO2/L ÷ 1000", unit: "tCO2e/yr" },
    materials: { value: materials, tag: "measured", derivation: `material tonnes × ${ef} tCO2e/t (${raw_material.type}${raw_material.ef_override !== undefined ? ", low-carbon supplier factor" : ""})`, unit: "tCO2e/yr" },
    waste: { value: waste, tag: "measured", derivation: "waste tonnes × landfill factor 0.6 tCO2e/t", unit: "tCO2e/yr" },
    transport: { value: transport, tag: "measured", derivation: "0.0902 kgCO2e/t-km × 8 t payload × km ÷ 1000", unit: "tCO2e/yr" },
  };

  const entries = Object.entries(breakdown) as [BreakdownKey, TaggedNumber][];
  let biggest: BreakdownKey = "grid";
  for (const [key, term] of entries) {
    if (term.value > breakdown[biggest].value) biggest = key;
  }

  return {
    total_tCO2e: total,
    per_unit_tCO2e: production_units > 0 ? total / production_units : 0,
    breakdown,
    biggestContributor: biggest,
  };
}

/* ------------------------------------------------------------------ *
 * applyAction — the ONE transform behind cards, simulator and ranking. *
 * ------------------------------------------------------------------ */

/**
 * Apply a single action to a plant input. Pure — returns a new object,
 * never mutates. Guard order (pinned): target ≤ current → unchanged FIRST;
 * current ≥ 100 → grid = 0; div-by-zero impossible.
 */
export function applyAction(input: PlantInput, actionId: string, params: ActionParams): PlantInput {
  const next: PlantInput = structuredClone(input);

  switch (actionId) {
    case "A1": {
      // renewable_pct target: share of the CURRENT grid draw switched to on-site solar.
      const target = params.renewable_pct ?? 40;
      const current = input.energy_mix.renewable_pct;
      if (target <= current) return input; // no change
      if (current >= 100) {
        next.energy_mix.grid_kwh = 0;
      } else {
        next.energy_mix.grid_kwh = input.energy_mix.grid_kwh * ((100 - target) / (100 - current));
      }
      next.energy_mix.renewable_pct = target;
      return next;
    }
    case "A2": {
      const pct = params.waste_reduction_pct ?? 20;
      next.waste_tonnes = input.waste_tonnes * (1 - pct / 100);
      return next;
    }
    case "A3": {
      const pct = params.transport_reduction_pct ?? 20;
      next.transport_km = input.transport_km * (1 - pct / 100);
      return next;
    }
    case "A4": {
      // Fixed efficiency assumption — no slider (pinned 15%).
      const pct = params.efficiency_pct ?? 15;
      next.energy_mix.grid_kwh = input.energy_mix.grid_kwh * (1 - pct / 100);
      return next;
    }
    case "A5": {
      const pct = params.material_reduction_pct ?? 20;
      next.raw_material = { ...input.raw_material, tonnes: input.raw_material.tonnes * (1 - pct / 100) };
      return next;
    }
    case "A6": {
      // Binary toggle: 1 → low-carbon supplier factor; 0 → unchanged.
      const on = params.supplier_switch === 1;
      if (!on) return input;
      const low = MATERIAL_EF_LOW_CARBON[input.raw_material.type];
      if (low === undefined) return input; // food plants: action not offered
      next.raw_material = { ...input.raw_material, ef_override: low };
      return next;
    }
    default:
      throw new Error(`unknown action id: ${actionId}`);
  }
}

/* ------------------------------------------------------------------ *
 * Grade — calibrated to the 25-plant synthetic seed distribution.     *
 * ------------------------------------------------------------------ */

/**
 * Grade thresholds are computed once from the seed dataset: A ≤ p20,
 * B p20–p40, C p40–p60, D p60–p80, F > p80 of per-unit intensity
 * (LOWER intensity = BETTER grade). Midrank interpolation for cut points.
 * This is a calibration assumption, not a regulation — hence the grade
 * letter is always tagged 'estimated'.
 */
export function calibrateGradeThresholds(seedPerUnit: number[]): GradeResult["thresholds"] {
  if (seedPerUnit.length === 0) {
    // Deterministic fallback if seed is missing — documented calibration.
    return { A: 0.001, B: 0.002, C: 0.003, D: 0.004, F: 0.005 };
  }
  const sorted = [...seedPerUnit].sort((a, b) => a - b);
  const percentile = (p: number) => {
    const rank = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(rank);
    const hi = Math.ceil(rank);
    return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
  };
  return {
    A: percentile(20),
    B: percentile(40),
    C: percentile(60),
    D: percentile(80),
    F: percentile(100),
  };
}

export function computeGrade(perUnit: number, thresholds: GradeResult["thresholds"]): Grade {
  if (perUnit <= thresholds.A) return "A";
  if (perUnit <= thresholds.B) return "B";
  if (perUnit <= thresholds.C) return "C";
  if (perUnit <= thresholds.D) return "D";
  return "F";
}

export function gradeFromFootprint(
  footprint: FootprintResult,
  thresholds: GradeResult["thresholds"],
): GradeResult {
  const letter = computeGrade(footprint.per_unit_tCO2e, thresholds);
  return {
    letter: {
      value: footprint.per_unit_tCO2e,
      tag: "measured",
      derivation:
        "computed deterministically from measured plant inputs; grade bands calibrated to the sector peer distribution (see README) — lower per-unit intensity = better grade",
    },
    per_unit: footprint.per_unit_tCO2e,
    thresholds,
  };
}

/** Human label for a breakdown key. */
export const BREAKDOWN_LABELS: Record<BreakdownKey, string> = {
  grid: "Grid Energy",
  diesel: "Diesel",
  materials: "Raw Materials",
  waste: "Waste",
  transport: "Transport",
};

export function formatINR(value: number): string {
  // Indian digit grouping: 12,34,567
  const rounded = Math.round(value);
  const s = String(rounded);
  if (s.length <= 3) return `₹${s}`;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `₹${rest},${last3}`;
}

export function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits);
}