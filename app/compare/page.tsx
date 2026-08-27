"use client";

import { useState } from "react";
import { usePlant } from "@/lib/plant-store";
import { computeFootprint, computeGrade, formatNumber } from "@/lib/calc-engine";
import { gradeThresholds } from "@/lib/optimizer";

export default function ComparePage() {
  const { plants } = usePlant();
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [c, setC] = useState(2);

  const thr = gradeThresholds();
  const picks = [plants[a], plants[b], plants[c]].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
      <h1 className="font-display text-xl font-bold uppercase tracking-tight">Compare Plants</h1>
      <p className="label-caps mt-1 text-[10px] text-ink-muted">Side-by-side up to 3</p>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-line bg-surface p-3 md:col-span-4">
          <label className="label-caps text-[10px] text-ink-muted">Plant 1</label>
          <select value={a} onChange={(e)=> setA(Number(e.target.value))} className="mt-1 w-full border border-line bg-bg-elevated px-2 py-2 font-mono text-sm">
            {plants.map((p,i)=><option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div className="col-span-12 border border-line bg-surface p-3 md:col-span-4">
          <label className="label-caps text-[10px] text-ink-muted">Plant 2</label>
          <select value={b} onChange={(e)=> setB(Number(e.target.value))} className="mt-1 w-full border border-line bg-bg-elevated px-2 py-2 font-mono text-sm">
            {plants.map((p,i)=><option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </div>
        <div className="col-span-12 border border-line bg-surface p-3 md:col-span-4">
          <label className="label-caps text-[10px] text-ink-muted">Plant 3</label>
          <select value={c} onChange={(e)=> setC(Number(e.target.value))} className="mt-1 w-full border border-line bg-bg-elevated px-2 py-2 font-mono text-sm">
            {plants.map((p,i)=><option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4">
        {picks.map((p) => {
          const fp = computeFootprint(p);
          const grade = computeGrade(fp.per_unit_tCO2e, thr);
          return (
            <div key={p.name} className="col-span-12 border border-line bg-surface p-4 md:col-span-4">
              <div className="font-display text-sm font-bold uppercase">{p.name}</div>
              <div className="label-caps text-[10px] text-ink-muted">{p.sector} · {p.size_category}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <div><div className="label-caps text-[10px] text-ink-muted">Total</div><div className="font-mono text-sm">{formatNumber(fp.total_tCO2e,0)} t</div></div>
                <div><div className="label-caps text-[10px] text-ink-muted">Per unit</div><div className="font-mono text-sm">{fp.per_unit_tCO2e.toFixed(4)}</div></div>
                <div><div className="label-caps text-[10px] text-ink-muted">Grade</div><div className="font-mono text-lg">{grade}</div></div>
                <div><div className="label-caps text-[10px] text-ink-muted">Biggest</div><div className="label-caps text-xs">{fp.biggestContributor}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
