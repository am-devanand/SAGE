# SAGE — Sustainability Action & Grade Engine
### Industrial Decarbonization, Scored and Actioned

> **Tagline:** From footprint to grade to action — every number traced to source.

**Live Demo:** https://sageport.netlify.app  
**Repo:** https://github.com/am-devanand/SAGE  
**Stack:** Next.js 15 (App Router) • React 19 • Tailwind 4 • TypeScript 5 • Vitest • jsPDF • Netlify

---

## 1. Problem Statement (SIH25069 — Industrial Decarbonization for MSMEs)

**Context:** India has 63M MSMEs contributing ~30% of GDP and ~45% of industrial emissions. Unlike large corporates, MSMEs have:
- No affordable way to **measure** Scope 1+2 footprint (need for CEA/IPCC factors, not guesswork)
- No **peer benchmark** to know if 0.08 tCO₂/unit is good or F-grade
- No **costed, ranked action portfolio** under a real budget (₹45L is not ₹4Cr)
- No **what-if** to test decisions before spending
- No **certifiable plan** to show auditors/buyers

**Existing gaps:** Spreadsheets (error-prone, no provenance), consultants (₹5L+), generic calculators (US factors, no Indian CEA 0.7117, no sector peers).

**SIH Ask:** A decision engine that is **accurate (CEA/IPCC-cited), explainable (provenance tags), and actionable (budget optimizer)** for MSME factories.

---

## 2. Solution — What SAGE Is

**SAGE** is a **Sustainability Action & Grade Engine** — a blueprint-style PWA that:

1. **Scores** any plant in 30s from 8 inputs (grid, diesel, material type+tonnes, waste, transport, production)
2. **Grades A–F** against a calibrated 25-plant peer distribution (lower per-unit = better)
3. **Optimizes** a portfolio of 6 sourced actions under your budget (3 ranked modes, capping prevents over-credit)
4. **Simulates** 4 levers live (renewable, waste, logistics, materials) with 600ms debounce
5. **Exports** a certifiable Action Plan PDF (DOC-YYYY-XXXX, provenance, QR-ready)

**Design promise:** `0px` corners, `1px` hairlines, tonal layering — no gradients/glass. IBM Plex for data, blueprint grid, light/dark. Phone-capable (drawer + safe-area + PWA).

---

## 3. How It Works — User Flow

```
[ /login ] ──(any email+pass, mock auth + cookie sage-user)──> [ /select-plant ]
      │                                                                │
      │  15 demo cards (Saraswati … Ganga) + “+ Register your plant”  │
      └────────────────────────────────────────────────────────────────┘
                                     │ pick (setPlant) or register
                                     ▼
                            [ /  Dashboard ]  ── Live footprint (2974 tCO2e), Grade (A), 80th pct, factory schematic, bento: Scorecard / Optimize / Simulate / Plan / Live Plant / Register CTA
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
        [ /scorecard ]         [ /optimize ]          [ /simulate ]          [ /plan ]          [ /register ]
        Grade dial +           Budget slider          4 levers               DOC + interventions  Self-serve form
        Breakdown (5 terms)    0–10M, 4 modes         (A1,A2,A3,A5)         register + PDF     (8 fields → addPlant)
        + percentile           Ranked actions         Grade fade            (jsPDF)            → localStorage +
                                                              Trajectory chart                      POST /api/plants
```

**Auth gate:** `middleware.ts` (`PUBLIC = /login,/signup,/_next,/api,/manifest`) + `sage-user` cookie — unauth `GET / → 307 /login`. `AppShell` hides sidebar on auth pages, shows user chip + Logout + Switch plant when authed.

**Plant persistence:** `lib/plant-store.tsx` `REGISTERED_KEY=sage-registered-plants` + `SELECTED_KEY=sage-selected-plant` + `SERVER_URL=/api/plants`. On mount merges `[...serverPlants, ...local]` deduped by name, `addPlant` writes both. `hasRestoredRef` keeps Optimizer/Simulator on the chosen plant after reload.

---

## 4. Calculation Engine (Pure, Deterministic, Cited)

**File:** `lib/calc-engine.ts` — no network, no I/O. Same input → identical output (locked by 50 contract tests).

