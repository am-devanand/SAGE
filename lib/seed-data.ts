/**
 * Synthetic peer dataset — 25 plants, 5 sectors × 5 plants, with
 * deliberately increasing per-unit intensity inside each sector so the
 * grade spread covers A–F. Realistic Indian MSME mixes.
 *
 * Disclosure: these are SYNTHETIC profiles for demonstration. The benchmark
 * percentile is therefore tagged 'scenario' in the UI.
 *
 * DEMO_PLANT is a separate export and is NEVER a peer (a plant must not
 * benchmark against its own identical twin) — asserted by test.
 */

import type { PlantInput, Sector } from "./types";

type SeedSpec = {
  name: string;
  sector: Sector;
  grid_kwh: number;
  diesel_l: number;
  renewable_pct: number;
  materialType: PlantInput["raw_material"]["type"];
  materialTonnes: number;
  waste: number;
  transport_km: number;
  production: number;
};

const SPECS: SeedSpec[] = [
  // --- textiles (material: textile) ---
  { name: "WeaveCraft Mills", sector: "textiles", grid_kwh: 410000, diesel_l: 5200, renewable_pct: 12, materialType: "textile", materialTonnes: 320, waste: 36, transport_km: 64000, production: 900000 },
  { name: "Indigo Tex Processors", sector: "textiles", grid_kwh: 620000, diesel_l: 8800, renewable_pct: 8, materialType: "textile", materialTonnes: 470, waste: 58, transport_km: 92000, production: 820000 },
  { name: "Surya Fabrics Pvt", sector: "textiles", grid_kwh: 840000, diesel_l: 12400, renewable_pct: 5, materialType: "textile", materialTonnes: 610, waste: 81, transport_km: 128000, production: 760000 },
  { name: "Loomline Synthetics", sector: "textiles", grid_kwh: 1120000, diesel_l: 18600, renewable_pct: 3, materialType: "textile", materialTonnes: 760, waste: 104, transport_km: 164000, production: 640000 },
  { name: "Nandi Handloom Exports", sector: "textiles", grid_kwh: 1460000, diesel_l: 26800, renewable_pct: 0, materialType: "textile", materialTonnes: 940, waste: 138, transport_km: 212000, production: 520000 },

  // --- metal fabrication (material: steel) ---
  { name: "ForgePoint Engineering", sector: "metal_fabrication", grid_kwh: 680000, diesel_l: 9400, renewable_pct: 10, materialType: "steel", materialTonnes: 540, waste: 48, transport_km: 88000, production: 520000 },
  { name: "Anvil Fabricators", sector: "metal_fabrication", grid_kwh: 920000, diesel_l: 14800, renewable_pct: 6, materialType: "steel", materialTonnes: 720, waste: 74, transport_km: 116000, production: 460000 },
  { name: "Kovai Metal Works", sector: "metal_fabrication", grid_kwh: 1280000, diesel_l: 22400, renewable_pct: 4, materialType: "steel", materialTonnes: 980, waste: 112, transport_km: 156000, production: 380000 },
  { name: "SteelCraft Industries", sector: "metal_fabrication", grid_kwh: 1740000, diesel_l: 32600, renewable_pct: 2, materialType: "steel", materialTonnes: 1340, waste: 158, transport_km: 208000, production: 290000 },
  { name: "HeavyTone Forge Co", sector: "metal_fabrication", grid_kwh: 2320000, diesel_l: 46800, renewable_pct: 0, materialType: "steel", materialTonnes: 1820, waste: 226, transport_km: 276000, production: 210000 },

  // --- plastics (material: plastic) ---
  { name: "PolyCraft Moulds", sector: "plastics", grid_kwh: 340000, diesel_l: 4600, renewable_pct: 14, materialType: "plastic", materialTonnes: 440, waste: 44, transport_km: 56000, production: 1100000 },
  { name: "RotoMould India", sector: "plastics", grid_kwh: 520000, diesel_l: 7600, renewable_pct: 9, materialType: "plastic", materialTonnes: 640, waste: 72, transport_km: 82000, production: 940000 },
  { name: "ThermoPak Polymers", sector: "plastics", grid_kwh: 760000, diesel_l: 11600, renewable_pct: 5, materialType: "plastic", materialTonnes: 880, waste: 108, transport_km: 118000, production: 780000 },
  { name: "VinylWorks Extrusions", sector: "plastics", grid_kwh: 1040000, diesel_l: 17200, renewable_pct: 2, materialType: "plastic", materialTonnes: 1220, waste: 152, transport_km: 162000, production: 600000 },
  { name: "GrandPlast Compounds", sector: "plastics", grid_kwh: 1380000, diesel_l: 24600, renewable_pct: 0, materialType: "plastic", materialTonnes: 1680, waste: 214, transport_km: 224000, production: 430000 },

  // --- food processing (material: food) ---
  { name: "SpiceValley Foods", sector: "food_processing", grid_kwh: 560000, diesel_l: 11800, renewable_pct: 11, materialType: "food", materialTonnes: 860, waste: 92, transport_km: 72000, production: 720000 },
  { name: "Amrita Agro Mills", sector: "food_processing", grid_kwh: 820000, diesel_l: 18400, renewable_pct: 7, materialType: "food", materialTonnes: 1240, waste: 136, transport_km: 104000, production: 610000 },
  { name: "GrainNest Processors", sector: "food_processing", grid_kwh: 1160000, diesel_l: 26800, renewable_pct: 4, materialType: "food", materialTonnes: 1760, waste: 198, transport_km: 148000, production: 480000 },
  { name: "MangoOrchid Foods", sector: "food_processing", grid_kwh: 1540000, diesel_l: 39200, renewable_pct: 2, materialType: "food", materialTonnes: 2480, waste: 284, transport_km: 196000, production: 350000 },
  { name: "Coastal Pickle Works", sector: "food_processing", grid_kwh: 2020000, diesel_l: 54600, renewable_pct: 0, materialType: "food", materialTonnes: 3420, waste: 402, transport_km: 262000, production: 240000 },

  // --- engineering (material: steel) ---
  { name: "LatheLine Components", sector: "engineering", grid_kwh: 720000, diesel_l: 12800, renewable_pct: 10, materialType: "steel", materialTonnes: 420, waste: 38, transport_km: 108000, production: 440000 },
  { name: "Precision Auto Parts", sector: "engineering", grid_kwh: 1040000, diesel_l: 19600, renewable_pct: 6, materialType: "steel", materialTonnes: 610, waste: 62, transport_km: 148000, production: 360000 },
  { name: "CNCraft Machining", sector: "engineering", grid_kwh: 1480000, diesel_l: 28800, renewable_pct: 3, materialType: "steel", materialTonnes: 880, waste: 96, transport_km: 204000, production: 280000 },
  { name: "ToolWorks Precision", sector: "engineering", grid_kwh: 2080000, diesel_l: 42800, renewable_pct: 1, materialType: "steel", materialTonnes: 1260, waste: 142, transport_km: 276000, production: 200000 },
  { name: "MagnaDie Engineering", sector: "engineering", grid_kwh: 2860000, diesel_l: 62400, renewable_pct: 0, materialType: "steel", materialTonnes: 1820, waste: 208, transport_km: 368000, production: 140000 },
];

