# SAGE — Sustainability Action & Grade Engine

**Industrial decarbonization, scored and actioned.**

SAGE measures a plant's carbon footprint, grades it A–F against 25 sector peers, and optimizes an action portfolio to your budget — every number traced to its source.

- **15 demo plants** across 14 sectors (textiles, steel, cement, aluminium, copper, glass, paper, ceramics, e-waste, battery…)
- **5-term engine** (CEA 0.7117 tCO₂/MWh, IPCC 2.68 kgCO₂/L, TERI, IPCC landfill) — deterministic, cited inline
- **Optimizer** — 3-mode ranking (cost-effective / biggest / fastest) + greedy knapsack under ₹10M, capped by reality
- **Simulator** — 4 live levers (A1 renewable, A2 waste, A3 logistics, A5 materials) with 600 ms debounce
- **Shared registry** — `POST /api/plants` + localStorage merge, deduped by name, validated

## Quick start

```bash
bun install
bun run dev   # http://localhost:3000
# or: npm run dev / yarn dev / pnpm dev
```

## Tech

Next.js 15 (App Router, Turbopack), React 19, Tailwind 4, TypeScript 5, Vitest, jsPDF. Deploys anywhere Next runs.

## Structure

```
app/           # dashboard / scorecard / optimizer / simulator / plan / register + api
components/    # app-shell, provenance badges
lib/           # calc-engine, optimizer, seed-data, plant-store, brand, types
test/          # engine contract tests (50)
```

## License

MIT
