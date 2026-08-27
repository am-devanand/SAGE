"use client";

/**
 * Shared plant state — one source of truth for the current plant input,
 * with derived footprint/grade/percentile recomputed through the engine.
 * Defaults to DEMO_PLANT so every screen renders real numbers immediately.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { computeFootprint, computeGrade, gradeFromFootprint } from "@/lib/calc-engine";
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
  history: HistoryEntry[];
}

const PlantContext = createContext<PlantStore | null>(null);

const REGISTERED_KEY = "sage-registered-plants";
const SELECTED_KEY = "sage-selected-plant";
const HISTORY_KEY = "sage-history";
const SERVER_URL = "/api/plants";
const MAX_LOCAL = 200;
const HISTORY_MAX = 6;

export type HistoryEntry = { date: string; total: number; perUnit: number; grade: string };

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

function loadHistory(): Record<string, HistoryEntry[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? (p as Record<string, HistoryEntry[]>) : {};
  } catch {
    return {};
  }
}

function saveHistory(map: Record<string, HistoryEntry[]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(map));
  } catch {
    /* non-fatal */
  }
}

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [inputRaw, setInputRaw] = useState<PlantInput>(DEMO_PLANTS[0]);
  const [registered, setRegistered] = useState<PlantInput[]>(loadRegistered);
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryEntry[]>>(() => loadHistory());
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

  const history = useMemo(() => historyMap[inputRaw.name] || [], [historyMap, inputRaw.name]);

  useEffect(() => {
    const fp = computeFootprint(inputRaw);
    const letter = computeGrade(fp.per_unit_tCO2e, gradeThresholds());
    const date = new Date().toISOString().slice(0, 10);
    setHistoryMap((prev) => {
      const cur = prev[inputRaw.name] || [];
      const last = cur[cur.length - 1];
      if (last && last.date === date && last.total === Math.round(fp.total_tCO2e)) return prev;
      const next: HistoryEntry = { date, total: Math.round(fp.total_tCO2e), perUnit: Number(fp.per_unit_tCO2e.toFixed(4)), grade: letter };
      const updated = [...cur, next].slice(-HISTORY_MAX);
      const map = { ...prev, [inputRaw.name]: updated };
      saveHistory(map);
      return map;
    });
  }, [inputRaw]);

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
      history,
    };
  }, [input, plants, history]);

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant(): PlantStore {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlant must be used within PlantProvider");
  return ctx;
}