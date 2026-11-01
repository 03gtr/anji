/**
 * Game state: the single source of truth for progress. Rendering never owns
 * progress; scenes read from here and change it only through these methods.
 * Every change is saved immediately (saves are tiny and synchronous) and
 * announced on the bus as 'change'.
 *
 * Collectible ids are dotted, the first segment is their group:
 *   'star.garden.1', 'note.ryan.3', 'seed.blue.2' …
 *
 * One document per season (docs/season-2/SEASON_2_TECHNICAL_PLAN.md §1, docs/season-3/TECHNICAL_ARCHITECTURE.md §2):
 * the original campaign's save (`state`), Season 2's (`s2`) and Season 3's (`s3`), each season's in its own store
 * (core/s2-store.js, one key each). Every id is routed by `seasonOf`: a season's ids carry its segment (`s2:board`,
 * `mission:s2-01`, `s2.ev.e-wax`, `dlg:s2.01-enter`, a scene `s2-archive` → `visited:s2-archive`; likewise `s3`).
 * A season never writes the main save, nor another season's.
 */
import { defaultState, MAX_GIFTS } from './save.js';
import { s2DefaultState, normalizeS2 } from './s2-store.js';

const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 };

export const groupOf = (id) => String(id).split('.')[0];

/** True for a Season 2 id: an `s2` segment at the start or after `:` / `.`, followed by `-` `:` `.` or the end. */
export const isS2 = (id) => /(^|[:.])s2([-:.]|$)/.test(String(id));
/** True for a Season 3 id (the same rule, an `s3` segment). */
export const isS3 = (id) => /(^|[:.])s3([-:.]|$)/.test(String(id));
/** The season whose document an id belongs to: 's2', 's3', or null (the original campaign's save). */
export const seasonOf = (id) => (isS2(id) ? 's2' : isS3(id) ? 's3' : null);
const SEASONS = ['s2', 's3'];

/**
 * Season ids never live in the main save. A main state that carries some (a test fixture, a developer link) hands
 * them to their season's document — in memory; nothing is written here.
 */
function liftSeasons(main, docs) {
  for (const [k, v] of Object.entries(main.flags ?? {})) {
    const s = seasonOf(k);
    if (!s) continue;
    if (!(k in docs[s].flags)) docs[s].flags[k] = v;
    delete main.flags[k];
  }
  for (const list of ['collected', 'seen', 'journal']) {
    const own = (main[list] ?? []).filter((x) => seasonOf(x));
    if (!own.length) continue;
    main[list] = main[list].filter((x) => !seasonOf(x));
    for (const x of own) {
      const d = docs[seasonOf(x)];
      if (!d[list].includes(x)) d[list].push(x);
    }
  }
  for (const [k, r] of Object.entries(main.records ?? {})) {
    const s = seasonOf(k);
    if (!s) continue;
    if (!(k in docs[s].records)) docs[s].records[k] = r;
    delete main.records[k];
  }
}

