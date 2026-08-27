# SAGE Design System

## 1. Atmosphere & Identity

A quiet, credible command center for industrial decarbonization — not a marketing site. Dense when you need numbers, spacious when you need judgment. The signature is **blueprint honesty**: 0px corners, 1px hairline borders, and tonal layering you *feel* before you see. No glass, no glows, no gradients. Every number is measured, every grade is traceable, and the surface never competes with the data. If someone remembers one thing, it's the calm confidence of a technical drawing that happens to be beautiful.

*Anti-AI contract:* No emerald/teal duotone, no liquid glass, no `rounded-2xl` bento, no Framer bloat. Premium comes from spacing discipline, type hierarchy, and border-light precision — not from effects.

Reference stack: **Layer A `taste-skill` + `redesign-skill` + Layer B `linear.app` (for density) / `notion` (for editorial clarity)** — used as source material for density and restraint, not for copying.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Bg | --bg | #faf9f7 | #14181b | Page background |
| Bg elevated | --bg-elevated | #f4f3f1 | #1b2023 | Sidebar, elevated panels |
| Surface | --surface-card / --color-surface | #ffffff | #1f2427 | Cards, inputs |
| Ink | --ink | #1a1c1b | #e7e5e2 | Primary text, headings |
| Ink muted | --ink-muted | #45474b | #a8acae | Secondary, captions |
| Line | --line | #c5c6cc | #333a3d | Borders, dividers |
| Slate | --slate | #5b6b7a | #8b96a0 | Tertiary, disabled |
| Accent | --accent | #ff7a1b | #ff8a3d | CTAs, active nav, focus |
| Accent ink | --accent-ink | #5e2700 | #2b1300 | Text on accent |
| Success | --success* | #1a7a3a | #22c55e | Grade A/B, positive delta |
| Warning | --warning* | #a65a00 | #f59e0b | Grade C/D |
| Error | --error* | #9e1b1b | #ef4444 | Grade F, destructive |

\* Success/warning/error are *semantic only* for grades deltas; they do not create new surfaces. Light values are warm, not neon. No raw hex outside this table.

### Rules
- Depth via **tonal shift + 1px border only**. Zero `box-shadow`, zero `backdrop-blur`, zero `bg-opacity` glass.
- Accent is reserved for **interactive / active** state (CTA, active nav, focus ring). Never decorative (no gradient hero, no accent backgrounds).
- Dark mode is *derived* from light — same tokens, same 1px logic, just remapped. No separate palette.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 48px / 3rem | 700 | 1.05 | -0.02em | Dashboard hero (`Industrial Decarbonization,`) |
| H1 | 24px / 1.5rem | 700 | 1.2 | -0.015em | Page titles (Scorecard, Optimize…) |
| H2 | 20px / 1.25rem | 700 | 1.3 | -0.01em | Section headings |
| H3 | 16px / 1rem | 700 | 1.4 | 0 | Card titles |
| Body | 16px / 1rem | 400 | 1.6 | 0 | Default |
| Body/sm | 14px / 0.875rem | 400 | 1.5 | 0 | Secondary, table rows |
| Mono/data | 14px / 0.875rem | 400 | 1.4 | 0 | All numbers, metrics (`font-mono`) |
| Caption | 12px / 0.75rem | 500 | 1.4 | 0.02em | Labels |
| Overline | 11px / 0.6875rem | 600 | 1.3 | 0.08em | `label-caps` uppercase |

### Font Stack
- **Display / Sans:** `IBM Plex Sans, system-ui, -apple-system, sans-serif` (`--font-plex-sans`) — one family for headings + body (700/600/500/400). No second sans.
- **Mono:** `IBM Plex Mono, ui-monospace, monospace` (`--font-plex-mono`) — *every* number/metric, never sans.
- **Max 2 families.** No serif, no Outfit/Inter.

### Rules
- Body never below 14px. Mono at 12px only for overline labels.
- Clamp display at `32px` on 375px. No 48px on mobile.
- Uppercase via `.label-caps` only (11px, 600, 0.08em). Never hand-coded.

## 4. Spacing & Layout

