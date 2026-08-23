// localStorage persistence. Single key, wrapped in try/catch so the app still
// runs on hosts that block storage (private mode, storage disabled).

const KEY = 'momentum.v1';

export const SEED = {
  transactions: [],
  habits: [],
  theme: 'light',
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...SEED };
    const parsed = JSON.parse(raw);
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return { ...SEED };
  }
}

export function save(state) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        transactions: state.transactions,
        habits: state.habits,
        theme: state.theme,
      })
    );
  } catch {
    // storage unavailable; keep running in-memory only
  }
}
