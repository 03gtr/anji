/**
 * Season 2's own save document (localStorage `snooki-game:s2`, with `:backup`, `:broken` and
 * `:previous`). The original campaign's save is never written by Season 2 (core/game.js routes every
 * `s2` id here).
 *
 * Why a key of its own: every released build touches only its own three save keys, so progress kept
 * here cannot be reset or overwritten by an older tab, a rolled-back release, or an older build's
 * "new game" (tests/game/s2-compat-baseline.test.js).
 *
 *  - a write first copies the previous good document to the backup; a corrupt document recovers from it;
 *  - a document from a NEWER build (higher `v`) is read-only: shown, never reset, never written;
 *  - keys this build does not know are kept as they are (a later milestone survives a rollback);
 *  - the document belongs to one playthrough (`owner` = the main save's createdAt); another
 *    playthrough's is moved to `:previous` by the first write — never deleted;
 *  - every write carries a revision (`rev`): if another tab wrote since this one loaded, this tab does
 *    not overwrite it and becomes read-only (the app asks to reload).
 */
export const S2_KEY = 'snooki-game:s2';
export const S2_VERSION = 1;

/** S2_MIGRATIONS[n] turns a version-n document into version n+1 (none yet). Never edit one. */
export const S2_MIGRATIONS = {};

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strList = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string'))] : []);
const finite = (v, d) => (Number.isFinite(v) ? v : d);
const LIST_MAX = 2000;

export function s2DefaultState(owner, now = Date.now()) {
  return {
    v: S2_VERSION,
    owner: owner ?? null,
    rev: 0,
    createdAt: now,
    updatedAt: now,
    playMs: 0,
    flags: {},
    collected: [],
    seen: [],
    journal: [],
    records: {},
    location: { scene: null, x: null },
    lines: {},
  };
}

