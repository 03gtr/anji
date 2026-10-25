/**
 * Time-window logic. Pure functions: every check compares explicit
 * timestamps (launch, launch + 24h) against "now", so it does not matter
 * how long the page has been open or whether it was closed in between.
 *
 * NOTE: this is a convenience, not security. The browser clock and the
 * client-side code are both under the visitor's control. Taking the site
 * offline is done by the owner on the hosting side (see README).
 */
import { WINDOW_MS } from './config.js';

const OFFSET_RE = /(Z|[+-]\d{2}:\d{2})$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/i;

/**
 * @param {string|number} value ISO string with offset, or epoch milliseconds
 * @returns {number} epoch milliseconds
 */
export function parseLaunch(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Launch time is not a finite number.');
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Launch time is empty.');
  }
  const text = value.trim();
  if (!OFFSET_RE.test(text)) {
    throw new Error(`Launch time "${text}" needs a time-zone offset, e.g. +03:00 or Z.`);
  }
  if (!ISO_RE.test(text)) {
    throw new Error(`Launch time "${text}" is not in ISO format YYYY-MM-DDTHH:MM[:SS]+HH:MM.`);
  }
  const ms = Date.parse(text);
  if (Number.isNaN(ms)) throw new Error(`Launch time "${text}" is not a valid date.`);
  return ms;
}

/** @returns {{ start: number, end: number }} end is exactly start + 24h */
export function getWindow(launch, windowMs = WINDOW_MS) {
  const start = parseLaunch(launch);
  return { start, end: start + windowMs };
}

/**
 * @returns {'before'|'active'|'expired'}
 * start is inclusive, end is exclusive.
 */
export function getPhase(now, win) {
  if (now < win.start) return 'before';
  if (now >= win.end) return 'expired';
  return 'active';
}

/**
 * Human friendly Iraqi-Arabic duration, e.g. "٣ ساعات و ٢٠ دقيقة".
 * @param {number} ms
 */
export function formatRemaining(ms) {
  const nf = new Intl.NumberFormat('ar-IQ');
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days) parts.push(countWord(days, 'يوم', 'يومين', 'أيام', nf));
  if (hours) parts.push(countWord(hours, 'ساعة', 'ساعتين', 'ساعات', nf));
  if (mins && !days) parts.push(countWord(mins, 'دقيقة', 'دقيقتين', 'دقايق', nf));
  return parts.join(' و ');
}

/** Arabic counting: 1 → singular, 2 → dual, 3–10 → plural, 11+ → singular. */
function countWord(n, one, two, few, nf) {
  if (n === 1) return one;
  if (n === 2) return two;
  return `${nf.format(n)} ${n <= 10 ? few : one}`;
}
