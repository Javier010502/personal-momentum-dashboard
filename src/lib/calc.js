// Domain calculations for finance + habits, plus the momentum score.
// Pure functions only; no React, no I/O. Easy to reason about and test.

import { monthKey, todayISO } from './format.js';

// ---- Finance ---------------------------------------------------------------

export function runningBalance(transactions) {
  return transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
}

// Savings rate for a given month = net (income - expense) / income, as a %.
export function savingsRateForMonth(transactions, key) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (monthKey(t.date) !== key) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  if (income === 0) return 0;
  return ((income - expense) / income) * 100;
}

export function currentMonthSavingsRate(transactions) {
  return savingsRateForMonth(transactions, monthKey(todayISO()));
}

// Balance trend over the last `months` calendar months (oldest -> newest).
// First point is balance before the window; each subsequent point adds that
// month's net flow. Produces `months + 1` points.
export function balanceTrend(transactions, months = 6) {
  const now = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const byMonth = {};
  for (const k of keys) byMonth[k] = 0;
  for (const t of transactions) {
    const k = monthKey(t.date);
    if (!(k in byMonth)) continue;
    byMonth[k] += t.type === 'income' ? t.amount : -t.amount;
  }

  const points = [];
  let running = 0;
  // include balance at start of window (point 0)
  points.push({ label: 'start', value: 0 });
  for (const k of keys) {
    running += byMonth[k];
    points.push({ label: k.slice(2), value: running });
  }
  return points;
}

// Spending by category across the last `months` (expenses only).
export function categoryBreakdown(transactions, months = 6) {
  const now = new Date();
  const cutoffKey = `${now.getFullYear()}-${String(now.getMonth() - (months - 1)).padStart(2, '0')}`;
  const totals = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    if (t.date < cutoffKey) continue;
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  const rows = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const max = rows.length ? rows[0].value : 1;
  return rows.map((r) => ({ ...r, width: (r.value / max) * 100 }));
}

// ---- Habits -----------------------------------------------------------------

// Current and longest streak for a habit, ending today or yesterday (so a
// streak is only "broken" after a full missed day).
export function streakStats(habit) {
  const done = new Set(habit.history.map((h) => h.date));
  const dates = [...done].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    if (prev && dayDiff(prev, d) === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  let current = 0;
  let cursor = new Date();
  // allow streak to still count today even if not checked in yet
  if (!done.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (done.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest };
}

function dayDiff(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

// Completion rate over a trailing window of `days` (today inclusive).
// Per-day completion = checked-in habits / total habits.
export function habitConsistency(habits, days = 30) {
  if (habits.length === 0) return 0;
  const today = new Date();
  let total = 0;
  let doneDays = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    let c = 0;
    for (const h of habits) {
      if (h.history.some((x) => x.date === iso)) c += 1;
    }
    total += habits.length;
    doneDays += c;
  }
  return total === 0 ? 0 : (doneDays / total) * 100;
}

// ---- Momentum score ---------------------------------------------------------
//
// Momentum (0-100) = 50% financial health + 50% habit consistency.
//
//   financialHealth (0-100):
//     - savingsTrendScore (0-60): compare savings rate this month vs last
//       month. +1 point per percentage-point improvement (capped 60), floored 0.
//       A steady 20%+ saver lands near the top of this band without requiring
//       runaway growth.
//     - consistencyScore (0-40): 1 - (monthly net-flow volatility / mean
//       monthly net flow), scaled to 40. Low volatility against a positive mean
//       earns the full band; negative or wildly swinging months earn little.
//
//   habitConsistency (0-100):
//     - 30-day per-day completion rate across all habits (defined above).
//
// The two halves are weighted equally at 50/50: the dashboard's thesis is that
// money discipline and behavioural consistency matter the same. Scores are
// clamped to [0,100] before combining so no single bad month can dominate.
//
export function momentumScore(transactions, habits, months = 6) {
  const thisMonth = currentMonthSavingsRate(transactions);

  // last full month savings rate
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = savingsRateForMonth(transactions, lastKey);

  // net flows per month across the window
  const now2 = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const flows = keys.map((k) => {
    let inc = 0;
    let exp = 0;
    for (const t of transactions) {
      if (monthKey(t.date) !== k) continue;
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return inc - exp;
  });

  const savingsTrendScore = clamp((thisMonth - lastMonth > 0 ? thisMonth - lastMonth : 0) * 1, 0, 60);
  const meanFlow = flows.reduce((a, b) => a + b, 0) / (flows.length || 1);
  const variance = flows.reduce((a, b) => a + (b - meanFlow) ** 2, 0) / (flows.length || 1);
  const sd = Math.sqrt(variance);
  let consistencyScore = 0;
  if (meanFlow > 0) consistencyScore = clamp((1 - sd / meanFlow) * 40, 0, 40);
  const financialHealth = clamp(savingsTrendScore + consistencyScore, 0, 100);

  const habit = clamp(habitConsistency(habits, 30), 0, 100);

  const score = clamp(Math.round(financialHealth * 0.5 + habit * 0.5), 0, 100);
  return {
    score,
    financialHealth: Math.round(financialHealth),
    habitConsistency: Math.round(habit),
    delta: 0, // delta is computed historically by the caller if needed
  };
}

// Plain-language interpretation of the score. Sentence case, no exclamation,
// no filler words. Written to read like a person, not a metric label.
export function interpretMomentum(m) {
  const f = m.financialHealth;
  const h = m.habitConsistency;
  const s = m.score;
  const finWord = f >= 60 ? 'strong' : f >= 40 ? 'steady' : 'thin';
  const habWord = h >= 60 ? 'consistent' : h >= 40 ? 'holding' : 'sparse';

  if (s >= 75) return `Strong momentum, with ${finWord} finances and ${habWord} habits.`;
  if (s >= 50) return `Moderate momentum, leaning on ${finWord} finances and ${habWord} habits.`;
  if (s >= 25) {
    return f >= h
      ? `Finances are ${finWord}, but habits are ${habWord} and pulling momentum down.`
      : `Habits are ${habWord}, but finances are ${finWord} and capping the score.`;
  }
  return `Momentum is low on both sides, finances ${finWord} and habits ${habWord}.`;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
