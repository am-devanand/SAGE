/**
 * Engine contract tests — lock the pinned math from the review-hardened plan.
 * Fixture: DEMO_PLANT (Saraswati Textiles).
 *
 * Hand-calculated fixture:
 *   grid      = 620000 × 0.7117/1000           = 441.254
 *   diesel    = 9500 × 2.68/1000              = 25.46
 *   materials = 480 × 5.0 (textile)           = 2400
 *   waste     = 64 × 0.6                      = 38.4
 *   transport = 0.0902 × 8 × 96000 / 1000     = 69.2736
 *   total     = 2974.3876
 */
import { describe, expect, it } from "vitest";
import { ACTION_CATALOG } from "../lib/action-catalog";
import {
  applyAction,
  computeFootprint,
  computeGrade,
  gradeFromFootprint,
} from "../lib/calc-engine";
import {
  computeActionImpact,
  computeCombinedCappedReduction,
  computePercentile,
  defaultParams,
  findBestPortfolio,
  gradeThresholds,
  rankActions,
} from "../lib/optimizer";
import {
  ARAVALLI_PLANT,
  BHARAT_PLANT,
  BHOOMI_PLANT,
  COASTAL_PLANT,
  DECCAN_PLANT,
  DEMO_PLANT,
  DEMO_PLANTS,
  EASTERN_PLANT,
  GANGA_PLANT,
  KAVERI_PLANT,
  KRISHNA_PLANT,
  NARMADA_PLANT,
  POLYNEST_PLANT,
  PRECISION_PLANT,
  SAHYADRI_PLANT,
  SEED_PLANTS,
  VINDHYA_PLANT,
} from "../lib/seed-data";

describe("computeFootprint", () => {
  it("matches the hand-calculated fixture", () => {
    const r = computeFootprint(DEMO_PLANT);
    expect(r.breakdown.grid.value).toBeCloseTo(441.254, 1);
    expect(r.breakdown.diesel.value).toBeCloseTo(25.46, 1);
    expect(r.breakdown.materials.value).toBeCloseTo(2400, 1);
    expect(r.breakdown.waste.value).toBeCloseTo(38.4, 1);
    expect(r.breakdown.transport.value).toBeCloseTo(69.2736, 1);
    expect(r.total_tCO2e).toBeCloseTo(2974.3876, 1);
    expect(r.biggestContributor).toBe("materials");
  });

  it("throws on zero production units (no NaN)", () => {
    expect(() => computeFootprint({ ...DEMO_PLANT, production_units: 0 })).toThrow();
  });

  it("throws on negative inputs", () => {
    expect(() => computeFootprint({ ...DEMO_PLANT, waste_tonnes: -5 })).toThrow();
  });
});

