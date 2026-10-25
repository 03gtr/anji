/**
 * Tiny progress store. Lives only in this browser's localStorage so a reload
 * does not lose what she already found. It is not a backup, not synced and
 * not proof of anything — if storage is blocked the garden simply starts fresh.
 */
import { STORAGE_KEY } from './config.js';

const EMPTY = () => ({ welcomed: false, found: [], sound: false, guideMin: false });

function safeStorage(storage) {
  try {
    return storage ?? globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createStore({ storage, key = STORAGE_KEY } = {}) {
  const ls = safeStorage(storage);
  let state = EMPTY();

  try {
    const raw = ls?.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        welcomed: parsed.welcomed === true,
        found: Array.isArray(parsed.found) ? parsed.found.filter((x) => typeof x === 'string') : [],
        sound: parsed.sound === true,
        guideMin: parsed.guideMin === true,
      };
    }
  } catch {
    state = EMPTY();
  }

  const listeners = new Set();

  function save() {
    try {
      ls?.setItem(key, JSON.stringify(state));
    } catch {
      /* storage full or blocked — progress just won't survive a reload */
    }
    listeners.forEach((fn) => fn(state));
  }

  return {
    get: () => state,
    has: (id) => state.found.includes(id),
    /** @returns {boolean} true if this is a new discovery */
    discover(id) {
      if (state.found.includes(id)) return false;
      state = { ...state, found: [...state.found, id] };
      save();
      return true;
    },
    set(patch) {
      state = { ...state, ...patch };
      save();
    },
    reset() {
      state = { ...EMPTY(), sound: state.sound };
      save();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
