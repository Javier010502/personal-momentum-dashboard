// Seed / demo dataset. Used only on first load (empty localStorage) and when
// the user clicks "load demo" from the footer. The shapes match the app's own
// data model so the seed flows through the exact same code paths as real input.
//
//   transaction: { id, type: 'income' | 'expense', amount, category, date(YYYY-MM-DD) }
//   habit:       { id, name, history: [{ date(YYYY-MM-DD), done: true }] }
//
// The finance series is deliberately built so the 6-month running balance
// trends upward (income consistently above expenses) — never a cliff. The habit
// histories span the full 18-week heatmap window with realistic gaps and a
// couple of visible streaks.

const uid = () => Math.random().toString(36).slice(2, 10);
const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// Date n months ago (n=0 → current month). Clamped to a sane day.
function monthOffset(monthsAgo, day = 15) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// Build finance: for each of the last 6 months, one salary (income) and two
// expenses (rent + a smaller variable expense). Net positive every month →
// clean upward balance trend with believable month-to-month variation.
function buildFinance() {
  const salaries = [5200, 5200, 5400, 5400, 5600, 5600];
  const rents = [1800, 1800, 1800, 1850, 1850, 1850];
  const extras = [1120, 940, 1300, 1080, 1210, 860]; // food/transit/leisure mix
  const tx = [];
  for (let i = 5; i >= 0; i--) {
    const m = 5 - i;
    tx.push({ id: uid(), type: 'income', amount: salaries[m], category: 'Income', date: monthOffset(i, 1) });
    tx.push({ id: uid(), type: 'expense', amount: rents[m], category: 'Rent', date: monthOffset(i, 3) });
    tx.push({ id: uid(), type: 'expense', amount: extras[m], category: 'Food', date: monthOffset(i, 18) });
  }
  return tx;
}

// Build habits with 18 weeks of history ending today. `pattern` is a function
// (dayIndexFromStart 0..125) => boolean for whether that day is done. This lets
// us sculpt gaps and streaks explicitly.
function buildHabit(name, pattern) {
  const today = new Date();
  const history = [];
  for (let back = 125; back >= 0; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    const iso = ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const dayIndex = 125 - back; // 0 = oldest, 125 = today
    if (pattern(dayIndex)) history.push({ date: iso, done: true });
  }
  return { id: uid(), name, history };
}

// "Read 20 minutes": near-daily, strong recent 21-day streak, a gap mid-window.
const readPattern = (i) => {
  if (i >= 105) return true;                 // solid 21-day streak to today
  if (i >= 80 && i < 86) return false;       // 6-day gap
  return i % 7 !== 2 && i % 9 !== 7;         // otherwise ~daily with occasional miss
};

// "Exercise": 3–4x/week, no long streaks but consistent weekly rhythm.
const exercisePattern = (i) => i % 7 === 0 || i % 7 === 2 || i % 7 === 4;

// "No phone before bed": started ~10 weeks in, steady since, one short gap.
const phonePattern = (i) => {
  if (i < 60) return false;                  // began at week ~9
  if (i >= 92 && i < 96) return false;       // 4-day gap
  return true;
};

// "JIT Rockwell": PLC/Studio 5000 practice streak. Started ~13 weeks in,
// near-daily since with a couple of short gaps — mirrors a just-in-time
// upskilling cadence without looking artificially perfect.
const jitRockwellPattern = (i) => {
  if (i < 90) return false;                  // began at week ~13
  if (i >= 100 && i < 103) return false;     // 3-day gap
  if (i >= 112 && i < 114) return false;     // 2-day gap
  return true;
};

export function buildSeed() {
  return {
    transactions: buildFinance(),
    habits: [
      buildHabit('Read 20 minutes', readPattern),
      buildHabit('Exercise', exercisePattern),
      buildHabit('No phone before bed', phonePattern),
      buildHabit('JIT Rockwell', jitRockwellPattern),
    ],
    theme: 'light',
  };
}