export function createGame({ saveManager, s2Store = null, s3Store = null, bus, initial, s2Initial, s3Initial, now = () => Date.now() }) {
  let state = initial ?? defaultState(now());
  const docs = {
    s2: s2Initial ?? s2DefaultState(state.createdAt, now()),
    s3: s3Initial ?? s2DefaultState(state.createdAt, now()),
  };
  const stores = { s2: s2Store, s3: s3Store };
  liftSeasons(state, docs);
  let lastSaveError = null;
  // «كمّلي» goes to a season when its document says she is there (`here`, written as she enters or leaves one of
  // its places) and the main save was not written after it (a write in the same millisecond is a tie: the marker
  // decides). A document without `here` (written before the marker existed) goes by the newer document alone.
  const resumesIn = (s) => {
    const d = docs[s];
    if (!d.location.scene || d.here === false) return false;
    const at = d.updatedAt ?? 0;
    const mainAt = state.updatedAt ?? 0;
    return d.here === true ? at >= mainAt : at > mainAt;
  };
  // (two seasons can only both qualify in hand-edited data: the newer document wins)
  const resumeSeason = () => SEASONS.filter(resumesIn).reduce((a, b) => (a && (docs[a].updatedAt ?? 0) >= (docs[b].updatedAt ?? 0) ? a : b), null);
  let here = resumeSeason(); // the season whose place she is in (play time and location go to its document), or null
  const dirty = { main: false, s2: false, s3: false }; // a change not written yet (play time, or a write that failed)

  /** Write one document: 'main', 's2' or 's3'. */
  function commitDoc(key, kind, detail) {
    let res;
    if (key === 'main') {
      state.updatedAt = now();
      res = saveManager?.save(state) ?? { ok: true };
    } else {
      docs[key].updatedAt = now();
      res = stores[key]?.save(docs[key]) ?? { ok: true };
    }
    dirty[key] = !res.ok;
    if (!res.ok && res.error !== lastSaveError) bus?.emit('save-error', res.error);
    lastSaveError = res.ok ? null : res.error;
    // `doc` says which save changed: after a season's change the app syncs only that season's missions, so the
    // original campaign's bookkeeping is never written because of a season
    bus?.emit('change', { kind, doc: key, ...detail });
    return res;
  }
  const docOf = (id) => {
    const s = seasonOf(id);
    return s ? docs[s] : state;
  };
  const commit = (id, kind, detail) => commitDoc(seasonOf(id) ?? 'main', kind, detail);

  const game = {
    /** The original campaign's save (the seasons' are `s2State` and `s3State`). */
    get state() {
      return state;
    },
    get s2State() {
      return docs.s2;
    },
    get s3State() {
      return docs.s3;
    },
    get lastSaveError() {
      return lastSaveError;
    },

    flag: (id) => docOf(id).flags[id],
    setFlag(id, value = true) {
      const d = docOf(id);
      if (d.flags[id] === value) return;
      if (value === false || value == null) delete d.flags[id];
      else d.flags[id] = value;
      commit(id, 'flag', { id, value });
    },
    setFlags(ids) {
      const changed = { main: false, s2: false, s3: false };
      for (const id of ids) {
        const d = docOf(id);
        if (!d.flags[id]) {
          d.flags[id] = true;
          changed[seasonOf(id) ?? 'main'] = true;
        }
      }
      if (changed.main) commitDoc('main', 'flag', { ids });
      for (const s of SEASONS) if (changed[s]) commitDoc(s, 'flag', { ids });
    },

    hasItem: (id, n = 1) => (state.inventory[id] || 0) >= n,
    itemCount: (id) => state.inventory[id] || 0,
    addItem(id, n = 1) {
      state.inventory[id] = (state.inventory[id] || 0) + n;
      commitDoc('main', 'item', { id, n });
    },
    /** @returns {boolean} false (and no change) when there are not enough. */
    removeItem(id, n = 1) {
      if ((state.inventory[id] || 0) < n) return false;
      state.inventory[id] -= n;
      if (!state.inventory[id]) delete state.inventory[id];
      commitDoc('main', 'item', { id, n: -n });
      return true;
    },

    has: (id) => docOf(id).collected.includes(id),
    /** @returns {boolean} true only the first time */
    collect(id) {
      const d = docOf(id);
      if (d.collected.includes(id)) return false;
      d.collected.push(id);
      commit(id, 'collect', { id, group: groupOf(id) });
      return true;
    },
    countGroup: (group) => docOf(group).collected.filter((id) => groupOf(id) === group).length,

    seen: (id) => docOf(id).seen.includes(id),
    markSeen(id) {
      const d = docOf(id);
      if (d.seen.includes(id)) return;
      d.seen.push(id);
      commit(id, 'seen', { id });
    },

    inJournal: (id) => docOf(id).journal.includes(id),
    addJournal(id) {
      const d = docOf(id);
      if (d.journal.includes(id)) return false;
      d.journal.push(id);
      commit(id, 'journal', { id });
      return true;
    },
    /** Every journal entry, the original campaign's first, then each season's. */
    journalIds: () => [...state.journal, ...docs.s2.journal, ...docs.s3.journal],

    isUnlocked: (id) => state.unlocks.includes(id),
    unlock(id) {
      if (state.unlocks.includes(id)) return false;
      state.unlocks.push(id);
      commitDoc('main', 'unlock', { id });
      return true;
    },
    setCosmetic(slot, value) {
      if (!(slot in state.cosmetics) || state.cosmetics[slot] === value) return;
      state.cosmetics[slot] = value;
      commitDoc('main', 'cosmetic', { slot, value });
    },

    record: (id) => docOf(id).records[id] ?? null,
    /**
     * Store a minigame or puzzle result; keeps the best score and best medal.
     * @param {{ completed?: boolean, score?: number, medal?: string, lowerIsBetter?: boolean }} r
     * @returns {{ newBest: boolean, firstClear: boolean }}
     */
    recordResult(id, { completed = false, score, medal = null, lowerIsBetter = false } = {}) {
      const d = docOf(id);
      const prev = d.records[id] ?? { plays: 0, best: null, medal: null, completed: false };
      const better =
        Number.isFinite(score) && (prev.best == null || (lowerIsBetter ? score < prev.best : score > prev.best));
      const next = {
        plays: prev.plays + 1,
        best: completed && better ? score : prev.best,
        medal: (MEDAL_RANK[medal] || 0) > (MEDAL_RANK[prev.medal] || 0) ? medal : prev.medal,
        completed: prev.completed || completed,
      };
      d.records[id] = next;
      commit(id, 'record', { id });
      return { newBest: completed && better && prev.best != null, firstClear: completed && !prev.completed };
    },

    memory: (id) => state.memories[id] ?? { solved: false, attempts: 0 },
    markMemory(id, solved) {
      const m = state.memories[id] ?? { solved: false, attempts: 0 };
      state.memories[id] = { solved: m.solved || solved, attempts: m.attempts + 1 };
      commitDoc('main', 'memory', { id, solved });
    },

    setGarden(placed) {
      state.garden = placed.map(({ id, cell }) => ({ id, cell }));
      commitDoc('main', 'garden', {});
    },

    /** Index of the next line of a dialogue pool; rotates so lines rarely repeat. */
    nextLine(key, size) {
      if (!size) return 0;
      const s = seasonOf(key);
      const lines = s ? docs[s].lines : state.hub.lines;
      const i = (lines[key] ?? 0) % size;
      lines[key] = (i + 1) % size;
      commit(key, 'hub', { key });
      return i;
    },
    /** Save a gift made in the gift workshop (bounded list). */
    addGift(gift) {
      if (state.hub.gifts.length >= MAX_GIFTS) return false;
      state.hub.gifts.push({ ...gift });
      commitDoc('main', 'gift', {});
      return true;
    },
    setDaily(day) {
      state.hub.daily = day;
      commitDoc('main', 'hub', { daily: day });
    },

    setLocation(scene, x = null) {
      const loc = { scene, x: Number.isFinite(x) ? Math.round(x) : null };
      const from = here;
      const to = seasonOf(scene);
      here = to;
      const doc = to ? docs[to] : state;
      const moved = doc.location?.scene !== loc.scene || doc.location?.x !== loc.x;
      doc.location = loc;
      // the world re-saves her spot every few seconds and as she leaves: only a real move is written; an
      // unchanged spot is still announced (missions and the objective follow it, as before) but not rewritten
      const unchanged = (key) => bus?.emit('change', { kind: 'location', doc: key, scene });
      // leaving a season (for the original campaign or another season) is written to its own document, never as
      // an empty main-save write
      if (from && from !== to) {
        docs[from].here = false;
        commitDoc(from, 'location', { scene });
      }
      if (to) {
        if (moved || docs[to].here !== true) {
          docs[to].here = true;
          commitDoc(to, 'location', { scene });
        } else unchanged(to);
        return;
      }
      if (moved) commitDoc('main', 'location', { scene });
      else unchanged('main');
    },
    /** Where she is now (the season place she is in, or her place in the original campaign). */
    location: () => (here ? docs[here].location : state.location),
    /** Where «كمّلي» resumes: her season place while she is there (see `resumesIn`), else the original one. */
    resumeLocation: () => {
      const s = resumeSeason();
      return s ? docs[s].location : state.location;
    },
    addPlayTime(ms) {
      if (!(ms > 0)) return;
      // saved with the next change; not worth a write of its own
      if (here) {
        docs[here].playMs += ms;
        dirty[here] = true;
      } else {
        state.playMs += ms;
        dirty.main = true;
      }
    },

    /** Replace the whole state (new game / imported backup); each season follows the playthrough. */
    replace(next, { s2: s2Next = null, s3: s3Next = null } = {}) {
      const samePlaythrough = next.createdAt === state.createdAt;
      state = next;
      here = null;
      for (const [s, incoming] of [['s2', s2Next], ['s3', s3Next]]) {
        if (!incoming && samePlaythrough) {
          // the same playthrough (an older tab's overwrite taken back, a backup of this game without this season's
          // section): its progress stays
        } else if (incoming) {
          stores[s]?.rebind(next.createdAt);
          docs[s] = normalizeS2(incoming, next.createdAt, now());
          docs[s].owner = next.createdAt;
          commitDoc(s, 'replace', {});
        } else {
          docs[s] = stores[s] ? stores[s].rebind(next.createdAt) : s2DefaultState(next.createdAt, now());
        }
      }
      return commitDoc('main', 'replace', {});
    },
    /** Write what is not written yet (the tab is hiding). A save with nothing new is not rewritten. */
    save() {
      let res = { ok: true };
      for (const s of SEASONS) if (dirty[s]) res = commitDoc(s, 'save', {});
      if (dirty.main) res = commitDoc('main', 'save', {});
      return res;
    },
  };
  return game;
}
