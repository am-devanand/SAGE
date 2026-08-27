"use client";

import { usePlant } from "@/lib/plant-store";
import { findBestPortfolio } from "@/lib/optimizer";
import { formatINR, formatNumber } from "@/lib/calc-engine";

const CREDIT_PRICE = 500;

export default function CreditsPage() {
  const { input, footprint } = usePlant();
  const portfolio = findBestPortfolio(input, 4500000, "cost-effective");
  const capped = portfolio.capped_reduction_tCO2e;
  const value = Math.round(capped * CREDIT_PRICE);

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6 md:px-8">
      <h1 className="font-display text-xl font-bold uppercase tracking-tight">Carbon Credits</h1>
      <p className="label-caps mt-1 text-[10px] text-ink-muted">Est. at ₹500 / tCO2e</p>

      <div className="mt-6 grid grid-cols-12 gap-4">
        <div className="col-span-6 border border-line bg-surface p-4">
          <div className="label-caps text-[10px] text-ink-muted">Capped reduction</div>
          <div className="font-mono text-lg">{formatNumber(capped,0)} tCO2e</div>
          <div className="font-mono text-xs text-ink-muted">Total footprint {formatNumber(footprint.total_tCO2e,0)} t</div>
        </div>
        <div className="col-span-6 border border-accent bg-accent p-4 text-accent-ink">
          <div className="label-caps text-[10px]">Est. credit value</div>
          <div className="font-mono text-lg">{formatINR(value)}</div>
          <div className="label-caps text-[10px]">{capped} × ₹500</div>
        </div>
      </div>

      <div className="mt-4 border border-line bg-bg-elevated p-4">
        <p className="font-mono text-xs leading-relaxed text-ink-muted">Estimate only. Actual credit price varies by registry and vintage. Use for internal planning, not trading.</p>
      </div>
    </div>
  );
}
