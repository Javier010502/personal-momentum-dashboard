import { useEffect, useMemo, useState } from 'react';
import { load, save } from './lib/storage.js';
import { buildSeed } from './lib/seed.js';
import { momentumScore, interpretMomentum } from './lib/calc.js';
import { todayISO } from './lib/format.js';
import Gauge from './components/Gauge.jsx';
import FinancePanel from './components/FinancePanel.jsx';
import HabitsPanel from './components/HabitsPanel.jsx';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export default function App() {
  // First load with empty storage seeds the demo dataset so the dashboard reads
  // as populated and healthy out of the box. Returning visitors keep their data.
  const initial = useMemo(() => {
    const loaded = load();
    if (loaded.transactions.length === 0 && loaded.habits.length === 0) {
      return buildSeed();
    }
    return loaded;
  }, []);
  const [transactions, setTransactions] = useState(initial.transactions);
  const [habits, setHabits] = useState(initial.habits);
  const [theme, setTheme] = useState(initial.theme);
  const reduced = usePrefersReducedMotion();

  // Persist on any change.
  useEffect(() => {
    save({ transactions, habits, theme });
  }, [transactions, habits, theme]);

  // Reflect theme on <html> and persist via the save above.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // ---- finance actions ----
  const addTransaction = (t) =>
    setTransactions((list) => [...list, { id: uid(), ...t }]);
  const removeTransaction = (id) =>
    setTransactions((list) => list.filter((t) => t.id !== id));

  // ---- habit actions ----
  const addHabit = (name) =>
    setHabits((list) => [...list, { id: uid(), name, history: [] }]);
  const removeHabit = (id) =>
    setHabits((list) => list.filter((h) => h.id !== id));
  const checkHabit = (id, done) =>
    setHabits((list) =>
      list.map((h) => {
        if (h.id !== id) return h;
        const today = todayISO();
        const history = h.history.filter((x) => x.date !== today);
        if (done) history.push({ date: today, done: true });
        return { ...h, history };
      })
    );

  // Demo controls (footer). Let a visitor reset to the empty state to demo the
  // empty design, or reload the populated demo dataset.
  const resetToEmpty = () => {
    setTransactions([]);
    setHabits([]);
  };
  const loadDemo = () => {
    const seed = buildSeed();
    setTransactions(seed.transactions);
    setHabits(seed.habits);
    if (seed.theme) setTheme(seed.theme);
  };

  const momentum = useMemo(
    () => momentumScore(transactions, habits),
    [transactions, habits]
  );
  const interpretation = useMemo(() => interpretMomentum(momentum), [momentum]);

  const isEmpty = transactions.length === 0 && habits.length === 0;

  return (
    <>
      <header>
        <div className="wrap bar">
          <div className="mark">MOMENTUM<span className="dot">.</span></div>
          <button className="toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? 'light mode' : 'dark mode'}
          </button>
        </div>
      </header>

      <main className="wrap">
        <section className="mast">
          <Gauge
            score={momentum.score}
            financialHealth={momentum.financialHealth}
            habitConsistency={momentum.habitConsistency}
            interpretation={interpretation}
            reduced={reduced}
          />
          <div className="mast-copy">
            <h1>Your money and your habits, read as one number.</h1>
            <p className="lead">
              Savings trend and streak consistency, combined into a single read. The rest of the page stays quiet on purpose.
            </p>
            {isEmpty && (
              <p className="mast-hint">
                Nothing recorded yet. Add a transaction or a habit to start building your score.
              </p>
            )}
            <div className="split">
              <div className="stat">
                <span className="k">Financial health</span>
                <span className="v">{momentum.financialHealth}</span>
              </div>
              <div className="stat">
                <span className="k">Habit consistency</span>
                <span className="v">{momentum.habitConsistency}</span>
              </div>
            </div>
          </div>
        </section>

        <p className="gauge-readout">{interpretation}</p>

        <section className="grid2">
          <FinancePanel
            transactions={transactions}
            onAdd={addTransaction}
            onRemove={removeTransaction}
            theme={theme}
          />
          <HabitsPanel
            habits={habits}
            onAdd={addHabit}
            onRemove={removeHabit}
            onCheck={checkHabit}
            theme={theme}
          />
        </section>

        <footer className="foot">
          <span>Personal momentum dashboard</span>
          <span className="foot-actions">
            <button className="ghost" onClick={resetToEmpty}>Reset to empty</button>
            <button className="ghost" onClick={loadDemo}>Load demo</button>
            <span className="foot-note">data stays in your browser</span>
          </span>
        </footer>
      </main>
    </>
  );
}
