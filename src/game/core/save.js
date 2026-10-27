/**
 * Versioned local save storage.
 *
 * Storage: localStorage, which is synchronous (no lost writes when the tab is
 * closed mid-save), available offline and large enough for this save (a few
 * KB). Each write first copies the previous good save to a backup key, so a
 * corrupted primary save can be recovered. Saves carry a schema version and
 * are upgraded through MIGRATIONS on load. Nothing ever leaves the device
 * except through an export the player starts herself.
 */
export const GAME_ID = 'snooki-missing-creator';
export const SAVE_VERSION = 3;
export const SAVE_KEY = 'snooki-game:save';

/**
 * MIGRATIONS[n] turns a version-n save into a version-(n+1) save.
 * Add an entry here whenever the shape of the save changes, and bump
 * SAVE_VERSION. Never edit an existing migration.
 */
export const MIGRATIONS = {
  // V2: the observatory owl became «العم منذر» (journal id 'hoot' → 'munther').
  1: (save) => {
    if (Array.isArray(save.journal)) save.journal = save.journal.map((id) => (id === 'hoot' ? 'munther' : id));
    return save;
  },
  // V3: the games room (card backs, gifts, dialogue rotation)
  2: (save) => {
    save.cosmetics = { cardBack: 'classic', ...(save.cosmetics || {}) };
    save.hub = save.hub || { lines: {}, gifts: [], daily: null };
    return save;
  },
};

export class SaveError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

export function defaultState(now = Date.now()) {
  return {
    v: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    playMs: 0,
    flags: {},
    inventory: {},
    collected: [],
    seen: [],
    journal: [],
    records: {},
    unlocks: [],
    cosmetics: {
      anjiOutfit: 'classic',
      anjiBow: 'burgundy',
      snookiHat: 'none',
      snookiCollar: 'navy',
      carColor: 'cobalt',
      cardBack: 'classic',
    },
    location: { scene: null, x: null },
    garden: [],
    memories: {},
    hub: { lines: {}, gifts: [], daily: null },
  };
}

export const GIFT_PARTS = ['wrap', 'ribbon', 'flower', 'note'];
export const MAX_GIFTS = 24;

function normalizeHub(raw) {
  const hub = { lines: {}, gifts: [], daily: null };
  if (!isObj(raw)) return hub;
  for (const [k, v] of Object.entries(isObj(raw.lines) ? raw.lines : {})) if (Number.isInteger(v) && v >= 0) hub.lines[k] = v;
  if (Array.isArray(raw.gifts)) {
    hub.gifts = raw.gifts
      .filter((g) => isObj(g) && GIFT_PARTS.every((k) => typeof g[k] === 'string' && g[k].length <= 40))
      .slice(0, MAX_GIFTS)
      .map((g) => Object.fromEntries(GIFT_PARTS.map((k) => [k, g[k]])));
  }
  if (typeof raw.daily === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.daily)) hub.daily = raw.daily;
  return hub;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strList = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string'))] : []);
const finite = (v, d) => (Number.isFinite(v) ? v : d);

/** Bring any parsed save object into the current shape, dropping bad values. */
export function normalize(raw, now = Date.now()) {
  const d = defaultState(now);
  if (!isObj(raw)) return d;
  const flags = {};
  for (const [k, v] of Object.entries(isObj(raw.flags) ? raw.flags : {})) {
    if (typeof v === 'boolean' || typeof v === 'string' || Number.isFinite(v)) flags[k] = v;
  }
  const inventory = {};
  for (const [k, v] of Object.entries(isObj(raw.inventory) ? raw.inventory : {})) {
    if (Number.isInteger(v) && v > 0) inventory[k] = v;
  }
  const records = {};
  for (const [k, r] of Object.entries(isObj(raw.records) ? raw.records : {})) {
    if (!isObj(r)) continue;
    records[k] = {
      plays: Math.max(0, Math.floor(finite(r.plays, 0))),
      best: Number.isFinite(r.best) ? r.best : null,
      medal: ['bronze', 'silver', 'gold'].includes(r.medal) ? r.medal : null,
      completed: r.completed === true,
    };
  }
  const cosmetics = { ...d.cosmetics };
  for (const k of Object.keys(cosmetics)) {
    if (typeof raw.cosmetics?.[k] === 'string') cosmetics[k] = raw.cosmetics[k];
  }
  const garden = Array.isArray(raw.garden)
    ? raw.garden
        .filter((p) => isObj(p) && typeof p.id === 'string' && Number.isInteger(p.cell))
        .map((p) => ({ id: p.id, cell: p.cell }))
    : [];
  const memories = {};
  for (const [k, m] of Object.entries(isObj(raw.memories) ? raw.memories : {})) {
    if (isObj(m)) memories[k] = { solved: m.solved === true, attempts: Math.max(0, Math.floor(finite(m.attempts, 0))) };
  }
  return {
    v: SAVE_VERSION,
    createdAt: finite(raw.createdAt, d.createdAt),
    updatedAt: finite(raw.updatedAt, d.updatedAt),
    playMs: Math.max(0, finite(raw.playMs, 0)),
    flags,
    inventory,
    collected: strList(raw.collected),
    seen: strList(raw.seen),
    journal: strList(raw.journal),
    records,
    unlocks: strList(raw.unlocks),
    cosmetics,
    location: {
      scene: typeof raw.location?.scene === 'string' ? raw.location.scene : null,
      x: Number.isFinite(raw.location?.x) ? raw.location.x : null,
    },
    garden,
    memories,
    hub: normalizeHub(raw.hub),
  };
}