describe("applyAction transforms", () => {
  it("A1 ratio transform: 5% → 40% renewable cuts grid to grid×(60/95)", () => {
    const after = applyAction(DEMO_PLANT, "A1", { renewable_pct: 40 });
    expect(after.energy_mix.grid_kwh).toBeCloseTo(620000 * (60 / 95), 1);
    expect(after.energy_mix.renewable_pct).toBe(40);
  });

  it("A1 at target ≤ current returns input unchanged", () => {
    const after = applyAction(DEMO_PLANT, "A1", { renewable_pct: 5 });
    expect(after).toBe(DEMO_PLANT);
  });

  it("A1 at current ≥ 100 → no NaN, grid stays (guard order: target ≤ current → unchanged first)", () => {
    const plant = { ...DEMO_PLANT, energy_mix: { ...DEMO_PLANT.energy_mix, renewable_pct: 100 } };
    const after = applyAction(plant, "A1", { renewable_pct: 100 });
    expect(after.energy_mix.grid_kwh).toBe(620000); // unchanged, and no division-by-zero
  });

  it("A2: waste × (1 − 20%)", () => {
    const after = applyAction(DEMO_PLANT, "A2", { waste_reduction_pct: 20 });
    expect(after.waste_tonnes).toBeCloseTo(64 * 0.8, 6);
  });

  it("A4 fixed 15%: grid × 0.85", () => {
    const after = applyAction(DEMO_PLANT, "A4", { efficiency_pct: 15 });
    expect(after.energy_mix.grid_kwh).toBeCloseTo(620000 * 0.85, 1);
  });

  it("A6 toggle ON sets ef_override to low-carbon factor; OFF returns input unchanged", () => {
    const on = applyAction(DEMO_PLANT, "A6", { supplier_switch: 1 });
    expect(on.raw_material.ef_override).toBe(3.0); // textile low-carbon
    const off = applyAction(DEMO_PLANT, "A6", { supplier_switch: 0 });
    expect(off).toBe(DEMO_PLANT);
    // Toggle ON footprint === input-with-ef_override footprint (Oracle acceptance)
    const manual = { ...DEMO_PLANT, raw_material: { ...DEMO_PLANT.raw_material, ef_override: 3.0 } };
    expect(computeFootprint(on).total_tCO2e).toBeCloseTo(computeFootprint(manual).total_tCO2e, 6);
  });

  it("A6 not offered for food plants (returns input unchanged)", () => {
    const food = { ...DEMO_PLANT, raw_material: { type: "food" as const, tonnes: 1000 } };
    const after = applyAction(food, "A6", { supplier_switch: 1 });
    expect(after.raw_material.ef_override).toBeUndefined();
  });
});

describe("grade mapping", () => {
  it("all seed plants get a valid grade", () => {
    const thresholds = gradeThresholds();
    for (const p of SEED_PLANTS) {
      const grade = computeGrade(computeFootprint(p).per_unit_tCO2e, thresholds);
      expect(["A", "B", "C", "D", "F"]).toContain(grade);
    }
  });

  it("seed spread yields all 5 grades (soft gate)", () => {
    const thresholds = gradeThresholds();
    const grades = new Set(SEED_PLANTS.map((p) => computeGrade(computeFootprint(p).per_unit_tCO2e, thresholds)));
    expect(grades.size).toBeGreaterThanOrEqual(4);
  });

  it("lower intensity ⇒ better-or-equal grade", () => {
    const thresholds = gradeThresholds();
    const low = computeGrade(0.0001, thresholds);
    const high = computeGrade(10, thresholds);
    expect(["A", "B", "C", "D", "F"].indexOf(low)).toBeLessThanOrEqual(["A", "B", "C", "D", "F"].indexOf(high));
  });

  it("grade letter is tagged 'measured' (deterministic from measured inputs)", () => {
    const result = gradeFromFootprint(computeFootprint(DEMO_PLANT), gradeThresholds());
    expect(result.letter.tag).toBe("measured");
  });
});

describe("determinism", () => {
  it("same input twice → deep-equal output", () => {
    const a = computeFootprint(DEMO_PLANT);
    const b = computeFootprint(structuredClone(DEMO_PLANT));
    expect(a).toEqual(b);
    expect(gradeFromFootprint(a, gradeThresholds())).toEqual(gradeFromFootprint(b, gradeThresholds()));
  });
});

describe("seed integrity", () => {
  it("DEMO_PLANT is never a seed peer", () => {
    expect(SEED_PLANTS).not.toContain(DEMO_PLANT);
    expect(SEED_PLANTS.some((p) => p.name === DEMO_PLANT.name)).toBe(false);
  });

  it("every demo plant is never a seed peer", () => {
    for (const plant of DEMO_PLANTS) {
      expect(SEED_PLANTS.some((p) => p.name === plant.name)).toBe(false);
    }
  });

  it("25 plants, 5 sectors × 5", () => {
    expect(SEED_PLANTS).toHaveLength(25);
    const sectors = new Set(SEED_PLANTS.map((p) => p.sector));
    expect(sectors.size).toBe(5);
  });
});

