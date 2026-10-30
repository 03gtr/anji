/**
 * Game state: the single source of truth for progress. Rendering never owns
 * progress; scenes read from here and change it only through these methods.
 * Every change is saved immediately (saves are tiny and synchronous) and
 * announced on the bus as 'change'.
 *
 * Collectible ids are dotted, the first segment is their group:
 *   'star.garden.1', 'note.ryan.3', 'seed.blue.2' …
 *
 * Two documents (Season 2, docs/season-2/SEASON_2_TECHNICAL_PLAN.md §1): the original campaign's save
 * (`state`) and Season 2's own (`s2`, core/s2-store.js). Every id is routed by `isS2`: Season 2's ids
 * start with an `s2` segment (`s2:board`, `mission:s2-01`, `s2.ev.e-wax`, `dlg:s2.01-enter`, a scene
 * `s2-archive` → `visited:s2-archive`, `t.s2-archive.enter`…). Season 2 never writes the main save.
 */
import { defaultState, MAX_GIFTS } from './save.js';
import { s2DefaultState, normalizeS2 } from './s2-store.js';

const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 };

export const groupOf = (id) => String(id).split('.')[0];

/** True for a Season 2 id: an `s2` segment at the start or after `:` / `.`, followed by `-` `:` `.` or the end. */
export const isS2 = (id) => /(^|[:.])s2([-:.]|$)/.test(String(id));

/**
 * Season 2 ids never live in the main save. A main state that carries some (a test fixture, a
 * developer link) hands them to Season 2's document — in memory; nothing is written here.
 */
function liftS2(main, s2) {
  for (const [k, v] of Object.entries(main.flags ?? {})) {
    if (!isS2(k)) continue;
    if (!(k in s2.flags)) s2.flags[k] = v;
    delete main.flags[k];
  }
  for (const list of ['collected', 'seen', 'journal']) {
    const mine = (main[list] ?? []).filter(isS2);
    if (!mine.length) continue;
    main[list] = main[list].filter((x) => !isS2(x));
    for (const x of mine) if (!s2[list].includes(x)) s2[list].push(x);
  }
  for (const [k, r] of Object.entries(main.records ?? {})) {
    if (!isS2(k)) continue;
    if (!(k in s2.records)) s2.records[k] = r;
    delete main.records[k];
  }
}

