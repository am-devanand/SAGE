"use client";

import { usePlant } from "@/lib/plant-store";

export default function NotificationsPage() {
  const { footprint } = usePlant();
  const alerts: { title: string; desc: string }[] = [];
  if (footprint.breakdown.transport.value / footprint.total_tCO2e > 0.15) alerts.push({ title: "Logistics hotspot", desc: `Transport is ${((footprint.breakdown.transport.value / footprint.total_tCO2e) * 100).toFixed(0)}% of footprint — consider A3 route consolidation.` });
  if (footprint.breakdown.waste.value / footprint.total_tCO2e > 0.1) alerts.push({ title: "Waste hotspot", desc: `Waste is ${((footprint.breakdown.waste.value / footprint.total_tCO2e) * 100).toFixed(0)}% — A2 waste reduction can cut it by 20%.` });
  if (footprint.breakdown.grid.value / footprint.total_tCO2e > 0.3) alerts.push({ title: "Grid hotspot", desc: `Grid is ${((footprint.breakdown.grid.value / footprint.total_tCO2e) * 100).toFixed(0)}% — A1 solar or A4 efficiency recommended.` });
  if (alerts.length === 0) alerts.push({ title: "All clear", desc: "No single contributor exceeds its threshold. Keep monitoring." });

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 md:px-8">
      <h1 className="font-display text-xl font-bold uppercase tracking-tight">Notifications</h1>
      <p className="label-caps mt-1 text-[10px] text-ink-muted">Smart alerts for hotspots</p>
      <div className="mt-6 flex flex-col gap-3">
        {alerts.map((a, i) => (
          <div key={i} className="border border-line bg-surface p-4">
            <div className="font-display text-sm font-bold uppercase">{a.title}</div>
            <p className="mt-1 font-mono text-xs text-ink-muted">{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
