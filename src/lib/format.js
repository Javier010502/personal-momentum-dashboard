// Small formatting helpers shared across panels.

export function money(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  return `${sign}$${abs.toLocaleString('en-US')}`;
}

// Signed money for deltas ("+$320", "-$40").
export function signedMoney(n) {
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

export function pct(n) {
  return `${Math.round(n)}%`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(iso) {
  return iso.slice(0, 7); // YYYY-MM
}