**5 terms (spec 10.1):**
1. `grid = grid_kwh × 0.7117 / 1000` — CEA CO₂ Baseline V21.0 FY2024-25 national weighted 0.7117 tCO₂/MWh
2. `diesel = diesel_l × 2.68 / 1000` — IPCC 2006 Vol2 Ch3 (74.1 tCO₂/TJ, ~0.84 kg/L)
3. `materials = tonnes × MATERIAL_EF[type]` (or `ef_override` for A6) — proxy factors (steel 2.55, cement 0.673, plastic 3.0, textile 5.0, food 1.2, aluminium 2.2, copper 2.5, glass 0.8, paper 1.0, ceramic 0.7, e_waste 0.5, battery 6.0); low-carbon `MATERIAL_EF_LOW_CARBON` (steel 1.85, cement 0.4 … food absent → A6 not offered)
4. `waste = waste_tonnes × 0.6` — IPCC 2006 Vol5 + Delhi landfill CH₄ proxy
5. `transport = 0.0902 × 8 × transport_km / 1000` — TERI HCV-1 WTW 0.0902 kgCO₂/t-km × 8t payload

`total = sum`, `per_unit = total / production_units` (throws if ≤0 or negative). `biggestContributor` = max of 5. `breakdown` tags `measured` with derivation.

**Grade:** `calibrateGradeThresholds(SEED_PLANTS.map(p=>per_unit))` → p20,p40,p60,p80 via midrank → `A≤p20 < B≤p40 < C≤p60 < D≤p80 < F`. Always `estimated` tag.

**Actions (6, `lib/action-catalog.ts`):**
- A1 Renewable +40% (0–100, min 36185 max 53398 ₹/kW, 1400 kWh/kWp)
- A2 Waste −20% (0–50, 8–14k ₹/t)
- A3 Transport −20% (0–50, 18–32 ₹/km)
- A4 Efficiency −15% fixed (12–18 ₹/kWh)
- A5 Materials −20% (0–50, 6–10k ₹/t)
- A6 Supplier switch toggle (150–400k fixed, not for food)

`applyAction` pure via `structuredClone`, guard `target ≤ current → unchanged`, `current≥100 → grid 0`. `computeCombinedCappedReduction` caps grid `A1→A4`, materials `A5→A6`, never exceeds total. `findBestPortfolio` greedy knapsack by mode (`cost-effective` = reduction/cost, `biggest`, `fastest` = difficulty).

**Fixture (Saraswati Textiles, `test/engine.test.ts`):** grid 441.254 + diesel 25.46 + materials 2400 + waste 38.4 + transport 69.2736 = **2974.3876 tCO₂e**.

---

## 5. Key Features (What Ships)

| Feature | Where | What it does |
|---|---|---|
| **Auth + Onboarding** | `login`, `signup`, `select-plant`, `middleware` | Mock auth (`judge@sage.in/sage123` works, any email works), cookie `sage-user`, enforced gate, 15-card chooser |
| **Scorecard** | `/scorecard` | Dial grade, 5-term breakdown, peer percentile (sector if ≥3 else full), provenance badges |
| **Optimizer** | `/optimize` | Budget ₹0–10M, 4 modes (MIN COST/MAX CO2/FASTEST/BEST GRADE), hero card + list, `₹30,58,800 → 1528 tCO2e A→A` example |
| **Simulator** | `/simulate` | 4 sliders (A1 0–100, A2/A3/A5 0–50, step 0.5, 600ms debounce), grade fade, trajectory chart, KPI strip |
| **Plan** | `/plan` | Centered doc `DOC-YYYY-XXXX` (FNV hash), interventions register table, `jsPDF` export `SAGE-action-plan-*.pdf` |
| **Register** | `/register` | 8-field form → `PlantInput` truck HCV, validation, `localStorage + POST /api/plants` (Netlify `/tmp` fallback) |
| **Phone PWA** | `manifest.ts`, `layout viewport`, `app-shell drawer` | `display:standalone` start `/select-plant`, `themeColor #ff7a1b`, hamburger drawer `w-72`, `env(safe-area)`, `min-h-11` touch, no horizontal overflow at 375/768/1280 |

**Demo plants (15):** Saraswati, Kaveri, Deccan, PolyNest, Bhoomi, Precision, Aravalli (C→B), Coastal (D→B+A1), Vindhya, Narmada, Eastern, Krishna, Sahyadri, Bharat (B→A), Ganga — all C→B / D→C stories except tailored extremes, metallurgy-heavy for SIH25069.

---

## 6. Tech Architecture

```
Next.js 15 App Router (Turbopack in dev, `next build` in prod) — React 19 — Tailwind 4 — TS 5
  ├─ app/ (dashboard, scorecard, optimize, simulate, plan, register, login, signup, select-plant, api/plants)
  ├─ components/ (app-shell, provenance-badge, theme-toggle, logo SageMark)
  ├─ lib/ (calc-engine, optimizer, seed-data 15+25, plant-store, auth-store, brand, types)
  ├─ test/ (engine.test.ts 50 tests, deterministic + capped + ranking)
  ├─ DESIGN.md (7-sec system: Atmosphere, Color, Type, Spacing 4px, Components, Motion 150ms, Depth borders-only)
  └─ netlify.toml (npx next build, .next, @netlify/plugin-nextjs, NODE 20) — Netlify Functions for /api
```