export const SEED_PLANTS: PlantInput[] = SPECS.map((s) => ({
  name: s.name,
  sector: s.sector,
  size_category: "medium" as const,
  energy_mix: { grid_kwh: s.grid_kwh, diesel_l: s.diesel_l, renewable_pct: s.renewable_pct },
  raw_material: { type: s.materialType, tonnes: s.materialTonnes },
  waste_tonnes: s.waste,
  transport_km: s.transport_km,
  truck_class: "HCV" as const,
  production_units: s.production,
}));

/**
 * Demo plant for the live demo — a small textile plant. Separate export;
 * NEVER appears in SEED_PLANTS (asserted by test).
 */
export const DEMO_PLANT: PlantInput = {
  name: "Saraswati Textiles",
  sector: "textiles",
  size_category: "small",
  energy_mix: { grid_kwh: 620000, diesel_l: 9500, renewable_pct: 5 },
  raw_material: { type: "textile", tonnes: 480 },
  waste_tonnes: 64,
  transport_km: 96000,
  truck_class: "HCV",
  production_units: 860000,
};

/**
 * Second demo plant — a C-grade plant whose grade is pinned by ONE dominant
 * fixable factor: raw material intensity (62% of footprint). Materials is
 * deliberately the lever: A5 (reduce material intensity) and A6 (switch to a
 * recycled-fibre supplier) are the two most cost-effective actions in the
 * catalog, so the default ₹45L portfolio lifts C → B with ~85% of the
 * reduction coming from the materials lever alone — the clean causal story
 * for a live demo. Never a seed peer (asserted by test).
 */
