"use client";

/**
 * SAGE — Register Company.
 * Self-service form: a user supplies their plant's annual operating data and
 * the engine scores it like any demo plant. The plant is persisted to
 * localStorage and merged into the switcher (see lib/plant-store), so it
 * survives reloads and appears alongside the seeded demos.
 *
 * Every field maps 1:1 to a PlantInput term — no extra modeling.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlant } from "@/lib/plant-store";
import { SECTOR_LABELS } from "@/lib/seed-data";
import type { MaterialType, PlantInput, Sector, SizeCategory } from "@/lib/types";

const SECTORS = Object.keys(SECTOR_LABELS) as Sector[];
const MATERIALS: MaterialType[] = [
  "steel",
  "cement",
  "plastic",
  "textile",
  "food",
  "aluminium",
  "copper",
  "glass",
  "paper",
  "ceramic",
  "e_waste",
  "battery",
];
const SIZES: SizeCategory[] = ["small", "medium", "large"];

type FormState = {
  name: string;
  sector: Sector;
  size_category: SizeCategory;
  grid_kwh: string;
  diesel_l: string;
  renewable_pct: string;
  materialType: MaterialType;
  tonnes: string;
  waste_tonnes: string;
  transport_km: string;
  production_units: string;
};

const INITIAL: FormState = {
  name: "",
  sector: "cement",
  size_category: "small",
  grid_kwh: "",
  diesel_l: "",
  renewable_pct: "0",
  materialType: "steel",
  tonnes: "",
  waste_tonnes: "",
  transport_km: "",
  production_units: "",
};

/** Parse a non-negative number; returns NaN on empty/invalid. */
function num(v: string): number {
  if (v.trim() === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export default function RegisterPage() {
  const { addPlant } = usePlant();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = form.name.trim();
    if (name.length === 0) {
      setError("Company name is required.");
      return;
    }

    const grid_kwh = num(form.grid_kwh);
    const diesel_l = num(form.diesel_l);
    const renewable_pct = num(form.renewable_pct);
    const tonnes = num(form.tonnes);
    const waste_tonnes = num(form.waste_tonnes);
    const transport_km = num(form.transport_km);
    const production_units = num(form.production_units);

    if ([grid_kwh, diesel_l, tonnes, waste_tonnes, transport_km, production_units].some(Number.isNaN)) {
      setError("All numeric fields must be zero or a positive number.");
      return;
    }
    if (Number.isNaN(renewable_pct) || renewable_pct < 0 || renewable_pct > 100) {
      setError("Renewable share must be between 0 and 100%.");
      return;
    }
    if (production_units <= 0) {
      setError("Annual production must be greater than zero (it normalizes the per-unit grade).");
      return;
    }

    const plant: PlantInput = {
      name,
      sector: form.sector,
      size_category: form.size_category,
      energy_mix: { grid_kwh, diesel_l, renewable_pct },
      raw_material: { type: form.materialType, tonnes },
      waste_tonnes,
      transport_km,
      truck_class: "HCV",
      production_units,
    };

    addPlant(plant);
    router.push("/scorecard");
  };

  const field = (key: keyof FormState) =>
    form[key] as unknown as string;

  return (
    <div className="blueprint-grid relative mx-auto flex max-w-[1280px] flex-col gap-8 px-8 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Register Company</h1>
        <p className="label-caps mt-1 text-[10px] text-ink-muted">
          Add your plant · scored by the same SAGE engine as the demos
        </p>
      </header>

      <form onSubmit={handleSubmit} className="border border-line bg-bg-elevated p-6">
        <div className="grid grid-cols-12 gap-5">
          {/* Company identity */}
          <div className="col-span-12 border-b border-line pb-4">
            <span className="label-caps text-xs">Company Identity</span>
          </div>

          <div className="col-span-12 md:col-span-6">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="name">
              Company / Plant Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. My Factory Pvt Ltd"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="col-span-6 md:col-span-3">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="sector">
              Sector
            </label>
            <select
              id="sector"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value as Sector)}
              className="mt-1 w-full border border-line bg-surface px-1 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {SECTOR_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-6 md:col-span-3">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="size">
              Size Category
            </label>
            <select
              id="size"
              value={form.size_category}
              onChange={(e) => set("size_category", e.target.value as SizeCategory)}
              className="mt-1 w-full border border-line bg-surface px-1 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Energy */}
          <div className="col-span-12 border-b border-line pb-4 pt-2">
            <span className="label-caps text-xs">Energy (annual)</span>
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="grid_kwh">
              Grid Electricity (kWh/yr)
            </label>
            <input
              id="grid_kwh"
              type="number"
              min={0}
              value={form.grid_kwh}
              onChange={(e) => set("grid_kwh", e.target.value)}
              placeholder="e.g. 1000000"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="diesel_l">
              Diesel (litres/yr)
            </label>
            <input
              id="diesel_l"
              type="number"
              min={0}
              value={form.diesel_l}
              onChange={(e) => set("diesel_l", e.target.value)}
              placeholder="e.g. 20000"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="renewable_pct">
              On-site Renewable (%)
            </label>
            <input
              id="renewable_pct"
              type="number"
              min={0}
              max={100}
              value={form.renewable_pct}
              onChange={(e) => set("renewable_pct", e.target.value)}
              placeholder="0–100"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {/* Materials */}
          <div className="col-span-12 border-b border-line pb-4 pt-2">
            <span className="label-caps text-xs">Materials & Logistics (annual)</span>
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="materialType">
              Raw Material Type
            </label>
            <select
              id="materialType"
              value={form.materialType}
              onChange={(e) => set("materialType", e.target.value as MaterialType)}
              className="mt-1 w-full border border-line bg-surface px-1 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            >
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="tonnes">
              Material Consumed (tonnes/yr)
            </label>
            <input
              id="tonnes"
              type="number"
              min={0}
              value={form.tonnes}
              onChange={(e) => set("tonnes", e.target.value)}
              placeholder="e.g. 500"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="waste_tonnes">
              Waste to Landfill (tonnes/yr)
            </label>
            <input
              id="waste_tonnes"
              type="number"
              min={0}
              value={form.waste_tonnes}
              onChange={(e) => set("waste_tonnes", e.target.value)}
              placeholder="e.g. 100"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="transport_km">
              Transport (tonne-km/yr)
            </label>
            <input
              id="transport_km"
              type="number"
              min={0}
              value={form.transport_km}
              onChange={(e) => set("transport_km", e.target.value)}
              placeholder="e.g. 120000"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div className="col-span-6 md:col-span-4">
            <label className="label-caps text-[10px] text-ink-muted" htmlFor="production_units">
              Annual Production (units/yr)
            </label>
            <input
              id="production_units"
              type="number"
              min={1}
              value={form.production_units}
              onChange={(e) => set("production_units", e.target.value)}
              placeholder="e.g. 200000"
              className="mt-1 w-full border border-line bg-surface px-2 py-1.5 font-mono text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {/* Submit */}
          <div className="col-span-12 flex items-center gap-4 pt-2">
            {error && (
              <span className="font-mono text-xs text-accent" role="alert">
                {error}
              </span>
            )}
            <button
              type="submit"
              className="btn-press ml-auto border border-accent bg-accent px-5 py-2.5 text-accent-ink transition-colors hover:bg-accent/90"
            >
              <span className="label-caps uppercase">Register &amp; Score</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
