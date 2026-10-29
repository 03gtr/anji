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
  const shadowKey = `${key}:shadow`;
  const altKey = `${key}:alt`;
  const parse = (text) => normalize(migrate(JSON.parse(text), { version, migrations }), now());
  const parseObj = (text) => {
    try {
      const o = text == null ? null : JSON.parse(text);
      return isObj(o) ? o : null;
    } catch {
      return null;
    }
  };
  const revOf = (o) => (Number.isInteger(o?.rev) && o.rev > 0 ? o.rev : null);
  /*
   * Older tabs and newer saves (Season 2 safety, tests/game/s2-older-tab.test.js). Released builds
   * cannot be changed: an older tab still open writes its state over the save. So this build marks
   * every save it writes with a revision (`rev`, in the file only — never in the game state) and
   * mirrors it to `:shadow`, a key older builds never touch. A save on disk without `rev` while the
   * shadow of the same playthrough has one was written by an older build; if progress was lost the
   * load says so and the app asks — both copies are kept. A save from a NEWER build is read-only
   * (the released code reset it). A second tab of this build never overwrites a newer save.
   */
  let readOnly = false;
  let reason = null;
  let lastRev = null; // the rev on disk when this tab loaded or last wrote (null: none)
  let pending = null; // { current, alt } while the app asks about an older tab's overwrite

  return {
    available: Boolean(ls),
    get readOnly() {
      return readOnly;
    },
    get reason() {
      return reason;
    },
    /**
     * @returns {{ state: object, status: 'new'|'loaded'|'recovered'|'reset'|'future'|'overwritten', error?: string,
     *   alt?: object, lost?: { flags: string[], journal: string[], collected: string[] } }}
     */
    load() {
      readOnly = false;
      reason = null;
      pending = null;
      const primary = read(key);
      if (primary == null) return { state: defaultState(now()), status: 'new' };
      const raw = parseObj(primary);
      if (raw && Number.isInteger(raw.v) && raw.v > version) {
        readOnly = true; // never reset or write a newer build's save
        reason = 'future';
        return { state: defaultState(now()), status: 'future', error: 'future' };
      }
      lastRev = revOf(raw);
      try {
        const state = parse(primary);
        const shadow = parseObj(read(shadowKey));
        if (raw && lastRev == null && revOf(shadow) && shadow.createdAt === raw.createdAt) {
          // an older build wrote last (lastRev stays null: its save has no rev); the next write continues after the shadow
          const alt = normalize(migrate(shadow, { version, migrations }), now());
          const missing = (list, have) => list.filter((x) => !have.includes(x));
          const lost = {
            flags: Object.keys(alt.flags).filter((f) => alt.flags[f] && !state.flags[f]),
            journal: missing(alt.journal, state.journal),
            collected: missing(alt.collected, state.collected),
          };
          if (lost.flags.length || lost.journal.length || lost.collected.length) {
            pending = { current: primary, alt: read(shadowKey) };
            return { state, status: 'overwritten', alt, lost };
          }
        }
        return { state, status: 'loaded' };
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
    /** @returns {{ ok: boolean, error?: 'quota'|'unavailable'|'failed'|'readonly'|'other-tab' }} */
    save(state) {
      if (!ls) return { ok: false, error: 'unavailable' };
      if (readOnly) return { ok: false, error: 'readonly' };
      try {
        const previous = read(key);
        const onDisk = parseObj(previous);
        // someone else wrote since this tab loaded or last wrote: another tab of this build (a newer
        // rev) or an older build (no rev over ours). Never overwrite it. An unreadable save is no tab.
        if (onDisk && revOf(onDisk) !== lastRev) {
          readOnly = true;
          reason = 'other-tab';
          return { ok: false, error: 'other-tab' };
        }
        const rev = Math.max(lastRev ?? 0, revOf(parseObj(read(shadowKey))) ?? 0) + 1;
        const text = JSON.stringify({ ...state, rev, v: version, updatedAt: now() });
        if (onDisk) ls.setItem(backupKey, previous); // never a corrupted save over a good backup
        ls.setItem(key, text);
        ls.setItem(shadowKey, text);
        lastRev = rev;
        pending = null;
        return { ok: true };
      } catch (err) {
        return { ok: false, error: isQuota(err) ? 'quota' : 'failed' };
      }
    },
    /** After `load()` said 'overwritten': «رجّعي الأحدث» — the newer progress back, the other copy kept. */
    restore(alt) {
      if (pending) {
        try {
          ls.setItem(altKey, pending.current);
        } catch {
          /* ignore */
        }
      }
      return this.save(alt);
    },
    /** After `load()` said 'overwritten': «خليها» — keep the save as it is, the newer copy kept aside. */
    keep() {
      if (!pending) return { ok: true };
      try {
        ls.setItem(altKey, pending.alt);
        ls.setItem(shadowKey, pending.current); // asked once: the shadow now matches the save
        pending = null;
        return { ok: true };
      } catch (err) {
        return { ok: false, error: isQuota(err) ? 'quota' : 'failed' };
      }
    },
    hasSave() {
      return read(key) != null || read(backupKey) != null;
    },
    clear() {
      for (const k of [key, backupKey, brokenKey, shadowKey, altKey]) {
        try {
          ls?.removeItem(k);
        } catch {
          /* ignore */
        }
      }
      lastRev = null;
      pending = null;
      readOnly = false;
      reason = null;
    },
    /** A backup file; with Season 2's document when given (older builds import the main save only). */
    exportText(state, s2 = null) {
      const data = { game: GAME_ID, exportedAt: new Date(now()).toISOString(), save: { ...state, v: version } };
      if (s2) data.s2 = s2;
      return JSON.stringify(data, null, 2);
    },
    /** Season 2's document inside a backup file, or null (older backups have none). */
    importS2(text) {
      try {
        const data = JSON.parse(text);
        return isObj(data?.s2) ? data.s2 : null;
      } catch {
        return null;
      }
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