export const KAVERI_PLANT: PlantInput = {
  name: "Kaveri Dyeing & Processing",
  sector: "textiles",
  size_category: "small",
  energy_mix: { grid_kwh: 1500000, diesel_l: 5000, renewable_pct: 5 },
  raw_material: { type: "textile", tonnes: 600 },
  waste_tonnes: 200,
  transport_km: 900000,
  truck_class: "HCV",
  production_units: 700000,
};

/**
 * Third demo plant — a metal fabrication plant (steel). Materials are the
 * dominant contributor (54% of footprint); the default ₹45L portfolio lifts
 * C → B through the materials lever: A6 (switch to low-carbon EAF steel) +
 * A5 (reduce material intensity). Never a seed peer (asserted by test).
 */
export const DECCAN_PLANT: PlantInput = {
  name: "Deccan Steel Rolling Mills",
  sector: "metal_fabrication",
  size_category: "small",
  energy_mix: { grid_kwh: 1800000, diesel_l: 20000, renewable_pct: 4 },
  raw_material: { type: "steel", tonnes: 700 },
  waste_tonnes: 90,
  transport_km: 150000,
  truck_class: "HCV",
  production_units: 500000,
};

/**
 * Fourth demo plant — a plastics manufacturer. Materials dominate hard
 * (80% of footprint, highest EF in the catalog); the default ₹45L portfolio
 * lifts C → A via A6 (recycled resin supplier) + A5 (material intensity) +
 * A4/A3/A2. Never a seed peer (asserted by test).
 */
export const POLYNEST_PLANT: PlantInput = {
  name: "PolyNest Polymers",
  sector: "plastics",
  size_category: "small",
  energy_mix: { grid_kwh: 700000, diesel_l: 8000, renewable_pct: 5 },
  raw_material: { type: "plastic", tonnes: 900 },
  waste_tonnes: 140,
  transport_km: 80000,
  truck_class: "HCV",
  production_units: 600000,
};

/**
 * Fifth demo plant — a food processor. Waste is the dominant contributor
 * (42% of footprint) — but with no low-carbon supplier option for food
 * (A6 is excluded), the ₹45L portfolio lifts C → B through efficiency:
 * A5 (material intensity) + A4 (energy efficiency) + A3 (transport).
 * Never a seed peer (asserted by test).
 */
export const BHOOMI_PLANT: PlantInput = {
  name: "Bhoomi Agro Foods",
  sector: "food_processing",
  size_category: "small",
  energy_mix: { grid_kwh: 800000, diesel_l: 18000, renewable_pct: 4 },
  raw_material: { type: "food", tonnes: 800 },
  waste_tonnes: 2000,
  transport_km: 100000,
  truck_class: "HCV",
  production_units: 500000,
};

/**
 * Sixth demo plant — an engineering workshop (steel). Materials dominant
 * (62% of footprint); the ₹45L portfolio lifts C → B via A6 (low-carbon
 * steel supplier) + A5 (material intensity) + A4 + A2. Never a seed peer
 * (asserted by test).
 */
export const PRECISION_PLANT: PlantInput = {
  name: "Precision Axis Engineering",
  sector: "engineering",
  size_category: "small",
  energy_mix: { grid_kwh: 1200000, diesel_l: 15000, renewable_pct: 6 },
  raw_material: { type: "steel", tonnes: 700 },
  waste_tonnes: 100,
  transport_km: 200000,
  truck_class: "HCV",
  production_units: 400000,
};

