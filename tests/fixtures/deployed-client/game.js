/**
 * Game state: the single source of truth for progress. Rendering never owns
 * progress; scenes read from here and change it only through these methods.
 * Every change is saved immediately (saves are tiny and synchronous) and
 * announced on the bus as 'change'.
 *
 * Collectible ids are dotted, the first segment is their group:
 *   'star.garden.1', 'note.ryan.3', 'seed.blue.2' …
 */
import { defaultState, MAX_GIFTS } from './save.js';

const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 };

export const groupOf = (id) => String(id).split('.')[0];

export function createGame({ saveManager, bus, initial, now = () => Date.now() }) {
  let state = initial ?? defaultState(now());
  let lastSaveError = null;

  function commit(kind, detail) {
    state.updatedAt = now();
    const res = saveManager?.save(state) ?? { ok: true };
    if (!res.ok && res.error !== lastSaveError) bus?.emit('save-error', res.error);
    lastSaveError = res.ok ? null : res.error;
    bus?.emit('change', { kind, ...detail });
    return res;
  }

  const game = {
    get state() {
      return state;
    },
    get lastSaveError() {
      return lastSaveError;
    },

    flag: (id) => state.flags[id],
    setFlag(id, value = true) {
      if (state.flags[id] === value) return;
      if (value === false || value == null) delete state.flags[id];
      else state.flags[id] = value;
      commit('flag', { id, value });
    },
    setFlags(ids) {
      let changed = false;
      for (const id of ids) {
        if (!state.flags[id]) {
          state.flags[id] = true;
          changed = true;
        }
      }
      if (changed) commit('flag', { ids });
    },

    hasItem: (id, n = 1) => (state.inventory[id] || 0) >= n,
    itemCount: (id) => state.inventory[id] || 0,
    addItem(id, n = 1) {
      state.inventory[id] = (state.inventory[id] || 0) + n;
      commit('item', { id, n });
    },
    /** @returns {boolean} false (and no change) when there are not enough. */
    removeItem(id, n = 1) {
      if ((state.inventory[id] || 0) < n) return false;
      state.inventory[id] -= n;
      if (!state.inventory[id]) delete state.inventory[id];
      commit('item', { id, n: -n });
      return true;
    },

    has: (id) => state.collected.includes(id),
    /** @returns {boolean} true only the first time */
    collect(id) {
      if (state.collected.includes(id)) return false;
      state.collected.push(id);
      commit('collect', { id, group: groupOf(id) });
      return true;
    },
    countGroup: (group) => state.collected.filter((id) => groupOf(id) === group).length,

    seen: (id) => state.seen.includes(id),
    markSeen(id) {
      if (state.seen.includes(id)) return;
      state.seen.push(id);
      commit('seen', { id });
    },

    inJournal: (id) => state.journal.includes(id),
    addJournal(id) {
      if (state.journal.includes(id)) return false;
      state.journal.push(id);
      commit('journal', { id });
      return true;
    },

    isUnlocked: (id) => state.unlocks.includes(id),
    unlock(id) {
      if (state.unlocks.includes(id)) return false;
      state.unlocks.push(id);
      commit('unlock', { id });
      return true;
    },
    setCosmetic(slot, value) {
      if (!(slot in state.cosmetics) || state.cosmetics[slot] === value) return;
      state.cosmetics[slot] = value;
      commit('cosmetic', { slot, value });
    },

    record: (id) => state.records[id] ?? null,
    /**
     * Store a minigame or puzzle result; keeps the best score and best medal.
     * @param {{ completed?: boolean, score?: number, medal?: string, lowerIsBetter?: boolean }} r
     * @returns {{ newBest: boolean, firstClear: boolean }}
     */
    recordResult(id, { completed = false, score, medal = null, lowerIsBetter = false } = {}) {
      const prev = state.records[id] ?? { plays: 0, best: null, medal: null, completed: false };
      const better =
        Number.isFinite(score) && (prev.best == null || (lowerIsBetter ? score < prev.best : score > prev.best));
      const next = {
        plays: prev.plays + 1,
        best: completed && better ? score : prev.best,
        medal: (MEDAL_RANK[medal] || 0) > (MEDAL_RANK[prev.medal] || 0) ? medal : prev.medal,
        completed: prev.completed || completed,
      };
      state.records[id] = next;
      commit('record', { id });
      return { newBest: completed && better && prev.best != null, firstClear: completed && !prev.completed };
    },

    memory: (id) => state.memories[id] ?? { solved: false, attempts: 0 },
    markMemory(id, solved) {
      const m = state.memories[id] ?? { solved: false, attempts: 0 };
      state.memories[id] = { solved: m.solved || solved, attempts: m.attempts + 1 };
      commit('memory', { id, solved });
    },

    setGarden(placed) {
      state.garden = placed.map(({ id, cell }) => ({ id, cell }));
      commit('garden', {});
    },

    /** Index of the next line of a dialogue pool; rotates so lines rarely repeat. */
    nextLine(key, size) {
      if (!size) return 0;
      const i = (state.hub.lines[key] ?? 0) % size;
      state.hub.lines[key] = (i + 1) % size;
      commit('hub', { key });
      return i;
    },
    /** Save a gift made in the gift workshop (bounded list). */
    addGift(gift) {
      if (state.hub.gifts.length >= MAX_GIFTS) return false;
      state.hub.gifts.push({ ...gift });
      commit('gift', {});
      return true;
    },
    setDaily(day) {
      state.hub.daily = day;
      commit('hub', { daily: day });
    },

    setLocation(scene, x = null) {
      state.location = { scene, x: Number.isFinite(x) ? Math.round(x) : null };
      commit('location', { scene });
    },
    addPlayTime(ms) {
      if (ms > 0) state.playMs += ms; // saved with the next change; not worth a write of its own
    },

    /** Replace the whole state (new game / imported backup). */
    replace(next) {
      state = next;
      return commit('replace', {});
    },
    save: () => commit('save', {}),
  };
  return game;
}
