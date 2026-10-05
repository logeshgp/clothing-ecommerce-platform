/** Formatting + small shared helpers. All money is Indian rupees. */

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const rupeesWithPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as INR — "₹1,299".
 * Pass `{ forceCents: true }` for totals where paise should always show.
 */
export function formatPrice(value, { forceCents = false } = {}) {
  const amount = Number(value) || 0;
  if (forceCents) return rupeesWithPaise.format(amount);
  if (!Number.isInteger(amount)) return rupeesWithPaise.format(amount);
  return rupees.format(amount);
}

/** Plain grouped number without the symbol — for inputs and compact labels. */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/** "2" -> "02" — used for the editorial counters throughout the UI. */
export function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Stable pseudo random so generated catalog data stays identical between reloads. */
export function seededRandom(seed) {
  let h = 2166136261;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function titleCase(value) {
  return String(value)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Short unique-enough id for admin-created records. */
export function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