describe("Kaveri Dyeing & Processing (second demo plant)", () => {
  const thresholds = gradeThresholds();

  it("is C-grade with materials as the single dominant contributor", () => {
    const fp = computeFootprint(KAVERI_PLANT);
    expect(fp.biggestContributor).toBe("materials");
    expect(computeGrade(fp.per_unit_tCO2e, thresholds)).toBe("C");
    const materialsShare = fp.breakdown.materials.value / fp.total_tCO2e;
    expect(materialsShare).toBeGreaterThan(0.5);
  });

  it("the default ₹45L portfolio lifts C → B", () => {
    const pf = findBestPortfolio(KAVERI_PLANT, 4500000, "cost-effective");
    expect(pf.current_grade).toBe("C");
    expect(pf.projected_grade).toBe("B");
    expect(pf.total_investment).toBeLessThanOrEqual(4500000);
  });

  it("the materials lever (A5+A6) drives the majority of the reduction", () => {
    const pf = findBestPortfolio(KAVERI_PLANT, 4500000, "cost-effective");
    const materialsReduction = pf.actions
      .filter((a) => a.action_id === "A5" || a.action_id === "A6")
      .reduce((sum, a) => sum + a.reduction_tCO2e.value, 0);
    expect(materialsReduction / pf.capped_reduction_tCO2e).toBeGreaterThan(0.8);
  });

  it("distinct doc number per demo plant (plan certifications are unique)", () => {
    const docSuffix = (name: string) => {
      let h = 2166136261;
      for (let i = 0; i < name.length; i++) {
        h ^= name.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return String((h >>> 0) % 9000 + 1000);
    };
    const suffixes = DEMO_PLANTS.map((p) => docSuffix(p.name));
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });
});

describe("Deccan Steel Rolling Mills (metal fabrication demo plant)", () => {
  const thresholds = gradeThresholds();

  it("is C-grade with materials as the single dominant contributor", () => {
    const fp = computeFootprint(DECCAN_PLANT);
    expect(fp.biggestContributor).toBe("materials");
    expect(computeGrade(fp.per_unit_tCO2e, thresholds)).toBe("C");
    const materialsShare = fp.breakdown.materials.value / fp.total_tCO2e;
    expect(materialsShare).toBeGreaterThan(0.5);
  });

  it("the default ₹45L portfolio lifts C → B", () => {
    const pf = findBestPortfolio(DECCAN_PLANT, 4500000, "cost-effective");
    expect(pf.current_grade).toBe("C");
    expect(pf.projected_grade).toBe("B");
    expect(pf.total_investment).toBeLessThanOrEqual(4500000);
  });

  it("the materials lever (A5+A6) drives the majority of the reduction", () => {
    const pf = findBestPortfolio(DECCAN_PLANT, 4500000, "cost-effective");
    const materialsReduction = pf.actions
      .filter((a) => a.action_id === "A5" || a.action_id === "A6")
      .reduce((sum, a) => sum + a.reduction_tCO2e.value, 0);
    expect(materialsReduction / pf.capped_reduction_tCO2e).toBeGreaterThan(0.5);
  });
});

describe("PolyNest Polymers (plastics demo plant)", () => {
  const thresholds = gradeThresholds();

  it("is C-grade with materials as the dominant contributor", () => {
    const fp = computeFootprint(POLYNEST_PLANT);
    expect(fp.biggestContributor).toBe("materials");
    expect(computeGrade(fp.per_unit_tCO2e, thresholds)).toBe("C");
    const materialsShare = fp.breakdown.materials.value / fp.total_tCO2e;
    expect(materialsShare).toBeGreaterThan(0.7);
  });

  it("the default ₹45L portfolio lifts C → A", () => {
    const pf = findBestPortfolio(POLYNEST_PLANT, 4500000, "cost-effective");
    expect(pf.current_grade).toBe("C");
    expect(pf.projected_grade).toBe("A");
    expect(pf.total_investment).toBeLessThanOrEqual(4500000);
  });

  it("A6 supplier switch is selected (plastic has a low-carbon source)", () => {
    const pf = findBestPortfolio(POLYNEST_PLANT, 4500000, "cost-effective");
    expect(pf.actions.some((a) => a.action_id === "A6")).toBe(true);
  });
});

describe("Bhoomi Agro Foods (food processing demo plant)", () => {
  const thresholds = gradeThresholds();

  it("is C-grade with waste as the dominant contributor", () => {
    const fp = computeFootprint(BHOOMI_PLANT);
    expect(fp.biggestContributor).toBe("waste");
    expect(computeGrade(fp.per_unit_tCO2e, thresholds)).toBe("C");
    const wasteShare = fp.breakdown.waste.value / fp.total_tCO2e;
    expect(wasteShare).toBeGreaterThan(0.4);
  });

  it("the default ₹45L portfolio lifts C → B", () => {
    const pf = findBestPortfolio(BHOOMI_PLANT, 4500000, "cost-effective");
    expect(pf.current_grade).toBe("C");
    expect(pf.projected_grade).toBe("B");
    expect(pf.total_investment).toBeLessThanOrEqual(4500000);
  });

  it("A6 is NOT offered for food (no sourced low-carbon food factor)", () => {
    const pf = findBestPortfolio(BHOOMI_PLANT, 4500000, "cost-effective");
    expect(pf.actions.some((a) => a.action_id === "A6")).toBe(false);
  });
});

describe("Precision Axis Engineering (engineering demo plant)", () => {
  const thresholds = gradeThresholds();

  it("is C-grade with materials as the dominant contributor", () => {
    const fp = computeFootprint(PRECISION_PLANT);
    expect(fp.biggestContributor).toBe("materials");
    expect(computeGrade(fp.per_unit_tCO2e, thresholds)).toBe("C");
    const materialsShare = fp.breakdown.materials.value / fp.total_tCO2e;
    expect(materialsShare).toBeGreaterThan(0.5);
  });

  it("the default ₹45L portfolio lifts C → B", () => {
    const pf = findBestPortfolio(PRECISION_PLANT, 4500000, "cost-effective");
    expect(pf.current_grade).toBe("C");
    expect(pf.projected_grade).toBe("B");
    expect(pf.total_investment).toBeLessThanOrEqual(4500000);
  });

  it("A6 supplier switch is selected (steel has a low-carbon source)", () => {
    const pf = findBestPortfolio(PRECISION_PLANT, 4500000, "cost-effective");
    expect(pf.actions.some((a) => a.action_id === "A6")).toBe(true);
  });
});

describe("demo plants #7–15 (new industries)", () => {
  const thresholds = gradeThresholds();
  const contracts = [
    { plant: ARAVALLI_PLANT, grade: "D", biggest: "grid", to: "C", hasA1: false },
    { plant: COASTAL_PLANT, grade: "D", biggest: "grid", to: "B", hasA1: true },
    { plant: VINDHYA_PLANT, grade: "C", biggest: "materials", to: "B", hasA1: false },
    { plant: NARMADA_PLANT, grade: "C", biggest: "grid", to: "B", hasA1: false },
    { plant: EASTERN_PLANT, grade: "C", biggest: "materials", to: "B", hasA1: false },
    { plant: KRISHNA_PLANT, grade: "C", biggest: "grid", to: "B", hasA1: false },
    { plant: SAHYADRI_PLANT, grade: "D", biggest: "grid", to: "C", hasA1: false },
    { plant: BHARAT_PLANT, grade: "B", biggest: "materials", to: "A", hasA1: true },
    { plant: GANGA_PLANT, grade: "C", biggest: "materials", to: "B", hasA1: false },
  ];

  it.each(contracts)(
    "$plant.name: $grade-grade, $biggest dominant, ₹45L portfolio → $to",
    ({ plant, grade, biggest, to, hasA1 }) => {
      const fp = computeFootprint(plant);
      expect(fp.biggestContributor).toBe(biggest);
      expect(computeGrade(fp.per_unit_tCO2e, thresholds)).toBe(grade);
      const pf = findBestPortfolio(plant, 4500000, "cost-effective");
      expect(pf.current_grade).toBe(grade);
      expect(pf.projected_grade).toBe(to);
      expect(pf.total_investment).toBeLessThanOrEqual(4500000);
      expect(pf.actions.some((a) => a.action_id === "A1")).toBe(hasA1);
    },
  );
});

describe("catalog contract", () => {
  it("6 actions with pinned defaults and bounds", () => {
    expect(ACTION_CATALOG).toHaveLength(6);
    const byId = Object.fromEntries(ACTION_CATALOG.map((a) => [a.id, a]));
    expect(byId.A1.default_target).toBe(40);
    expect(byId.A2.default_target).toBe(20);
    expect(byId.A3.default_target).toBe(20);
    expect(byId.A4.default_target).toBe(15);
    expect(byId.A5.default_target).toBe(20);
    expect(byId.A6.default_target).toBe(1);
    // bounds pinned
    expect(byId.A1).toMatchObject({ min: 0, max: 100 });
    expect(byId.A4).toMatchObject({ min: 15, max: 15 });
    expect(byId.A6).toMatchObject({ min: 0, max: 1 });
    // every action has a source URL and basis
    for (const a of ACTION_CATALOG) {
      expect(a.cost_source_url).toMatch(/^https:\/\//);
      expect(a.cost_basis.length).toBeGreaterThan(10);
    }
  });
});

describe("ranking & capping", () => {
  it("cost-effective order = reduction/cost_mid desc", () => {
    const impacts = ACTION_CATALOG.map((a) => computeActionImpact(a, DEMO_PLANT, defaultParams(a)));
    const ranked = rankActions(impacts, "cost-effective");
    for (let i = 1; i < ranked.length; i++) {
      const prevEff = ranked[i - 1].reduction_tCO2e.value / Math.max(1, ranked[i - 1].cost_mid);
      const eff = ranked[i].reduction_tCO2e.value / Math.max(1, ranked[i].cost_mid);
      expect(prevEff).toBeGreaterThanOrEqual(eff);
    }
  });

  it("biggest mode sorts by raw reduction desc", () => {
    const impacts = ACTION_CATALOG.map((a) => computeActionImpact(a, DEMO_PLANT, defaultParams(a)));
    const ranked = rankActions(impacts, "biggest");
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].reduction_tCO2e.value).toBeGreaterThanOrEqual(ranked[i].reduction_tCO2e.value);
    }
  });

  it("combined capped reduction ≤ total footprint (never promises more)", () => {
    const paramsMap = Object.fromEntries(ACTION_CATALOG.map((a) => [a.id, defaultParams(a)]));
    const capped = computeCombinedCappedReduction(DEMO_PLANT, ACTION_CATALOG, paramsMap);
    const total = computeFootprint(DEMO_PLANT).total_tCO2e;
    expect(capped).toBeLessThanOrEqual(total);
  });

  it("portfolio respects budget and caps", () => {
    const pf = findBestPortfolio(DEMO_PLANT, 3000000, "cost-effective");
    expect(pf.total_investment).toBeLessThanOrEqual(3000000);
    expect(pf.capped_reduction_tCO2e).toBeLessThanOrEqual(computeFootprint(DEMO_PLANT).total_tCO2e);
    expect(pf.actions.length).toBeGreaterThan(0);
  });

  it("at-rest simulator (default targets) equals card reduction for A1 and A6", () => {
    for (const id of ["A1", "A6"]) {
      const action = ACTION_CATALOG.find((a) => a.id === id)!;
      const impact = computeActionImpact(action, DEMO_PLANT, defaultParams(action));
      const after = computeFootprint(applyAction(DEMO_PLANT, id, defaultParams(action)));
      const direct = computeFootprint(DEMO_PLANT).total_tCO2e - after.total_tCO2e;
      expect(impact.reduction_tCO2e.value).toBeCloseTo(Math.max(0, direct), 4);
    }
  });
});

describe("benchmark percentile", () => {
  it("is computed within the sector stratum (5 textiles peers)", () => {
    const perUnit = computeFootprint(DEMO_PLANT).per_unit_tCO2e;
    const { percentile, peerSet, peerCount } = computePercentile(perUnit, DEMO_PLANT);
    expect(peerSet).toBe("sector");
    expect(peerCount).toBe(5);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(100);
  });
});