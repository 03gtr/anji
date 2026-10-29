/**
 * Season 2 save compatibility, baseline: how the DEPLOYED client (frozen copy of the save
 * code every released build runs, see tests/fixtures/deployed-client) treats save data a
 * newer build writes. These tests characterise behaviour we cannot change retroactively;
 * the Season 2 storage design (docs/season-2/SEASON_2_TECHNICAL_PLAN.md §2) is built on them.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createSaveManager, defaultState, SAVE_KEY } from '../fixtures/deployed-client/save.js';
import { createGame } from '../fixtures/deployed-client/game.js';

const S2_KEY = 'snooki-game:s2'; // the planned Season 2 store
const OWN_KEYS = [SAVE_KEY, `${SAVE_KEY}:backup`, `${SAVE_KEY}:broken`];

/** localStorage stand-in that records every key the code touches. */
function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  const touched = new Set();
  return {
    touched,
    map,
    getItem: (k) => (touched.add(k), map.has(k) ? map.get(k) : null),
    setItem: (k, v) => (touched.add(k), map.set(k, String(v))),
    removeItem: (k) => (touched.add(k), map.delete(k)),
    clear: () => {
      throw new Error('the deployed client must never clear all storage');
    },
    key: () => {
      throw new Error('the deployed client must never enumerate storage');
    },
    get length() {
      throw new Error('the deployed client must never enumerate storage');
    },
  };
}

const t0 = 1_800_000_000_000;
const finished = () => {
  const s = defaultState(t0);
  s.flags = { 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج', 'sp1-husky-met': true };
  s.collected = ['star.garden.1'];
  s.journal = ['ending-hope'];
  return s;
};
const s2doc = JSON.stringify({ v: 1, rev: 7, owner: t0, flags: { 's2:board': 2 }, collected: ['s2e.e-wax'] });
const tab = (storage) => {
  const saveManager = createSaveManager({ storage, now: () => t0 + 1000 });
  const loaded = saveManager.load();
  return { saveManager, loaded, game: createGame({ saveManager, initial: loaded.state, now: () => t0 + 2000 }) };
};

describe('frozen deployed client', () => {
  it('is the exact released save code (sha-256, LF)', () => {
    const sha = (f) => createHash('sha256').update(readFileSync(`tests/fixtures/deployed-client/${f}`, 'utf8').replace(/\r\n/g, '\n')).digest('hex');
    expect(sha('save.js')).toBe('cad1f0f1364ef2aec836111ff76c305a1780a91516a633d7df2ef8533b3a69e8');
    expect(sha('game.js')).toBe('64a8545a470850df4968a11bdaaeee236815ea1b7ed5f3dd1c1b7b8107a7bd2e');
  });
});

describe('a separate Season 2 key is out of the deployed client’s reach', () => {
  it('load / save / every commit / new game / import / export touch only its own three keys', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(finished()), [S2_KEY]: s2doc });
    const { saveManager, game } = tab(storage);
    game.setFlag('x');
    game.collect('star.garden.2');
    game.addJournal('j');
    game.addItem('rose');
    game.removeItem('rose');
    game.unlock('u');
    game.setCosmetic('cardBack', 'stars');
    game.recordResult('p', { completed: true, score: 3 });
    game.markMemory('m', true);
    game.setGarden([{ id: 'r', cell: 1 }]);
    game.nextLine('husky-ambient', 6);
    game.addGift({ wrap: 'a', ribbon: 'b', flower: 'c', note: 'd' });
    game.setDaily('2026-10-29');
    game.setLocation('final', 300);
    game.markSeen('dlg:x');
    const text = saveManager.exportText(game.state);
    game.replace(saveManager.importText(text));
    saveManager.clear(); // "new game" with wipe (app.js)
    game.replace(defaultState(t0 + 5000));
    expect([...storage.touched].sort()).toEqual([...OWN_KEYS].sort());
    expect(storage.map.get(S2_KEY)).toBe(s2doc);
  });

  it('corrupt-save recovery and reset paths also stay on its own keys', () => {
    for (const primary of ['{not json', JSON.stringify({ v: 99 })]) {
      const storage = memoryStorage({ [SAVE_KEY]: primary, [`${SAVE_KEY}:backup`]: '{bad', [S2_KEY]: s2doc });
      const { game } = tab(storage);
      game.setFlag('after-reset');
      expect([...storage.touched].every((k) => OWN_KEYS.includes(k))).toBe(true);
      expect(storage.map.get(S2_KEY)).toBe(s2doc);
    }
  });

  it('importing a newer export (with an s2 section) restores the main save and ignores s2 without failing', () => {
    const storage = memoryStorage();
    const { saveManager } = tab(storage);
    const text = JSON.stringify({ game: 'snooki-missing-creator', exportedAt: 'x', save: { ...finished(), v: 3 }, s2: JSON.parse(s2doc) });
    const state = saveManager.importText(text);
    expect(state.flags['game-complete']).toBe(true);
    expect(state.s2).toBeUndefined(); // documented limitation: an old build cannot restore Season 2 from a file
  });
});

