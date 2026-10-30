/**
 * The MAIN save (core/save.js) against older tabs, newer saves and a second tab — the protections
 * Season 2 needs before it ships (docs/season-2/SEASON_2_TECHNICAL_PLAN.md §2).
 *
 * The released builds cannot be changed: an older tab still open writes over the main save (see
 * s2-compat-baseline). What the new build guarantees instead:
 *  - it marks every save it writes (`rev`) and mirrors it to `:shadow`, a key older builds never touch;
 *  - after an older build wrote last, the next load sees it (no `rev`) and, if progress was lost,
 *    offers it back — nothing is decided silently and both copies are kept;
 *  - a save from a NEWER build is never reset: it is read-only;
 *  - two tabs of the new build: the one that would overwrite the other's newer save does not.
 */
import { describe, it, expect } from 'vitest';
import { createSaveManager, defaultState, SAVE_KEY, SAVE_VERSION } from '../../src/game/core/save.js';
import { createSaveManager as createDeployed } from '../fixtures/deployed-client/save.js';
import { createGame as createDeployedGame } from '../fixtures/deployed-client/game.js';
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;
const finished = () => {
  const s = defaultState(T0);
  s.flags = { 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج' };
  s.journal = ['ending-hope'];
  return s;
};
const parse = (storage, k = SAVE_KEY) => JSON.parse(storage.getItem(k));

describe('the main save: marks, shadow and an older tab', () => {
  it('the new build marks each save (rev) and mirrors it to :shadow; an older build loads it normally', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage });
    m.load();
    expect(m.save(finished()).ok).toBe(true);
    expect(m.save(finished()).ok).toBe(true);
    expect(parse(storage).rev).toBe(2);
    expect(storage.getItem(`${SAVE_KEY}:shadow`)).toBe(storage.getItem(SAVE_KEY));
    const old = createDeployed({ storage }).load();
    expect(old.status).toBe('loaded');
    expect(old.state.flags['game-complete']).toBe(true);
    // the game state itself has no new field (rev lives in the file, not in the state)
    expect(createSaveManager({ storage }).load().state.rev).toBeUndefined();
  });

  it('after an older tab wrote over newer progress, the next load offers it back; both copies are kept', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: SAVE_VERSION }) });
    // an older tab, opened before the update, still running
    const oldTab = createDeployed({ storage, now: () => T0 + 1 });
    const oldGame = createDeployedGame({ saveManager: oldTab, initial: oldTab.load().state, now: () => T0 + 2 });
    // the updated tab plays on
    const m = createSaveManager({ storage });
    const s = m.load().state;
    s.flags['dg-box'] = true;
    s.journal.push('dg-night');
    s.collected.push('star.garden.9');
    expect(m.save(s).ok).toBe(true);
    // the older tab's next autosave writes its stale state over it
    oldGame.setLocation('final', 40);
    expect(parse(storage).flags['dg-box']).toBeUndefined();
    // next load (any new-build tab): detected, nothing decided yet
    const n = createSaveManager({ storage });
    const r = n.load();
    expect(r.status).toBe('overwritten');
    expect(r.lost).toEqual({ flags: ['dg-box'], journal: ['dg-night'], collected: ['star.garden.9'] });
    expect(r.alt.flags['dg-box']).toBe(true); // the newer progress, offered back
    expect(r.state.flags['dg-box']).toBeUndefined(); // what is in the main save now, shown until she chooses
    // «رجّعي الأحدث»
    const overwrittenText = storage.getItem(SAVE_KEY);
    expect(n.restore(r.alt).ok).toBe(true);
    expect(parse(storage).flags['dg-box']).toBe(true);
    expect(parse(storage).journal).toContain('dg-night');
    expect(storage.getItem(`${SAVE_KEY}:alt`)).toBe(overwrittenText); // the other copy is kept
  });

  it('…and «خليها» keeps what is in the main save, keeping the newer copy aside', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: SAVE_VERSION }) });
    const oldTab = createDeployed({ storage });
    const oldGame = createDeployedGame({ saveManager: oldTab, initial: oldTab.load().state });
    const m = createSaveManager({ storage });
    const s = m.load().state;
    s.flags['dg-box'] = true;
    m.save(s);
    const newerText = storage.getItem(SAVE_KEY);
    oldGame.setLocation('final', 40);
    const n = createSaveManager({ storage });
    const r = n.load();
    expect(r.status).toBe('overwritten');
    n.keep();
    expect(parse(storage).flags['dg-box']).toBeUndefined();
    expect(JSON.parse(storage.getItem(`${SAVE_KEY}:alt`)).flags['dg-box']).toBe(true);
    expect(storage.getItem(`${SAVE_KEY}:alt`)).toBe(newerText);
    expect(createSaveManager({ storage }).load().status).toBe('loaded'); // asked once
  });

  it('an older tab that only added progress (nothing lost) is simply loaded', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage });
    m.load();
    m.save(finished());
    const oldTab = createDeployed({ storage });
    const oldGame = createDeployedGame({ saveManager: oldTab, initial: oldTab.load().state });
    oldGame.setFlag('sp1-roads-seen');
    const r = createSaveManager({ storage }).load();
    expect(r.status).toBe('loaded');
    expect(r.state.flags['sp1-roads-seen']).toBe(true);
  });

  it('a different playthrough (an older build started a new game) is not offered back', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage });
    m.load();
    m.save(finished());
    const oldTab = createDeployed({ storage });
    oldTab.clear(); // «مغامرة جديدة» in an older build
    const oldGame = createDeployedGame({ saveManager: oldTab, initial: defaultState(T0 + 9999) });
    oldGame.setFlag('intro-done');
    expect(createSaveManager({ storage }).load().status).toBe('loaded');
  });

  it('a save from a NEWER build is read-only: never reset, never written (REGRESSION vs the released code)', () => {
    const newer = JSON.stringify({ ...finished(), v: SAVE_VERSION + 1, rev: 7 });
    const storage = memoryStorage({ [SAVE_KEY]: newer, [`${SAVE_KEY}:backup`]: newer });
    const m = createSaveManager({ storage });
    const r = m.load();
    expect(r.status).toBe('future');
    expect(m.readOnly).toBe(true);
    expect(m.save(defaultState()).ok).toBe(false);
    expect(m.save(defaultState()).error).toBe('readonly');
    expect(storage.getItem(SAVE_KEY)).toBe(newer);
    expect(storage.getItem(`${SAVE_KEY}:backup`)).toBe(newer);
    expect(storage.getItem(`${SAVE_KEY}:broken`)).toBeNull();
  });

  it('two tabs of the new build: the one behind does not overwrite the newer save', () => {
    const storage = memoryStorage();
    const a = createSaveManager({ storage });
    const b = createSaveManager({ storage });
    a.load();
    b.load();
    const sa = finished();
    sa.flags.fromA = true;
    expect(a.save(sa).ok).toBe(true);
    const sb = finished();
    sb.flags.fromB = true;
    expect(b.save(sb)).toEqual({ ok: false, error: 'other-tab' });
    expect(b.readOnly).toBe(true);
    expect(parse(storage).flags.fromA).toBe(true);
    expect(a.save(sa).ok).toBe(true);
  });

  it('a corrupt primary is still overwritten as before (it is not "another tab")', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage });
    m.load();
    m.save(finished());
    storage.setItem(SAVE_KEY, 'garbage');
    expect(m.save(finished()).ok).toBe(true);
  });

  it('clearing removes the shadow and the kept copy too', () => {
    const storage = memoryStorage();
    const m = createSaveManager({ storage });
    m.load();
    m.save(finished());
    storage.setItem(`${SAVE_KEY}:alt`, '{}');
    m.clear();
    expect(storage.dump()).toEqual({});
  });
});