/** Upgrade a parsed save to `version` by running migrations in order. */
export function migrate(raw, { version = SAVE_VERSION, migrations = MIGRATIONS } = {}) {
  if (!isObj(raw)) throw new SaveError('invalid', 'Save is not an object.');
  let v = Number.isInteger(raw.v) ? raw.v : 0;
  if (v > version) throw new SaveError('future', `Save version ${v} is newer than this game (${version}).`);
  let cur = raw;
  while (v < version) {
    const step = migrations[v];
    if (typeof step !== 'function') throw new SaveError('no-migration', `No migration from version ${v}.`);
    cur = step(structuredClone(cur));
    v += 1;
    cur.v = v;
  }
  return cur;
}

function storageOf(storage) {
  try {
    return storage ?? globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isQuota(err) {
  return err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014 || /quota/i.test(err?.message || '');
}

export function createSaveManager({
  storage,
  key = SAVE_KEY,
  version = SAVE_VERSION,
  migrations = MIGRATIONS,
  now = () => Date.now(),
} = {}) {
  const ls = storageOf(storage);
  const backupKey = `${key}:backup`;
  const brokenKey = `${key}:broken`;

  const read = (k) => {
    try {
      return ls?.getItem(k) ?? null;
    } catch {
      return null;
    }
  };
  const parse = (text) => normalize(migrate(JSON.parse(text), { version, migrations }), now());

  return {
    available: Boolean(ls),
    /**
     * @returns {{ state: object, status: 'new'|'loaded'|'recovered'|'reset', error?: string }}
     */
    load() {
      const primary = read(key);
      if (primary == null) return { state: defaultState(now()), status: 'new' };
      try {
        return { state: parse(primary), status: 'loaded' };
      } catch (err) {
        const backup = read(backupKey);
        try {
          ls?.setItem(brokenKey, primary); // keep the unreadable save for inspection
        } catch {
          /* ignore */
        }
        if (backup != null) {
          try {
            return { state: parse(backup), status: 'recovered', error: err.code || 'corrupt' };
          } catch {
            /* fall through */
          }
        }
        return { state: defaultState(now()), status: 'reset', error: err.code || 'corrupt' };
      }
    },
    /** @returns {{ ok: boolean, error?: 'quota'|'unavailable'|'failed' }} */
    save(state) {
      if (!ls) return { ok: false, error: 'unavailable' };
      try {
        const text = JSON.stringify({ ...state, v: version, updatedAt: now() });
        const previous = read(key);
        if (previous != null) {
          try {
            JSON.parse(previous);
            ls.setItem(backupKey, previous);
          } catch {
            /* never back up a corrupted save over a good backup */
          }
        }
        ls.setItem(key, text);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: isQuota(err) ? 'quota' : 'failed' };
      }
    },
    hasSave() {
      return read(key) != null || read(backupKey) != null;
    },
    clear() {
      for (const k of [key, backupKey, brokenKey]) {
        try {
          ls?.removeItem(k);
        } catch {
          /* ignore */
        }
      }
    },
    exportText(state) {
      return JSON.stringify({ game: GAME_ID, exportedAt: new Date(now()).toISOString(), save: { ...state, v: version } }, null, 2);
    },
    /** Parse an exported backup. Throws SaveError on anything unusable. */
    importText(text) {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new SaveError('not-json', 'This file is not a save backup.');
      }
      if (!isObj(data) || data.game !== GAME_ID || !isObj(data.save)) {
        throw new SaveError('wrong-game', 'This file is not a backup of this game.');
      }
      return normalize(migrate(data.save, { version, migrations }), now());
    },
  };
}
