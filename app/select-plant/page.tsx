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
    <div className="mx-auto max-w-[1280px] px-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Choose your plant</h1>
          <p className="label-caps mt-1 text-[10px] text-ink-muted">Welcome, {user.name} — pick a demo or register your own. You can change this anytime.</p>
        </div>
        <Link href="/register" className="btn-press border border-accent bg-accent px-4 py-2.5 text-accent-ink hover:bg-accent/90"><span className="label-caps uppercase">+ Register your plant</span></Link>
      </header>

      <div className="mt-6 grid grid-cols-12 gap-4">
        {plants.map((p, i) => (
          <button key={p.name} type="button" onClick={() => { setPlant(i); router.push("/"); }} className="group col-span-12 flex flex-col border border-line bg-surface p-4 text-left transition-colors hover:border-accent md:col-span-4">
            <span className="label-caps text-[10px] text-ink-muted">{SECTOR_LABELS[p.sector]} · {p.size_category}</span>
            <span className="mt-1 font-display text-sm font-bold uppercase tracking-tight">{p.name}</span>
            <span className="mt-2 font-mono text-xs text-ink-muted">{p.production_units.toLocaleString()} units · {p.raw_material.type} · {p.waste_tonnes} t waste</span>
            <span className="mt-3 label-caps text-[10px] text-accent group-hover:underline">Select →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