export function createGame({ saveManager, s2Store = null, bus, initial, s2Initial, now = () => Date.now() }) {
  let state = initial ?? defaultState(now());
  let s2 = s2Initial ?? s2DefaultState(state.createdAt, now());
  liftS2(state, s2);
  let lastSaveError = null;
  // «كمّلي» goes to Season 2 when its document says she is there (`here`, written as she enters or leaves a
  // Season 2 place) and it was written after the main save. A document without `here` (written before the
  // marker existed) goes by the newer document alone.
  const resumesInS2 = () => Boolean(s2.location.scene) && s2.here !== false && (s2.updatedAt ?? 0) > (state.updatedAt ?? 0);
  let inS2 = resumesInS2(); // she is in a Season 2 place (play time and location go to its document)
  let mainDirty = false; // a change not written yet (play time, or a write that failed)
  let s2Dirty = false;

  function commitDoc(toS2, kind, detail) {
    let res;
    if (toS2) {
      s2.updatedAt = now();
      res = s2Store?.save(s2) ?? { ok: true };
      s2Dirty = !res.ok;
    } else {
      state.updatedAt = now();
      res = saveManager?.save(state) ?? { ok: true };
      mainDirty = !res.ok;
    }
    if (!res.ok && res.error !== lastSaveError) bus?.emit('save-error', res.error);
    lastSaveError = res.ok ? null : res.error;
    // `doc` says which save changed: after a Season 2 change the app syncs only Season 2's missions,
    // so the original campaign's bookkeeping is never written because of Season 2
    bus?.emit('change', { kind, doc: toS2 ? 's2' : 'main', ...detail });
    return res;
  }
  const docOf = (id) => (isS2(id) ? s2 : state);
  const commit = (id, kind, detail) => commitDoc(isS2(id), kind, detail);

  const game = {
    /** The original campaign's save (Season 2's is `s2State`). */
    get state() {
      return state;
    },
    get s2State() {
      return s2;
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
      const changed = { main: false, s2: false };
      for (const id of ids) {
        const d = docOf(id);
        if (!d.flags[id]) {
          d.flags[id] = true;
          changed[isS2(id) ? 's2' : 'main'] = true;
        }
      }
      if (changed.main) commitDoc(false, 'flag', { ids });
      if (changed.s2) commitDoc(true, 'flag', { ids });
    },

    hasItem: (id, n = 1) => (state.inventory[id] || 0) >= n,
    itemCount: (id) => state.inventory[id] || 0,
    addItem(id, n = 1) {
      state.inventory[id] = (state.inventory[id] || 0) + n;
      commitDoc(false, 'item', { id, n });
    },
    /** @returns {boolean} false (and no change) when there are not enough. */
    removeItem(id, n = 1) {
      if ((state.inventory[id] || 0) < n) return false;
      state.inventory[id] -= n;
      if (!state.inventory[id]) delete state.inventory[id];
      commitDoc(false, 'item', { id, n: -n });
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
    /** Every journal entry, the original campaign's first. */
    journalIds: () => [...state.journal, ...s2.journal],

    isUnlocked: (id) => state.unlocks.includes(id),
    unlock(id) {
      if (state.unlocks.includes(id)) return false;
      state.unlocks.push(id);
      commitDoc(false, 'unlock', { id });
      return true;
    },
    setCosmetic(slot, value) {
      if (!(slot in state.cosmetics) || state.cosmetics[slot] === value) return;
      state.cosmetics[slot] = value;
      commitDoc(false, 'cosmetic', { slot, value });
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
      commitDoc(false, 'memory', { id, solved });
    },

    setGarden(placed) {
      state.garden = placed.map(({ id, cell }) => ({ id, cell }));
      commitDoc(false, 'garden', {});
    },

    /** Index of the next line of a dialogue pool; rotates so lines rarely repeat. */
    nextLine(key, size) {
      if (!size) return 0;
      const lines = isS2(key) ? s2.lines : state.hub.lines;
      const i = (lines[key] ?? 0) % size;
      lines[key] = (i + 1) % size;
      commit(key, 'hub', { key });
      return i;
    },
    /** Save a gift made in the gift workshop (bounded list). */
    addGift(gift) {
      if (state.hub.gifts.length >= MAX_GIFTS) return false;
      state.hub.gifts.push({ ...gift });
      commitDoc(false, 'gift', {});
      return true;
    },
    setDaily(day) {
      state.hub.daily = day;
      commitDoc(false, 'hub', { daily: day });
    },

    setLocation(scene, x = null) {
      const loc = { scene, x: Number.isFinite(x) ? Math.round(x) : null };
      const left = inS2 && !isS2(scene);
      inS2 = isS2(scene);
      const doc = inS2 ? s2 : state;
      const moved = doc.location?.scene !== loc.scene || doc.location?.x !== loc.x;
      doc.location = loc;
      // the world re-saves her spot every few seconds and as she leaves: only a real move is written; an
      // unchanged spot is still announced (missions and the objective follow it, as before) but not rewritten
      const unchanged = (toS2) => bus?.emit('change', { kind: 'location', doc: toS2 ? 's2' : 'main', scene });
      if (inS2) {
        if (moved || s2.here !== true) {
          s2.here = true;
          commitDoc(true, 'location', { scene });
        } else unchanged(true);
        return;
      }
      // leaving Season 2 is written to its own document, never as an empty main-save write
      if (left) {
        s2.here = false;
        commitDoc(true, 'location', { scene });
      }
      if (moved) commitDoc(false, 'location', { scene });
      else unchanged(false);
    },
    /** Where she is now (the Season 2 place she is in, or her place in the original campaign). */
    location: () => (inS2 ? s2.location : state.location),
    /** Where «كمّلي» resumes: her Season 2 place while she is there (see `resumesInS2`), else the original one. */
    resumeLocation: () => (resumesInS2() ? s2.location : state.location),
    addPlayTime(ms) {
      if (!(ms > 0)) return;
      // saved with the next change; not worth a write of its own
      if (inS2) {
        s2.playMs += ms;
        s2Dirty = true;
      } else {
        state.playMs += ms;
        mainDirty = true;
      }
    },

    /** Replace the whole state (new game / imported backup); Season 2 follows the playthrough. */
    replace(next, { s2: s2Next = null } = {}) {
      const samePlaythrough = next.createdAt === state.createdAt;
      state = next;
      inS2 = false;
      if (!s2Next && samePlaythrough) {
        // the same playthrough (an older tab's overwrite taken back, a backup of this game without a
        // Season 2 section): its Season 2 progress stays
      } else if (s2Next) {
        s2Store?.rebind(next.createdAt);
        s2 = normalizeS2(s2Next, next.createdAt, now());
        s2.owner = next.createdAt;
        commitDoc(true, 'replace', {});
      } else {
        s2 = s2Store ? s2Store.rebind(next.createdAt) : s2DefaultState(next.createdAt, now());
      }
      return commitDoc(false, 'replace', {});
    },
    /** Write what is not written yet (the tab is hiding). A save with nothing new is not rewritten. */
    save() {
      let res = { ok: true };
      if (s2Dirty) res = commitDoc(true, 'save', {});
      if (mainDirty) res = commitDoc(false, 'save', {});
      return res;
    },
  };
  return game;
}
