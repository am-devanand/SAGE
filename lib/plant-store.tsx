"use client";

/**
 * Shared plant state — one source of truth for the current plant input,
 * with derived footprint/grade/percentile recomputed through the engine.
 * Defaults to DEMO_PLANT so every screen renders real numbers immediately.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { computeFootprint, gradeFromFootprint } from "@/lib/calc-engine";
import { computePercentile, gradeThresholds } from "@/lib/optimizer";
import { DEMO_PLANTS } from "@/lib/seed-data";
import type { FootprintResult, GradeResult, PlantInput } from "@/lib/types";

interface PlantStore {
  input: PlantInput;
  /** Demo plants (seeded) followed by user-registered plants. */
  plants: PlantInput[];
  setInput: (next: PlantInput) => void;
  setPlant: (index: number) => void;
  /** Register a new company; persists to localStorage and selects it. */
  addPlant: (plant: PlantInput) => void;
  footprint: FootprintResult;
  grade: GradeResult;
  percentile: { percentile: number; peerSet: "sector" | "full"; peerCount: number };
}

const PlantContext = createContext<PlantStore | null>(null);

const REGISTERED_KEY = "sage-registered-plants";
const SELECTED_KEY = "sage-selected-plant";
const SERVER_URL = "/api/plants";
const MAX_LOCAL = 200;

function dedupeByName(list: PlantInput[]): PlantInput[] {
  const seen = new Set<string>();
  const out: PlantInput[] = [];
  for (const p of list) {
    const key = p.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function loadRegistered(): PlantInput[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REGISTERED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PlantInput[]) : [];
  } catch {
    return [];
  }
}

function saveRegistered(list: PlantInput[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REGISTERED_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function loadSelected(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

function saveSelected(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SELECTED_KEY, name);
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [inputRaw, setInputRaw] = useState<PlantInput>(DEMO_PLANTS[0]);
  const [registered, setRegistered] = useState<PlantInput[]>(loadRegistered);
  const hasRestoredRef = useRef(false);

  const plants = useMemo<PlantInput[]>(() => [...DEMO_PLANTS, ...registered], [registered]);

  const setInput = (next: PlantInput) => {
    setInputRaw(next);
    saveSelected(next.name);
  };

  const setPlant = (i: number) => {
    const p = plants[i];
    if (p) {
      setInputRaw(p);
      saveSelected(p.name);
    }
  };

  const addPlant = (plant: PlantInput) => {
    setRegistered((prev) => {
      const next = dedupeByName([...prev, plant]);
      saveRegistered(next);
      return next;
    });
    setInputRaw(plant);
    saveSelected(plant.name);
    fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plant }),
    }).catch(() => {
      /* non-fatal */
    });
  };

  useEffect(() => {
    const sel = loadSelected();
    if (!sel) {
      hasRestoredRef.current = true;
      return;
    }
    const allLocal = [...DEMO_PLANTS, ...loadRegistered()];
    const found = allLocal.find((p) => p.name === sel);
    if (found) {
      setInputRaw(found);
      hasRestoredRef.current = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(SERVER_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.plants) return;
        const serverPlants = data.plants as PlantInput[];
        setRegistered((prev) => dedupeByName([...serverPlants, ...prev]));
      })
      .catch(() => {
        /* offline / no API — keep local plants only */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    const sel = loadSelected();
    if (!sel) {
      hasRestoredRef.current = true;
      return;
    }
    const all = [...DEMO_PLANTS, ...registered];
    const found = all.find((p) => p.name === sel);
    if (found) {
      setInputRaw(found);
      hasRestoredRef.current = true;
    }
  }, [registered]);

  const input = inputRaw;

  const value = useMemo<PlantStore>(() => {
    const footprint = computeFootprint(input);
    const grade = gradeFromFootprint(footprint, gradeThresholds());
    const percentile = computePercentile(footprint.per_unit_tCO2e, input);
    return {
      input,
      plants,
      setInput,
      setPlant,
      addPlant,
      footprint,
      grade,
      percentile,
    };
  }, [input, plants]);

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant(): PlantStore {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlant must be used within PlantProvider");
  return ctx;
}