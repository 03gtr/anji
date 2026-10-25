/**
 * ─────────────────────────────────────────────────────────────
 *  LAUNCH TIME — the only value the owner normally needs to edit.
 * ─────────────────────────────────────────────────────────────
 *
 * The garden opens at LAUNCH_AT and closes exactly 24 hours later.
 *
 * Format: ISO-8601 with an explicit time-zone offset (or "Z" for UTC).
 *   Baghdad time is UTC+03:00, so 9:00 in the morning Baghdad time is:
 *   '2026-10-26T09:00:00+03:00'
 *
 * A value without an offset is rejected on purpose: it would be read in the
 * visitor's own time zone and shift the window.
 *
 * Optional build-time override (no code edit needed):
 *   VITE_LAUNCH_AT='2026-10-26T09:00:00+03:00' npm run build
 * or set a repository variable named LAUNCH_AT for the GitHub Pages workflow.
 */
export const DEFAULT_LAUNCH_AT = '2026-10-26T09:00:00+03:00';

export const LAUNCH_AT = import.meta.env?.VITE_LAUNCH_AT || DEFAULT_LAUNCH_AT;

/** Length of the window. Exactly 24 hours. */
export const WINDOW_MS = 24 * 60 * 60 * 1000;

/** localStorage key for this visitor's own progress (stays on her device). */
export const STORAGE_KEY = 'anji-secret-garden:v1';