**State:** `PlantProvider` (inputRaw + registered + `hasRestoredRef` + server merge) → `computeFootprint/gradeFromFootprint/computePercentile`. `AuthProvider` wraps it. No DB — file store `data/registered-plants.json` (gitignored) + `/tmp/sage-data` on Netlify (ephemeral; swap for Supabase for prod).

**Performance:** `tsc --noEmit` clean, `next build 14/14` green, `vitest 50/50` ~1.5s, engine 1000 random plants `95ms`, API 50 parallel `ok 50/50 685ms` after `withWriteLock` fix (before race 4/50).

---

## 7. UI/UX — Blueprint Design System

`DESIGN.md` is the contract (existing UI extracted, not freestyled):

- **Atmosphere:** quiet command center, blueprint honesty — `0px`, `1px hairline`, tonal `bg→bg-elevated→surface`, no shadows/blur/glass, every number measured.
- **Color:** `bg #faf9f7/#14181b, accent #ff7a1b/#ff8a3d` only for interactive, success/warning/error only for deltas.
- **Type:** `IBM Plex Sans` (display+sans) + `IBM Plex Mono` for every number, `label-caps 11px 600 0.08em`, `Display 48/700`.
- **Spacing:** `4px` base → `24px` card, `1280px` max, `gap-8` pages, `px-4 py-6 md:px-8`.
- **Components:** `btn-press` (`border accent/surface`), card `border-line bg-surface p-5 hover:border-accent`, input `border-line bg-surface focus:border-accent`, badge `measured/estimated/scenario`, `AppShell w-56`, `ThemeToggle`.
- **Motion:** `transform/opacity/border-color 100-150ms ease-out` only, `prefers-reduced-motion` respected.
- **Depth:** `borders-only + tonal-shift`, `radius:0`.

**Logo:** `components/logo.tsx` `SageMark` — 16×16 square + `S` path + leaf `fill-accent` (`#ff7a1b`), used in sidebar + mobile header, `public/sage-mark.svg` for favicon/manifest (was `/file.svg`).

---

## 8. Installation & Deployment

```bash
# local (phone-capable dev without turbopack to avoid .next race)
npm install   # or bun install
npm run dev   # http://localhost:3000 → /login (use judge@sage.in / sage123)
npm run build # must be `next build` (no --turbopack) when dev is running — we fixed package.json dev: "next dev"
npm start
npm test      # vitest 50
```

**Netlify (`sageport.netlify.app`, site 50e6c4e9…):**
- `netlify.toml` handles `npx next build` + `@netlify/plugin-nextjs 5.15.13` — deploys `ready success` (e.g., `6a8ff88d 688ad43` for manifest fix)
- SSO `sso_login:false` patched via API (token `nfp_...ja000` — revoke it), `public:true`
- `GET / → 307 /login` when unauthed, `GET /manifest.webmanifest 200` JSON, `POST /api/plants 201`

---

## 9. Stress Test Summary

- **Engine 1000:** `ok 1000 fail 0 95ms`
- **API 50 concurrent:** before `4/50` (race) → after `withWriteLock` `50/50 685ms`
- **UI 20×8 routes:** `20/20 ok avg 32s` (dev single-thread, no 500 after `next dev` restart)
- **Edge:** `1e12 kWh → 711M tCO2e` finite, `0 production → throw`, `negative → throw`, XSS `<script>` stored plain + React escaped, auth bypass `307`, invalid `400`, manifest `200`

---

## 10. Future Scope (Next 3×3)

**Batch1 (SIH):** History trend, AI Advisor (rule-based on optimizer), PDF v2 with charts/QR — **Batch2:** Multi-plant compare, Carbon credit ₹, Offline `next-pwa` — **Batch3:** 12-mo timeline, Notifications, Admin Blobs dashboard. (User asked “3 3 3 priority wise” — ready to start.)

---

## 11. Team & Credits

SAGE — built for SIH25069. Engine factors cited inline (CEA, IPCC, TERI, IAI, ICSG). Design system extracted to avoid AI slop; every grade is `measured vs estimated` tagged. Built with Sisyphus (OhMyOpenCode) + your 9-plant metallurgy stories.

**License:** MIT — `am-devanand/SAGE`
