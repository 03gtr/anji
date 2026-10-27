/**
 * Player preferences. Stored separately from the save, so starting a new game
 * or clearing progress keeps her audio and comfort settings.
 */
export const SETTINGS_KEY = 'snooki-game:settings';

export const DEFAULT_SETTINGS = Object.freeze({
  sound: true,
  volume: 0.7,
  music: true,
  textSpeed: 'normal', // slow | normal | fast | instant
  motion: 'system', // system | reduce | full
  hints: true,
  controlHints: true,
  vibration: false,
  tips: true, // contextual one-time tips
  tipsSeen: Object.freeze([]),
  raceDifficulty: 'normal', // easy | normal | hard
});

const CHOICES = {
  textSpeed: ['slow', 'normal', 'fast', 'instant'],
  motion: ['system', 'reduce', 'full'],
  raceDifficulty: ['easy', 'normal', 'hard'],
};

export function sanitizeSettings(raw) {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return s;
  for (const k of ['sound', 'music', 'hints', 'controlHints', 'vibration', 'tips']) {
    if (typeof raw[k] === 'boolean') s[k] = raw[k];
  }
  if (Number.isFinite(raw.volume)) s.volume = Math.min(1, Math.max(0, raw.volume));
  for (const [k, list] of Object.entries(CHOICES)) if (list.includes(raw[k])) s[k] = raw[k];
  if (Array.isArray(raw.tipsSeen)) s.tipsSeen = [...new Set(raw.tipsSeen.filter((x) => typeof x === 'string'))].slice(0, 64);
  return s;
}

export function createSettings({ storage, key = SETTINGS_KEY, systemReducedMotion = () => false } = {}) {
  let ls = null;
  try {
    ls = storage ?? globalThis.localStorage ?? null;
  } catch {
    ls = null;
  }
  let value = DEFAULT_SETTINGS;
  try {
    value = sanitizeSettings(JSON.parse(ls?.getItem(key) || 'null'));
  } catch {
    value = sanitizeSettings(null);
  }
  const listeners = new Set();

  return {
    get: () => value,
    set(patch) {
      value = sanitizeSettings({ ...value, ...patch });
      try {
        ls?.setItem(key, JSON.stringify(value));
      } catch {
        /* settings simply won't persist */
      }
      listeners.forEach((fn) => fn(value));
    },
    reducedMotion() {
      if (value.motion === 'reduce') return true;
      if (value.motion === 'full') return false;
      return systemReducedMotion();
    },
    /** ms per character for the dialogue typewriter (0 = instant). */
    charDelay() {
      return { slow: 38, normal: 22, fast: 10, instant: 0 }[value.textSpeed];
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
