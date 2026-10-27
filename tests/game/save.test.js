import { describe, it, expect } from 'vitest';
import { createSaveManager, defaultState, normalize, migrate, SaveError, GAME_ID, SAVE_VERSION } from '../../src/game/core/save.js';
import { memoryStorage } from '../helpers.js';

const KEY = 'test:save';

describe('save manager', () => {
  it('starts a new game when nothing is saved', () => {
    const m = createSaveManager({ storage: memoryStorage(), key: KEY });
    const { state, status } = m.load();
    expect(status).toBe('new');
    expect(state).toEqual(defaultState(state.createdAt));
    expect(m.hasSave()).toBe(false);
  });

  it('saves and loads the same progress', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage, key: KEY });
    const s = defaultState(1);
    s.flags['met-snooki'] = true;
    s.inventory['map-1'] = 1;
    s.collected.push('star.garden.1');
    s.records['game:maze'] = { plays: 2, best: 44, medal: 'gold', completed: true };
    expect(m.save(s).ok).toBe(true);
    const { state, status } = createSaveManager({ storage, key: KEY }).load();
    expect(status).toBe('loaded');
    expect(state.flags['met-snooki']).toBe(true);
    expect(state.inventory).toEqual({ 'map-1': 1 });
    expect(state.collected).toEqual(['star.garden.1']);
    expect(state.records['game:maze']).toEqual({ plays: 2, best: 44, medal: 'gold', completed: true });
  });

  it('recovers from a corrupted save using the automatic backup', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage, key: KEY });
    const s1 = defaultState(1);
    s1.flags.first = true;
    m.save(s1);
    const s2 = { ...s1, flags: { first: true, second: true } };
    m.save(s2); // backup now holds s1
    storage.setItem(KEY, '{"broken":'); // corrupt the primary save
    const { state, status } = m.load();
    expect(status).toBe('recovered');
    expect(state.flags.first).toBe(true);
    expect(storage.getItem(`${KEY}:broken`)).toBe('{"broken":'); // kept for inspection
  });

  it('resets safely when both saves are unreadable', () => {
    const storage = memoryStorage({ [KEY]: 'nope', [`${KEY}:backup`]: 'also nope' });
    const { status, state } = createSaveManager({ storage, key: KEY }).load();
    expect(status).toBe('reset');
    expect(state.flags).toEqual({});
  });

  it('never backs up a corrupted save over a good backup', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage, key: KEY });
    const good = defaultState(1);
    good.flags.good = true;
    m.save(good);
    m.save(good); // backup = good
    storage.setItem(KEY, 'garbage');
    m.save(defaultState(2)); // must not copy "garbage" into the backup
    expect(JSON.parse(storage.getItem(`${KEY}:backup`)).flags.good).toBe(true);
  });

  it('reports quota errors instead of throwing', () => {
    const storage = {
      getItem: () => null,
      setItem() {
        const e = new Error('full');
        e.name = 'QuotaExceededError';
        throw e;
      },
      removeItem() {},
    };
    expect(createSaveManager({ storage, key: KEY }).save(defaultState())).toEqual({ ok: false, error: 'quota' });
  });

  it('works (without persistence) when storage is unavailable', () => {
    const m = createSaveManager({ storage: null, key: KEY });
    expect(m.save(defaultState()).ok === false || m.available).toBe(true);
  });

  it('exports and imports a backup file round-trip', () => {
    const m = createSaveManager({ storage: memoryStorage(), key: KEY, now: () => 5 });
    const s = defaultState(5);
    s.flags.x = true;
    s.cosmetics.anjiOutfit = 'racer';
    const text = m.exportText(s);
    expect(JSON.parse(text).game).toBe(GAME_ID);
    const back = m.importText(text);
    expect(back.flags.x).toBe(true);
    expect(back.cosmetics.anjiOutfit).toBe('racer');
  });

  it('rejects files that are not backups of this game', () => {
    const m = createSaveManager({ storage: memoryStorage(), key: KEY });
    expect(() => m.importText('not json')).toThrow(SaveError);
    expect(() => m.importText(JSON.stringify({ game: 'other', save: {} }))).toThrow(/not a backup/);
  });

  it('clears every save key', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage, key: KEY });
    m.save(defaultState());
    m.save(defaultState());
    m.clear();
    expect(storage.dump()).toEqual({});
  });
});

describe('migrations', () => {
  it('upgrades old saves step by step', () => {
    const migrations = {
      0: (s) => ({ ...s, inventory: Object.fromEntries((s.items || []).map((i) => [i, 1])) }),
      1: (s) => ({ ...s, flags: { ...s.flags, migrated: true } }),
    };
    const out = migrate({ items: ['map-1'], flags: {} }, { version: 2, migrations });
    expect(out.v).toBe(2);
    expect(out.inventory).toEqual({ 'map-1': 1 });
    expect(out.flags.migrated).toBe(true);
  });

  it('a manager loads an old save through its migrations', () => {
    const storage = memoryStorage({ [KEY]: JSON.stringify({ v: 0, items: ['map-1'] }) });
    const m = createSaveManager({ storage, key: KEY, version: 1, migrations: { 0: (s) => ({ ...s, inventory: { [s.items[0]]: 1 } }) } });
    const { state, status } = m.load();
    expect(status).toBe('loaded');
    expect(state.inventory).toEqual({ 'map-1': 1 });
  });

  it('refuses saves from a newer version of the game', () => {
    expect(() => migrate({ v: SAVE_VERSION + 1 })).toThrow(/newer/);
  });

  it('fails clearly when a migration step is missing', () => {
    expect(() => migrate({ v: 0 }, { version: 2, migrations: {} })).toThrow(/No migration/);
  });
});

describe('normalize', () => {
  it('drops invalid values and fills defaults', () => {
    const s = normalize({
      flags: { ok: true, bad: { nested: 1 } },
      inventory: { a: 2, b: -1, c: 1.5 },
      collected: ['x', 'x', 3, 'y'],
      records: { g: { plays: 'many', medal: 'platinum', best: 3, completed: true } },
      cosmetics: { anjiOutfit: 'racer', unknownSlot: 'x' },
      garden: [{ id: 'rose', cell: 3 }, { id: 5 }],
    });
    expect(s.flags).toEqual({ ok: true });
    expect(s.inventory).toEqual({ a: 2 });
    expect(s.collected).toEqual(['x', 'y']);
    expect(s.records.g).toEqual({ plays: 0, best: 3, medal: null, completed: true });
    expect(s.cosmetics.anjiOutfit).toBe('racer');
    expect(s.cosmetics).not.toHaveProperty('unknownSlot');
    expect(s.garden).toEqual([{ id: 'rose', cell: 3 }]);
  });
});
