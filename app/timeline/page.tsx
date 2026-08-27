"use client";

import { useState, useMemo } from "react";
import { usePlant } from "@/lib/plant-store";
import { findBestPortfolio } from "@/lib/optimizer";
import { applyAction, computeFootprint, computeGrade, formatNumber } from "@/lib/calc-engine";
import { gradeThresholds } from "@/lib/optimizer";
import { getAction } from "@/lib/action-catalog";

export default function TimelinePage() {
  const { input } = usePlant();
  const [month, setMonth] = useState(6);
  const thr = gradeThresholds();
  const portfolio = findBestPortfolio(input, 4500000, "cost-effective");
  const actions = portfolio.actions;

  const frames = useMemo(() => {
    return Array.from({ length: 13 }, (_, m) => {
      let cur = input;
      const count = Math.floor((m / 12) * actions.length);
      for (let i = 0; i < count; i++) {
        const a = actions[i];
        const def = getAction(a.action_id);
        cur = applyAction(cur, a.action_id, { [def.target_field]: def.default_target } as any);
      }
      const fp = computeFootprint(cur);
      const grade = computeGrade(fp.per_unit_tCO2e, thr);
      return { m, fp, grade };
    });
  }, [input, actions, thr]);

  const cur = frames[month];

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 md:px-8">
      <h1 className="font-display text-xl font-bold uppercase tracking-tight">What-if Timeline</h1>
      <p className="label-caps mt-1 text-[10px] text-ink-muted">12-month grade animation — actions phase in</p>

      <div className="mt-6 border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="label-caps text-[10px] text-ink-muted">Month {month}</span>
          <span className="font-mono text-sm">{cur.grade} · {formatNumber(cur.fp.total_tCO2e,0)} tCO2e</span>
        </div>
        <input type="range" min={0} max={12} value={month} onChange={(e)=> setMonth(Number(e.target.value))} className="mt-3 w-full" />
        <div className="mt-3 h-20 border border-line bg-bg-elevated p-2">
          <svg viewBox="0 0 300 60" className="h-full w-full" preserveAspectRatio="none">
            <polyline fill="none" stroke="var(--accent)" strokeWidth="1.5" points={frames.map((f,i)=> `${(i/12)*300},${60 - (f.fp.total_tCO2e / Math.max(...frames.map(x=>x.fp.total_tCO2e)))*40 -10}`).join(" ")} />
            <circle cx={(month/12)*300} cy={60 - (cur.fp.total_tCO2e / Math.max(...frames.map(x=>x.fp.total_tCO2e)))*40 -10} r="3" fill="var(--accent)" />
          </svg>
        </div>
        <div className="mt-2 flex gap-1">
          {frames.map((f)=> (<div key={f.m} className={`h-1 flex-1 ${f.m <= month ? "bg-accent" : "bg-line"}`} />))}
        </div>
      </div>
    </div>
  );
}