/**
 * Seventh demo plant — a cement plant. Grid energy is the dominant
 * contributor (43% of footprint); the ₹45L portfolio lifts D → C via A4
 * (energy efficiency) + A6 (low-carbon clinker supplier / alternative fuel)
 * + A5 + A2. Never a seed peer (asserted by test).
 */
export const ARAVALLI_PLANT: PlantInput = {
  name: "Aravalli Cement Works",
  sector: "cement",
  size_category: "small",
  energy_mix: { grid_kwh: 1000000, diesel_l: 30000, renewable_pct: 2 },
  raw_material: { type: "cement", tonnes: 900 },
  waste_tonnes: 200,
  transport_km: 200000,
  truck_class: "HCV",
  production_units: 155000,
};

/**
 * Eighth demo plant — an aluminium refinery. Electricity dominates (41% of
 * footprint); the ₹45L portfolio lifts D → B via A1 (on-site solar) + A4
 * (process efficiency) + A6 (low-carbon aluminium supplier) + A5/A2/A3.
 * Never a seed peer (asserted by test).
 */
export const COASTAL_PLANT: PlantInput = {
  name: "Coastal Aluminium Refinery",
  sector: "aluminium",
  size_category: "small",
  energy_mix: { grid_kwh: 200000, diesel_l: 8000, renewable_pct: 5 },
  raw_material: { type: "aluminium", tonnes: 60 },
  waste_tonnes: 20,
  transport_km: 50000,
  truck_class: "HCV",
  production_units: 35000,
};

/**
 * Ninth demo plant — a copper processor. Materials are the dominant
 * contributor (50% of footprint); the ₹45L portfolio lifts C → B via A6
 * (low-carbon copper supplier) + A5 (material intensity) + A4/A2/A3.
 * Never a seed peer (asserted by test).
 */
export const VINDHYA_PLANT: PlantInput = {
  name: "Vindhya Copper Processing",
  sector: "copper",
  size_category: "small",
  energy_mix: { grid_kwh: 1200000, diesel_l: 12000, renewable_pct: 4 },
  raw_material: { type: "copper", tonnes: 400 },
  waste_tonnes: 60,
  transport_km: 120000,
  truck_class: "HCV",
  production_units: 255000,
};

/**
 * Tenth demo plant — a glass manufacturer. High thermal/grid energy is the
 * dominant contributor (51% of footprint); the ₹45L portfolio lifts C → B
 * via A6 (low-carbon glass supplier) + A4 (energy efficiency) + A5 + A2.
 * Never a seed peer (asserted by test).
 */
export const NARMADA_PLANT: PlantInput = {
  name: "Narmada Glass Industries",
  sector: "glass",
  size_category: "small",
  energy_mix: { grid_kwh: 1200000, diesel_l: 20000, renewable_pct: 3 },
  raw_material: { type: "glass", tonnes: 800 },
  waste_tonnes: 100,
  transport_km: 100000,
  truck_class: "HCV",
  production_units: 280000,
};

/**
 * Eleventh demo plant — a metal foundry. Material intensity dominates (68%
 * of footprint); the ₹45L portfolio lifts C → B via A6 (low-carbon steel
 * supplier) + A5 (material intensity) + A4/A2/A3. Never a seed peer
 * (asserted by test).
 */
export const EASTERN_PLANT: PlantInput = {
  name: "Eastern Foundry Systems",
  sector: "foundry",
  size_category: "small",
  energy_mix: { grid_kwh: 600000, diesel_l: 15000, renewable_pct: 5 },
  raw_material: { type: "steel", tonnes: 500 },
  waste_tonnes: 80,
  transport_km: 100000,
  truck_class: "HCV",
  production_units: 250000,
};

/**
 * Twelfth demo plant — a paper mill. Grid energy + waste are the hotspots
 * (grid 42% of footprint); the ₹45L portfolio lifts C → B via A4 (energy
 * efficiency) + A6 (recycled-fibre supplier) + A2 (waste recovery) + A5.
 * Never a seed peer (asserted by test).
 */
