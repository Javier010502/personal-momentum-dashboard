import { useMemo, useState } from 'react';
import {
  runningBalance,
  currentMonthSavingsRate,
  balanceTrend,
  categoryBreakdown,
} from '../lib/calc.js';
import { money, signedMoney, pct, todayISO } from '../lib/format.js';
import TrendChart from './TrendChart.jsx';

const CATEGORIES = ['Rent', 'Food', 'Transit', 'Health', 'Leisure', 'Other'];

export default function FinancePanel({ transactions, onAdd, onRemove, theme }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(todayISO());

  const balance = useMemo(() => runningBalance(transactions), [transactions]);
  const rate = useMemo(() => currentMonthSavingsRate(transactions), [transactions]);
  const trend = useMemo(() => balanceTrend(transactions, 6), [transactions]);
  const cats = useMemo(() => categoryBreakdown(transactions, 6), [transactions]);

  const submit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    onAdd({ type, amount: amt, category, date });
    setAmount('');
  };

  return (
    <section className="panel" aria-labelledby="finance-h">
      <div className="phead">
        <h2 id="finance-h">Finance</h2>
        <span className="tag">6 months</span>
      </div>

      {transactions.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No transactions yet</p>
          <p className="empty-body">
            Add your first entry below. Balance, savings rate, and the trend line build from here.
          </p>
        </div>
      ) : (
        <>
          <div className="balance">
            <span className="balance-v">{money(balance)}</span>
            <span className="rate">saving {pct(rate)} this month</span>
          </div>
          <p className="sub">Running balance across all recorded entries</p>
          <TrendChart points={trend} theme={theme} />
          {cats.length > 0 && (
            <div className="cat">
              {cats.map((c) => (
                <div className="cat-row" key={c.name}>
                  <span className="cat-name">{c.name}</span>
                  <span className="cat-bar">
                    <i style={{ width: `${c.width}%` }} />
                  </span>
                  <span className="cat-val">{money(c.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <form className="tx-form" onSubmit={submit}>
        <div className="seg">
          <button type="button" className={type === 'expense' ? 'on' : ''} onClick={() => setType('expense')}>
            Expense
          </button>
          <button type="button" className={type === 'income' ? 'on' : ''} onClick={() => setType('income')}>
            Income
          </button>
        </div>
        <div className="tx-fields">
          <input
            className="amt"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
          <button type="submit" className="primary">Add</button>
        </div>
      </form>

      {transactions.length > 0 && (
        <ul className="tx-list">
          {[...transactions]
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 8)
            .map((t) => (
              <li key={t.id} className="tx-item">
                <span className="tx-cat">{t.category}</span>
                <span className="tx-date">{t.date.slice(5)}</span>
                <span className={`tx-amt ${t.type}`}>{t.type === 'income' ? signedMoney(t.amount) : `-${money(t.amount).slice(1)}`}</span>
                <button className="tx-x" onClick={() => onRemove(t.id)} aria-label="Remove transaction">×</button>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
