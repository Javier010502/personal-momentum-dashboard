import { useState } from 'react';
import { todayISO } from '../lib/format.js';
import { streakStats } from '../lib/calc.js';
import Heatmap from './Heatmap.jsx';

export default function HabitsPanel({ habits, onAdd, onRemove, onCheck, theme }) {
  const [name, setName] = useState('');

  const rows = habits.map((h) => {
    const { current, longest } = streakStats(h);
    const today = todayISO();
    const doneToday = h.history.some((x) => x.date === today && x.done);
    return { ...h, current, longest, doneToday };
  });

  const add = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onAdd(n);
    setName('');
  };

  return (
    <section className="panel" aria-labelledby="habits-h">
      <div className="phead">
        <h2 id="habits-h">Habits</h2>
        <span className="tag">{rows.length ? `${rows[0]?.history?.length || 0} days` : 'empty'}</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No habits yet</p>
          <p className="empty-body">
            Create a habit below. The heatmap and streaks fill in as you check in each day.
          </p>
        </div>
      ) : (
        <>
          <Heatmap habits={habits} />
        </>
      )}

      <div className="hlist">
        {rows.map((h) => (
          <div className="hrow" key={h.id}>
            <span className="hname">{h.name}</span>
            <span className="hmeta">cur {h.current} · best {h.longest}</span>
            <button
              className={`chk ${h.doneToday ? 'on' : ''}`}
              onClick={() => onCheck(h.id, !h.doneToday)}
              aria-pressed={h.doneToday}
              aria-label={h.doneToday ? `Unmark ${h.name} today` : `Mark ${h.name} done today`}
            >
              {h.doneToday ? '✓' : ''}
            </button>
          </div>
        ))}
      </div>

      <form className="add-form" onSubmit={add}>
        <input
          placeholder="New habit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New habit name"
        />
        <button type="submit" className="primary" disabled={!name.trim()}>Add</button>
      </form>

      {rows.length > 0 && (
        <ul className="h-remove">
          {rows.map((h) => (
            <li key={h.id} className="h-rm-item">
              <span>{h.name}</span>
              <button onClick={() => onRemove(h.id)} aria-label={`Remove habit ${h.name}`}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}