describe('what the deployed client does to newer data in the MAIN save', () => {
  it('drops unknown top-level fields when it re-saves (so authoritative new data must not live there)', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: 3, rev: 12, s2: { board: 1 } }) });
    const { loaded, game } = tab(storage);
    expect(loaded.status).toBe('loaded');
    game.setLocation('final', 10);
    const after = JSON.parse(storage.map.get(SAVE_KEY));
    expect(after.rev).toBeUndefined();
    expect(after.s2).toBeUndefined();
    expect(after.flags['game-complete']).toBe(true);
  });

  it('keeps unknown string/number flags (they survive a re-save)', () => {
    const s = { ...finished(), v: 3 };
    s.flags['s2:dec:accuse'] = 'wait';
    s.flags['s2:rel:trust'] = 2;
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(s) });
    const { game } = tab(storage);
    game.setLocation('final', 10);
    const after = JSON.parse(storage.map.get(SAVE_KEY));
    expect(after.flags['s2:dec:accuse']).toBe('wait');
    expect(after.flags['s2:rel:trust']).toBe(2);
  });

  it('RESETS a save with a newer version number: progress survives only in :broken (why the main SAVE_VERSION is never bumped)', () => {
    const newer = JSON.stringify({ ...finished(), v: 4 });
    const storage = memoryStorage({ [SAVE_KEY]: newer, [`${SAVE_KEY}:backup`]: newer });
    const { loaded, game } = tab(storage);
    expect(loaded.status).toBe('reset');
    expect(loaded.error).toBe('future');
    expect(loaded.state.flags['game-complete']).toBeUndefined();
    game.setLocation('house', 1); // any change overwrites the primary with the empty game
    game.setLocation('house', 2); // … and the next one the backup
    expect(JSON.parse(storage.map.get(SAVE_KEY)).flags['game-complete']).toBeUndefined();
    expect(JSON.parse(storage.map.get(`${SAVE_KEY}:backup`)).flags['game-complete']).toBeUndefined();
    expect(storage.map.get(`${SAVE_KEY}:broken`)).toBe(newer);
  });

  it('a stale open tab overwrites progress another tab saved meanwhile (last writer wins)', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: 3 }), [S2_KEY]: s2doc });
    const stale = tab(storage); // opened before the update, still running
    const fresh = tab(storage);
    fresh.game.setFlag('dg-box'); // newer progress saved by the other tab
    expect(JSON.parse(storage.map.get(SAVE_KEY)).flags['dg-box']).toBe(true);
    stale.game.setLocation('final', 40); // e.g. the 8-second location save
    expect(JSON.parse(storage.map.get(SAVE_KEY)).flags['dg-box']).toBeUndefined(); // lost from the main save
    expect(JSON.parse(storage.map.get(`${SAVE_KEY}:backup`)).flags['dg-box']).toBe(true); // one write later it is in the backup…
    stale.game.setLocation('final', 41);
    expect(JSON.parse(storage.map.get(`${SAVE_KEY}:backup`)).flags['dg-box']).toBeUndefined(); // …and then gone
    expect(storage.map.get(S2_KEY)).toBe(s2doc); // Season 2 data in its own key is untouched throughout
  });
});