export const KRISHNA_PLANT: PlantInput = {
  name: "Krishna Paper & Boards",
  sector: "paper",
  size_category: "small",
  energy_mix: { grid_kwh: 1000000, diesel_l: 18000, renewable_pct: 4 },
  raw_material: { type: "paper", tonnes: 600 },
  waste_tonnes: 400,
  transport_km: 120000,
  truck_class: "HCV",
  production_units: 230000,
};

/**
 * Thirteenth demo plant — a ceramics manufacturer. Thermal/grid energy
 * dominates (45% of footprint); the ₹45L portfolio lifts D → C via A6
 * (low-carbon ceramic supplier) + A5 + A2 + A3. Never a seed peer
 * (asserted by test).
 */
export const SAHYADRI_PLANT: PlantInput = {
  name: "Sahyadri Ceramics",
  sector: "ceramics",
  size_category: "small",
  energy_mix: { grid_kwh: 1500000, diesel_l: 25000, renewable_pct: 2 },
  raw_material: { type: "ceramic", tonnes: 1500 },
  waste_tonnes: 150,
  transport_km: 120000,
  truck_class: "HCV",
  production_units: 245000,
};

/**
 * Fourteenth demo plant — an e-waste recycler. Circularity/materials is the
 * dominant contributor (57% of footprint) and the plant already runs lean;
 * the ₹45L portfolio lifts B → A via A6 (recycled-input supplier) + A5
 * (material recovery) + A1 (renewable) + A4/A2/A3. Never a seed peer
 * (asserted by test).
 */
export const BHARAT_PLANT: PlantInput = {
  name: "Bharat E-Waste Recovery",
  sector: "e_waste",
  size_category: "small",
  energy_mix: { grid_kwh: 200000, diesel_l: 6000, renewable_pct: 8 },
  raw_material: { type: "e_waste", tonnes: 600 },
  waste_tonnes: 40,
  transport_km: 60000,
  truck_class: "HCV",
  production_units: 140000,
};

/**
 * Fifteenth demo plant — a battery materials maker. Material intensity
 * dominates (58% of footprint, highest EF in the catalog); the ₹45L
 * portfolio lifts C → B via A6 (recycled material supplier) + A5 + A4/A2/A3.
 * Never a seed peer (asserted by test).
 */
export const GANGA_PLANT: PlantInput = {
  name: "Ganga Battery Materials",
  sector: "battery",
  size_category: "small",
  energy_mix: { grid_kwh: 600000, diesel_l: 10000, renewable_pct: 5 },
  raw_material: { type: "battery", tonnes: 120 },
  waste_tonnes: 30,
  transport_km: 80000,
  truck_class: "HCV",
  production_units: 150000,
};

/** All demo plants — the switcher's option list. */
export const DEMO_PLANTS: PlantInput[] = [
  DEMO_PLANT,
  KAVERI_PLANT,
  DECCAN_PLANT,
  POLYNEST_PLANT,
  BHOOMI_PLANT,
  PRECISION_PLANT,
  ARAVALLI_PLANT,
  COASTAL_PLANT,
  VINDHYA_PLANT,
  NARMADA_PLANT,
  EASTERN_PLANT,
  KRISHNA_PLANT,
  SAHYADRI_PLANT,
  BHARAT_PLANT,
  GANGA_PLANT,
];

export const SECTOR_LABELS: Record<Sector, string> = {
  textiles: "Textiles",
  metal_fabrication: "Metal Fabrication",
  plastics: "Plastics",
  food_processing: "Food Processing",
  engineering: "Engineering",
  cement: "Cement Manufacturing",
  aluminium: "Aluminium & Metallurgy",
  copper: "Copper Processing",
  glass: "Glass Manufacturing",
  foundry: "Metal Foundry",
  paper: "Paper Manufacturing",
  ceramics: "Ceramic Manufacturing",
  e_waste: "E-Waste Recycling",
  battery: "Battery Materials",
};