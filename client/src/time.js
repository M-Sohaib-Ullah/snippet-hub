// Robust relative-time formatter that handles both timestamp formats this app
// can produce: SQLite's "YYYY-MM-DD HH:MM:SS" (UTC, no zone) and Postgres/JSON
// ISO strings (with a zone, e.g. "2024-06-06T12:34:56.000Z").
export function timeAgo(value) {
  if (!value) return '';
  let s = String(value);
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(s);
  if (!s.includes('T')) s = s.replace(' ', 'T');
  const t = new Date(hasZone ? s : s + 'Z').getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