/** Bring a parsed document into shape: bad values dropped, unknown keys kept as they are. */
export function normalizeS2(raw, owner, now = Date.now()) {
  const d = s2DefaultState(owner, now);
  if (!isObj(raw)) return d;
  const flags = {};
  for (const [k, v] of Object.entries(isObj(raw.flags) ? raw.flags : {})) {
    if (typeof v === 'boolean' || typeof v === 'string' || Number.isFinite(v)) flags[k] = v;
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
  const lines = {};
  for (const [k, v] of Object.entries(isObj(raw.lines) ? raw.lines : {})) if (Number.isInteger(v) && v >= 0) lines[k] = v;
  return {
    ...raw, // fields a later build added: kept
    v: Number.isInteger(raw.v) ? Math.max(raw.v, S2_VERSION) : S2_VERSION,
    owner: Number.isFinite(raw.owner) ? raw.owner : d.owner,
    rev: Math.max(0, Math.floor(finite(raw.rev, 0))),
    createdAt: finite(raw.createdAt, d.createdAt),
    updatedAt: finite(raw.updatedAt, d.updatedAt),
    playMs: Math.max(0, finite(raw.playMs, 0)),
    flags,
    collected: strList(raw.collected).slice(0, LIST_MAX),
    seen: strList(raw.seen).slice(0, LIST_MAX),
    journal: strList(raw.journal).slice(0, LIST_MAX),
    records,
    location: {
      scene: typeof raw.location?.scene === 'string' ? raw.location.scene : null,
      x: Number.isFinite(raw.location?.x) ? raw.location.x : null,
    },
    lines,
  };
}

function storageOf(storage) {
  if (storage === null) return null;
  try {
    return storage ?? globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
const isQuota = (err) => err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014 || /quota/i.test(err?.message || '');

export function createS2Store({ storage, key = S2_KEY, now = () => Date.now() } = {}) {
  const ls = storageOf(storage);
  const read = (k) => {
    try {
      return ls?.getItem(k) ?? null;
    } catch {
      return null;
    }
  };
  const write = (k, v) => ls.setItem(k, v);
  const parseObj = (text) => {
    try {
      const o = JSON.parse(text);
      return isObj(o) ? o : null;
    } catch {
      return null;
    }
  };
  let readOnly = false;
  let reason = null;
  let lastRev = null; // the rev of the document this tab loaded or last wrote (null: none on disk)
  let archive = null; // another playthrough's document, moved to :previous by the first write

  /** Parse + migrate a stored document; throws on garbage. */
  function upgrade(raw) {
    let v = Number.isInteger(raw.v) ? raw.v : 0;
    let cur = raw;
    while (v < S2_VERSION) {
      const step = S2_MIGRATIONS[v];
      if (typeof step !== 'function') throw new Error(`No Season 2 migration from version ${v}.`);
      cur = step(structuredClone(cur));
      v += 1;
      cur.v = v;
    }
    return cur;
  }

  return {
    key,
    get available() {
      return Boolean(ls);
    },
    get readOnly() {
      return readOnly;
    },
    get reason() {
      return reason;
    },
    /**
     * @param owner the main save's createdAt (the playthrough this document belongs to)
     * @returns {{ state, status: 'new'|'loaded'|'recovered'|'future'|'reset' }}
     */
    load(owner) {
      readOnly = false;
      reason = null;
      archive = null;
      lastRev = null;
      const primary = read(key);
      if (primary == null) return { state: s2DefaultState(owner, now()), status: 'new' };
      const raw = parseObj(primary);
      if (raw && Number.isInteger(raw.v) && raw.v > S2_VERSION) {
        readOnly = true;
        reason = 'future';
        return { state: normalizeS2(raw, raw.owner ?? owner, now()), status: 'future' };
      }
      if (raw) {
        lastRev = Math.max(0, Math.floor(finite(raw.rev, 0)));
        if (Number.isFinite(raw.owner) && raw.owner !== owner) {
          archive = primary; // another playthrough's season: kept aside on the first write
          return { state: s2DefaultState(owner, now()), status: 'new' };
        }
        try {
          return { state: normalizeS2(upgrade(raw), owner, now()), status: 'loaded' };
        } catch {
          /* fall through to the backup */
        }
      }
      try {
        write(`${key}:broken`, primary); // the unreadable document, kept for inspection
      } catch {
        /* ignore */
      }
      const backup = parseObj(read(`${key}:backup`));
      if (backup && !(Number.isInteger(backup.v) && backup.v > S2_VERSION) && (!Number.isFinite(backup.owner) || backup.owner === owner)) {
        try {
          const state = normalizeS2(upgrade(backup), owner, now());
          lastRev = null; // the primary on disk is the broken one: the next write replaces it
          return { state, status: 'recovered' };
        } catch {
          /* fall through */
        }
      }
      return { state: s2DefaultState(owner, now()), status: 'reset' };
    },
    /** @returns {{ ok: boolean, error?: 'readonly'|'other-tab'|'quota'|'failed'|'unavailable' }} */
    save(state) {
      if (!ls) return { ok: false, error: 'unavailable' };
      if (readOnly) return { ok: false, error: 'readonly' };
      try {
        const stored = read(key);
        const onDisk = stored == null ? null : parseObj(stored);
        if (!archive && onDisk && Math.max(0, Math.floor(finite(onDisk.rev, 0))) !== (lastRev ?? -1)) {
          readOnly = true; // another tab wrote since this one loaded: never overwrite it
          reason = 'other-tab';
          return { ok: false, error: 'other-tab' };
        }
        if (archive) {
          write(`${key}:previous`, archive);
          archive = null;
        } else if (onDisk) {
          write(`${key}:backup`, stored); // never a corrupt one over a good backup
        }
        const rev = (lastRev ?? 0) + 1;
        write(key, JSON.stringify({ ...state, v: Math.max(state.v ?? S2_VERSION, S2_VERSION), rev, updatedAt: now() }));
        lastRev = rev;
        state.rev = rev;
        return { ok: true };
      } catch (err) {
        return { ok: false, error: isQuota(err) ? 'quota' : 'failed' };
      }
    },
    /** A new playthrough in this tab: this document now belongs to `owner` (the old one kept aside). */
    rebind(owner) {
      const primary = read(key);
      const raw = primary == null ? null : parseObj(primary);
      archive = raw && raw.owner !== owner ? primary : null;
      lastRev = raw ? Math.max(0, Math.floor(finite(raw.rev, 0))) : null;
      readOnly = false;
      reason = null;
      return s2DefaultState(owner, now());
    },
    clear() {
      for (const k of [key, `${key}:backup`, `${key}:broken`]) {
        try {
          ls?.removeItem(k);
        } catch {
          /* ignore */
        }
      }
      lastRev = null;
      archive = null;
    },
    /** The document as a parsed object (for an exported backup), or null. */
    exportState: (state) => ({ ...state }),
  };
}
