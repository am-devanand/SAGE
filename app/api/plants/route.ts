import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { PlantInput } from "@/lib/types";

// File-backed store for user-registered plants. Runs on the Node runtime so we
// can use the filesystem; this is a demo-grade persistence layer (low write
// volume, single server) — swap for a real DB for production.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_NETLIFY = process.env.NETLIFY === "true";
const DATA_DIR = IS_NETLIFY
  ? path.join("/tmp", "sage-data")
  : path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "registered-plants.json");
const MAX_RECORDS = 1000;

type StoredRecord = { id: string; plant: PlantInput; createdAt: string };

function num(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/** Guard the payload so a malformed POST can never corrupt the store. */
function isValidPlant(p: unknown): p is PlantInput {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  const em = o.energy_mix as Record<string, unknown> | undefined;
  const rm = o.raw_material as Record<string, unknown> | undefined;
  return (
    typeof o.name === "string" &&
    o.name.trim().length > 0 &&
    o.name.length <= 120 &&
    typeof o.sector === "string" &&
    !!em &&
    num(em.grid_kwh) &&
    num(em.diesel_l) &&
    num(em.renewable_pct) &&
    (em.renewable_pct as number) <= 100 &&
    !!rm &&
    typeof rm.type === "string" &&
    num(rm.tonnes) &&
    num(o.waste_tonnes) &&
    num(o.transport_km) &&
    num(o.production_units) &&
    (o.production_units as number) > 0 &&
    (o.size_category === "small" || o.size_category === "medium" || o.size_category === "large") &&
    o.truck_class === "HCV"
  );
}

async function readRecords(): Promise<StoredRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeRecords(records: StoredRecord[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf8");
  } catch {
    // On Netlify Functions the filesystem is ephemeral/read-only except /tmp.
    // A write failure should not break the API — the plant is still returned
    // and remains in localStorage on the client.
  }
}

let writeQueue: Promise<void> = Promise.resolve();
async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeQueue;
  let release!: () => void;
  writeQueue = new Promise<void>((res) => (release = res));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function GET() {
  const records = await readRecords();
  return NextResponse.json({ plants: records.map((r) => r.plant) });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const plant = (body as { plant?: unknown })?.plant;
  if (!isValidPlant(plant)) {
    return NextResponse.json({ error: "Invalid plant payload" }, { status: 400 });
  }
  const record: StoredRecord = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    plant,
    createdAt: new Date().toISOString(),
  };
  return withWriteLock(async () => {
    const records = await readRecords();
    records.push(record);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    await writeRecords(records);
    return NextResponse.json({ id: record.id, plant: record.plant }, { status: 201 });
  });
}
