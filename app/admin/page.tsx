"use client";

import { usePlant } from "@/lib/plant-store";
import { DEMO_PLANTS } from "@/lib/seed-data";
import { computeFootprint } from "@/lib/calc-engine";

export default function AdminPage() {
  const { plants } = usePlant();
  const total = plants.length;
  const demo = DEMO_PLANTS.length;
  const registered = total - demo;
  const avg = plants.reduce((s, p) => s + computeFootprint(p).total_tCO2e, 0) / total;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 md:px-8">
      <h1 className="font-display text-xl font-bold uppercase tracking-tight">Admin Analytics</h1>
      <p className="label-caps mt-1 text-[10px] text-ink-muted">Blobs dashboard — demo + registered</p>

      <div className="mt-6 grid grid-cols-12 gap-4">
        <div className="col-span-4 border border-line bg-surface p-4">
          <div className="label-caps text-[10px] text-ink-muted">Total plants</div>
          <div className="font-mono text-lg">{total}</div>
        </div>
        <div className="col-span-4 border border-line bg-surface p-4">
          <div className="label-caps text-[10px] text-ink-muted">Registered</div>
          <div className="font-mono text-lg">{registered}</div>
        </div>
        <div className="col-span-4 border border-line bg-surface p-4">
          <div className="label-caps text-[10px] text-ink-muted">Avg footprint</div>
          <div className="font-mono text-lg">{Math.round(avg)} t</div>
        </div>
      </div>

      <div className="mt-4 border border-line bg-bg-elevated p-4">
        <p className="font-mono text-xs text-ink-muted">In production this reads from Netlify Blobs / DB. Demo uses local + seed data. Swap `fetch /api/plants` for Blobs in `lib/plant-store`.</p>
      </div>
    </div>
  );
}
