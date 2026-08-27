"use client";

import { useState } from "react";
import { usePlant } from "@/lib/plant-store";
import { findBestPortfolio } from "@/lib/optimizer";

type Msg = { role: "user" | "advisor"; text: string };

function advisorReply(input: string, plant: ReturnType<typeof usePlant>["input"], footprint: ReturnType<typeof usePlant>["footprint"]): string {
  const q = input.toLowerCase();
  const top = findBestPortfolio(plant, 4500000, "cost-effective").actions[0];
  if (q.includes("grade") || q.includes("why")) {
    return `Your grade is driven by ${footprint.biggestContributor} (${Math.round(footprint.breakdown[footprint.biggestContributor].value)} tCO2e). Cheapest next step: ${top.name} → -${Math.round(top.reduction_tCO2e.value)} tCO2e for ${top.cost_mid.toLocaleString()} INR.`;
  }
  if (q.includes("cost") || q.includes("cheap")) {
    return `Cheapest high-impact is ${top.name} (₹${top.cost_mid.toLocaleString()} for -${Math.round(top.reduction_tCO2e.value)} tCO2e). Use Optimize → MIN COST to see the full ranked list.`;
  }
  if (q.includes("renewable") || q.includes("solar")) {
    return `Renewable (A1) targets 40% on-site solar. It cuts grid ${Math.round(footprint.breakdown.grid.value)} tCO2e by ~${Math.round(footprint.breakdown.grid.value * 0.4)} tCO2e at ₹36–53k/kW. Check Simulate → Renewable lever.`;
  }
  return `I am SAGE Advisor (rule-based on your plant). Ask: "why grade F?" , "cheapest action?", or "how does renewable help?" — I answer from the engine, no LLM needed. Your biggest contributor is ${footprint.biggestContributor}.`;
}

export default function AdvisorPage() {
  const { input, footprint } = usePlant();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "advisor", text: `Hi — I am SAGE Advisor for ${input.name}. Your footprint is ${Math.round(footprint.total_tCO2e)} tCO2e, grade ${footprint.per_unit_tCO2e.toFixed(4)} t/unit, biggest ${footprint.biggestContributor}. Ask me anything.` }]);
  const [q, setQ] = useState("");

  const send = () => {
    const t = q.trim();
    if (!t) return;
    const reply = advisorReply(t, input, footprint);
    setMsgs((m) => [...m, { role: "user", text: t }, { role: "advisor", text: reply }]);
    setQ("");
  };

  return (
    <div className="mx-auto flex max-w-[800px] flex-col gap-4 px-4 py-6 md:px-8">
      <header className="border border-line bg-bg-elevated p-4">
        <h1 className="font-display text-xl font-bold uppercase tracking-tight">Advisor</h1>
        <p className="label-caps mt-1 text-[10px] text-ink-muted">Rule-based on your plant — no LLM, all engine</p>
      </header>

      <div className="flex flex-col gap-3 border border-line bg-surface p-4">
        <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[85%] border px-3 py-2 ${m.role === "user" ? "self-end border-accent bg-accent text-accent-ink" : "self-start border-line bg-bg-elevated"}`}>
              <span className="label-caps text-[10px]">{m.role}</span>
              <p className="mt-1 font-mono text-sm leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-line pt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder='Ask: why grade F? or cheapest action?' className="flex-1 border border-line bg-bg-elevated px-2 py-2 font-mono text-sm outline-none focus:border-accent" />
          <button type="button" onClick={send} className="btn-press border border-accent bg-accent px-4 py-2 text-accent-ink"><span className="label-caps text-xs">Send</span></button>
        </div>
      </div>
    </div>
  );
}
