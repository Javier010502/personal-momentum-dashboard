import { todayISO } from '../lib/format.js';

// GitHub-style contribution grid rendered in the single accent color (tints,
// not the default green scale). Builds a 7-row x N-column grid ending today.
export default function Heatmap({ habits }) {
  // Collect per-date completion counts across all habits in the trailing
  // window (default 18 weeks ~ 126 days to match the sketch).
  const weeks = 18;
  const days = weeks * 7;

  const counts = new Map(); // date -> completed habits
  const totals = new Map(); // date -> total habits (for intensity)
  const today = new Date(todayISO());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    counts.set(iso, 0);
    totals.set(iso, habits.length);
  }
  for (const h of habits) {
    for (const e of h.history) {
      if (counts.has(e.date) && e.done) counts.set(e.date, counts.get(e.date) + 1);
    }
  }

  // Build week columns (each column = 7 days, Sun..Sat), oldest first.
  const dates = [...counts.keys()].sort();
  const cols = [];
  for (let i = 0; i < dates.length; i += 7) cols.push(dates.slice(i, i + 7));

  const level = (iso) => {
    const total = totals.get(iso) || 1;
    const done = counts.get(iso) || 0;
    if (done === 0) return 0;
    const ratio = done / total;
    if (ratio >= 0.99) return 4;
    if (ratio >= 0.66) return 3;
    if (ratio >= 0.34) return 2;
    return 1;
  };

  return (
    <div className="heatmap" role="img" aria-label="Habit completion heatmap, last 18 weeks">
      {cols.map((col, ci) => (
        <div className="heat-col" key={ci}>
          {col.map((iso) => (
            <div key={iso} className={`heat-cell l${level(iso)}`} title={`${iso}: ${counts.get(iso) || 0}/${totals.get(iso) || 0} habits`} />
          ))}
        </div>
      ))}
    </div>
  );
}
