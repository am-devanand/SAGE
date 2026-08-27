"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { usePlant } from "@/lib/plant-store";
import { SECTOR_LABELS } from "@/lib/seed-data";

export default function SelectPlantPage() {
  const { user } = useAuth();
  const { plants, setPlant } = usePlant();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      <header className="border border-line bg-bg-elevated p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="label-caps text-[10px] text-ink-muted">Step 2 of 2</span>
            <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-tight">Choose your plant</h1>
            <p className="label-caps mt-1 text-[10px] text-ink-muted">Welcome, {user.name} — pick a demo or register your own. You can change this anytime via Switch plant.</p>
          </div>
          <Link href="/register" className="btn-press border border-accent bg-accent px-4 py-2.5 text-accent-ink hover:bg-accent/90"><span className="label-caps uppercase">+ Register your plant</span></Link>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-12 gap-4">
        {plants.map((p, i) => (
          <button key={p.name} type="button" onClick={() => { setPlant(i); router.push("/"); }} className="group col-span-12 flex flex-col border border-line bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-bg-elevated md:col-span-4">
            <span className="label-caps text-[10px] text-ink-muted">{SECTOR_LABELS[p.sector]} · {p.size_category}</span>
            <span className="mt-2 font-display text-sm font-bold uppercase tracking-tight leading-tight">{p.name}</span>
            <span className="mt-2 border-t border-line pt-2 font-mono text-xs leading-relaxed text-ink-muted">
              {p.production_units.toLocaleString()} units · {p.raw_material.type} · {p.waste_tonnes} t waste · {p.transport_km.toLocaleString()} km
            </span>
            <span className="mt-3 flex items-center gap-1 label-caps text-[10px] text-accent">Select <span className="transition-transform group-hover:translate-x-0.5">→</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