### Base Unit
4px. Every margin/padding/gap is a multiple. No magic numbers.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Icon-to-label |
| --space-2 | 8px | Inline groups, list gaps |
| --space-3 | 12px | Form field inner |
| --space-4 | 16px | Card inner (compact) |
| --space-5 | 20px | Section inner |
| --space-6 | 24px | Card padding (default), `p-6` |
| --space-8 | 32px | Between cards, `gap-8` |
| --space-10 | 40px | Page vertical rhythm |
| --space-12 | 48px | Major breaks |
| --space-16 | 64px | Page outer `py-8` + gutters |

### Grid
- Max content: **1280px** (`max-w-[1280px]`), `px-8` gutters, centered.
- 12-column, 24px gutter (`gap-8` / `gap-6`), 16px margin at 375px.
- Breakpoints: `md 768`, `lg 1024`, `xl 1280` (Tailwind defaults). Sidebar `w-56` fixed, hidden `<md`.

### Rules
- Page `px-8 py-8` is canonical. Dashboard/Scorecard/Optimize/Simulate/Plan all share it.
- Bento uses `gap-4` within, `mt-8` between sections.

## 5. Components

### Button (`.btn-press`)
- **Structure:** `<button class="btn-press border px-5 py-2.5"><span class="label-caps uppercase">…</span></button>`
- **Variants:** `accent` (`bg-accent text-accent-ink border-accent`) for primary CTA; `surface` (`bg-surface border-line`) for secondary. No other variants.
- **States:** default border `1px solid var(--line)`; hover `border-accent`; focus `outline 2px solid var(--accent) offset -2px`; active `translate-y-[1px]`; disabled `opacity 0.5 pointer-events-none`.
- **Motion:** `transition-colors 150ms ease-out` + `transform 100ms`.

### Card
- **Structure:** `border border-line bg-surface p-5` (or `bg-bg-elevated p-6` for hero). No shadow, no radius, no blur. `0px` corners globally.
- **Hover (bento):** `hover:border-accent` only. No scale, no shadow lift.
- **Empty:** centered `label-caps` + muted icon, `py-10`.

### Input / Select
- **Structure:** `border border-line bg-surface px-2 py-1.5 font-mono text-sm`. Focus `border-accent`, no ring.
- **States:** placeholder `text-ink-muted`, disabled `bg-bg-elevated`.

### Badge (Provenance)
- **Structure:** `inline-flex border px-1.5 py-0.5 text-[10px] label-caps`. `measured` = `bg-ink text-bg`, `estimated` = `bg-accent text-accent-ink`, `scenario` = `bg-slate text-bg`.

### AppShell (Sidebar + Top bar)
- Sidebar `w-56 border-r bg-bg-elevated`, nav `px-2 space-y-0.5`, active `border-accent bg-surface`, inactive `border-transparent text-ink-muted hover:border-line`.
- Top bar `h-14 border-b bg-surface`, grid factor `0.7117 tCO₂/MWh` + `ThemeToggle`.

### Slider (Simulate)
- Native `input[type=range]` thin track `h-1 bg-line`, thumb `h-4 w-4 bg-accent border-2 border-bg`. No custom JS.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100-150ms | ease-out | button press, toggle, border color |
| Standard | 200ms | ease-out | tab/panel, not used for layout |
| Emphasis | — | — | Not used. Blueprint never animates layout. |

### Rules
- Only `transform` (`translate-y 1px` for press) + `opacity` + `color/border-color`. Never `width/height/margin/blur`.
- Every interactive element has hover + focus + active. No missing focus ring.
- Respect `prefers-reduced-motion`: `transition: none` if set.
- Chart lines (Scorecard/Simulate) are static SVG, no path animation.

## 7. Depth & Surface

**Strategy: borders-only + tonal-shift (no shadows).**

| Type | Value | Usage |
|------|-------|-------|
| Default border | `1px solid var(--line)` | All cards, dividers, inputs |
| Subtle border | `1px solid var(--border-subtle)` if needed | Soft inner dividers |
| Tonal surfaces | `bg` → `bg-elevated` → `surface` | Page → sidebar/elevated panel → card |

Rules:
- Zero `box-shadow` declarations. Zero `backdrop-blur`. Zero `bg-opacity`.
- If a surface needs emphasis, go one step up in tonal scale, not a shadow.
- `border-radius: 0` globally. The `0px` corner *is* the brand. No `rounded-xl`.
