# Personal Momentum Dashboard

A portfolio-grade web app that combines a **personal finance tracker** and a
**habit-streak tracker** into one cohesive interface, anchored by a single
**momentum score** (0–100) that reads your financial health and habit
consistency as one number.

It is client-side only. There is no backend and no account — all data lives in
your browser via `localStorage`.

---

## What it does

**Finance tracker**
- Manual transaction entry (amount, category, date, income/expense toggle)
- Running balance and current-month savings rate
- Balance-trend area chart over the last 6 months (Chart.js)
- Category breakdown as a quiet horizontal bar list (no pie chart)

**Habit tracker**
- Add and remove your own habits (user-defined, not hardcoded)
- Daily check-in per habit (today's toggle)
- GitHub-style contribution heatmap in the single accent color (tints, not the
  default green scale)
- Current streak and longest streak per habit

**Momentum score (signature)**
- One custom SVG gauge (open half-ring, not a repurposed doughnut) that sweeps
  to the score on load and whenever the data changes
- A plain-language interpretation line below it that updates from the real
  computed values

---

## Design direction

Built on the **high-contrast sans** direction from the early sketches: forest
accent (`#1F6F5C`, light / `#5FB39B` dark), Space Grotesk for everything with
weight doing the work, JetBrains Mono for meta labels and numbers. Hairline
borders only, flat surfaces, no shadows, no gradients. The gauge is the one
bold element; everything else recedes around it.

Dark mode is supported and inverts cleanly — the accent shifts slightly lighter
so it keeps contrast, and every chart/heatmap color is driven by the same CSS
variables. Empty states are written as invitations ("No transactions yet —
add your first entry below"), not apologies.

**Demo controls.** On first load (empty storage) the dashboard seeds a believable
demo dataset — three habits with realistic 18-week check-in histories (streaks,
gaps, varying intensity) and six months of finance with a steady upward savings
trend (income consistently above expenses, never a cliff). A footer "Reset to
empty" button clears everything so you can demo the empty state, and "Load demo"
re-populates the seed. Returning visitors keep their own data; the seed only
fires when storage is genuinely empty.

---

## Tech choices

- **Vite + React** — fast static build, zero runtime server, trivial Vercel
  deploy (just connect the repo; default settings work).
- **Chart.js** for the balance-trend line — small, dependency-light, and the
  colors are re-read from CSS variables so it follows light/dark mode.
- **Custom SVG** for the momentum gauge — a hand-built half-ring arc with an
  `easeOutCubic` sweep. No charting library, so it stays on-brand and cheap.
- **localStorage** for persistence — one namespaced key (`momentum.v1`),
  wrapped in try/catch so the app still runs in private mode or when storage is
  blocked.
- No UI framework / no Tailwind — plain CSS with custom properties keeps the
  design tokens explicit and the bundle tiny, which reads better in a portfolio
  than an off-the-shelf component library.

---

## Momentum score formula

Documented in `src/lib/calc.js`. The score is the weighted mean of two halves,
weighted equally because the dashboard's thesis is that money discipline and
behavioural consistency matter the same:

```
momentum = round( financialHealth * 0.5 + habitConsistency * 0.5 )   // clamped 0..100
```

**financialHealth (0–100)** = savingsTrendScore + consistencyScore
- `savingsTrendScore` (0–60): this month's savings rate minus last month's,
  +1 point per percentage-point improvement, capped at 60, floored at 0. A
  steady ~20% saver lands near the top without needing runaway growth.
- `consistencyScore` (0–40): `1 - (sd of monthly net flow / mean monthly net
  flow)`, scaled to 40. Low volatility against a positive mean earns the full
  band; negative or wildly swinging months earn little.

**habitConsistency (0–100)** = 30-day per-day completion rate across all habits
(completed habits / total habits, averaged over the trailing 30 days, today
included).

All sub-scores are clamped to `[0, 100]` before combining so no single bad
month can dominate.

The interpretation line is generated from the two halves (e.g. "Strong momentum,
with strong finances and consistent habits.") — sentence case, no exclamation
marks, no filler words.

---

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs ./dist, deployable to Vercel as a static build
npm run preview  # serve the production build locally
```

## Deploy to Vercel

Push the repo and import it in Vercel, or run `vercel` from the project root.
Build command `npm run build`, output directory `dist`. No environment variables
required.

---

## Project structure

```
src/
  main.jsx              entry, sets theme before paint
  App.jsx               state, persistence, layout
  styles.css            design system (tokens, light/dark)
  lib/
    storage.js          localStorage load/save
    seed.js             demo dataset (first-load + "load demo")
    format.js           money / percent / date helpers
    calc.js             finance + habit metrics + momentum formula
  components/
    Gauge.jsx           custom SVG half-ring gauge
    TrendChart.jsx      Chart.js balance area line
    Heatmap.jsx         GitHub-style contribution grid
    FinancePanel.jsx    entry form, balance, chart, categories, list
    HabitsPanel.jsx     add/remove, check-in, streaks, heatmap
```
