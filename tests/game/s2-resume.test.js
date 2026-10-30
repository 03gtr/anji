/**
 * Regressions found in the M1 production preview (2026-10-30).
 *
 * D1 — a session that ended on the title screen (the app opened, the phone locked before «كمّلي») made the
 *      next «كمّلي» resume in the original game instead of the Season 2 place she had left.
 * D2 — the main save was rewritten with nothing changed (only `rev` and `updatedAt`): every time the world
 *      re-saved her unchanged spot, and on every tab hide outside Season 2.
 * D3 — the Season 2 notice appeared under the next-objective card (same place on screen) instead of
 *      waiting for it to be dismissed.
 *
 * Each session below is built the way the app builds one: a fresh load of the same storage.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, S2_KEY } from '../../src/game/core/s2-store.js';
import { dueNotice, showContentNotice } from '../../src/game/ui/content-notice.js';
import { memoryStorage } from '../helpers.js';

const T0 = 1_800_000_000_000;
const MAIN_KEYS = ['', ':backup', ':shadow'].map((k) => SAVE_KEY + k);

/** A finished playthrough whose last original place is the finale at x 900. */
function freshStorage() {
  const storage = memoryStorage();
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج' };
  main.location = { scene: 'final', x: 900 };
  storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
  return storage;
}
/** One app session: load both documents from storage (the clock moves on, like a real day). */
function session(storage, clock) {
  const now = () => (clock.t += 1000);
  const saveManager = createSaveManager({ storage, now });
  const loaded = saveManager.load();
  const s2Store = createS2Store({ storage, now });
  const game = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now });
  return game;
}
const mainSnapshot = (storage) => MAIN_KEYS.map((k) => storage.getItem(k));

describe('D1: «كمّلي» resumes where she was, however the last session ended', () => {
  it('REGRESSION: a session that ends on the title screen does not move the resume point out of Season 2', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    // session 1: she plays in Season 2, the tab hides there
    let g = session(storage, clock);
    g.setLocation('s2-archive', 140);
    g.addPlayTime(30000);
    g.save();
    expect(g.resumeLocation().scene).toBe('s2-archive');
    // session 2: the app opens on the title screen; she leaves without «كمّلي» (the phone locks)
    g = session(storage, clock);
    expect(g.resumeLocation()).toEqual({ scene: 's2-archive', x: 140 });
    expect(g.location().scene).toBe('s2-archive'); // the place the title screen (and its objective) refers to
    g.save();
    // session 3: «كمّلي» goes back to the archive
    g = session(storage, clock);
    expect(g.resumeLocation()).toEqual({ scene: 's2-archive', x: 140 });
  });

  it('several title-only sessions in a row still resume in Season 2', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    const g = session(storage, clock);
    g.setLocation('s2-tree', 300);
    g.save();
    for (let i = 0; i < 4; i++) session(storage, clock).save();
    expect(session(storage, clock).resumeLocation()).toEqual({ scene: 's2-tree', x: 300 });
  });

  it('after leaving Season 2 for an original place — even the very spot she had there — she resumes in the original game', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    let g = session(storage, clock);
    g.setLocation('s2-archive', 140);
    g.setLocation('final', 900); // back to the finale, exactly where her original save already says she is
    g.save();
    g = session(storage, clock);
    expect(g.resumeLocation()).toEqual({ scene: 'final', x: 900 });
    expect(g.location().scene).toBe('final');
    g.save(); // a title-only session
    expect(session(storage, clock).resumeLocation()).toEqual({ scene: 'final', x: 900 });
  });

  it('REGRESSION: both documents written in the same millisecond — the Season 2 marker decides, not the tie', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    const now = () => clock.t; // a stopped clock: every write gets the same updatedAt
    const saveManager = createSaveManager({ storage, now });
    const loaded = saveManager.load();
    const s2Store = createS2Store({ storage, now });
    const g = createGame({ saveManager, s2Store, initial: loaded.state, s2Initial: s2Store.load(loaded.state.createdAt).state, now });
    g.setFlag('husky-name', 'لولو'); // a main write…
    g.setLocation('s2-home', 600); // …and the Season 2 place, in the same millisecond
    expect(JSON.parse(storage.getItem(SAVE_KEY)).updatedAt).toBe(JSON.parse(storage.getItem(S2_KEY)).updatedAt);
    expect(session(storage, { t: T0 }).resumeLocation()).toEqual({ scene: 's2-home', x: 600 });
    g.setLocation('final', 900); // she leaves, still in the same millisecond
    expect(session(storage, { t: T0 }).resumeLocation()).toEqual({ scene: 'final', x: 900 });
  });

  it('a Season 2 document written before this fix (no marker) resumes as before: by which document is newer', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    const g = session(storage, clock);
    g.setLocation('s2-tree', 300);
    const doc = JSON.parse(storage.getItem(S2_KEY));
    delete doc.here;
    storage.setItem(S2_KEY, JSON.stringify(doc));
    expect(session(storage, clock).resumeLocation()).toEqual({ scene: 's2-tree', x: 300 });
  });

  it('a new game starts outside Season 2', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    let g = session(storage, clock);
    g.setLocation('s2-archive', 140);
    g = session(storage, clock);
    g.replace(defaultState(clock.t + 5));
    expect(g.location().scene).toBe(null);
    expect(g.resumeLocation().scene).toBe(null);
  });
});

describe('D2: the main save is written only when the original game changed', () => {
  it('REGRESSION: re-saving her unchanged spot leaves the main save byte-identical (rev and updatedAt too)', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    const g = session(storage, clock);
    g.setLocation('final', 900); // the world opens where she already is
    const before = mainSnapshot(storage);
    for (let i = 0; i < 5; i++) g.setLocation('final', 900); // the world's periodic and on-leave re-saves
    expect(mainSnapshot(storage)).toEqual(before);
  });

  it('REGRESSION: a tab hide with nothing new leaves the main save byte-identical, on the title screen and in the original game', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    let g = session(storage, clock);
    let before = mainSnapshot(storage);
    g.save(); // title screen
    expect(mainSnapshot(storage)).toEqual(before);
    g.setLocation('final', 900);
    before = mainSnapshot(storage);
    g.save(); // in the finale, nothing new
    g.save();
    expect(mainSnapshot(storage)).toEqual(before);
    g = session(storage, clock);
    before = mainSnapshot(storage);
    g.save();
    expect(mainSnapshot(storage)).toEqual(before);
  });

  it('REGRESSION: entering Season 2 from an original place, playing and hiding leaves the main save byte-identical', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    const g = session(storage, clock);
    g.setLocation('final', 900);
    const before = mainSnapshot(storage);
    g.setLocation('final', 900); // the finale saves her spot as she leaves
    g.setLocation('s2-archive', 140);
    g.addPlayTime(30000);
    g.setLocation('s2-archive', 140);
    g.save();
    g.setLocation('s2-tree', 200);
    g.save();
    expect(mainSnapshot(storage)).toEqual(before);
    expect(JSON.parse(storage.getItem(S2_KEY)).playMs).toBe(30000);
  });

  it('an unchanged spot is still announced (missions and the objective follow it) without a write', () => {
    const storage = freshStorage();
    const saveManager = createSaveManager({ storage, now: () => T0 + 1 });
    const bus = { emit: vi.fn() };
    const g = createGame({ saveManager, bus, initial: saveManager.load().state, now: () => T0 + 2 });
    const before = mainSnapshot(storage);
    g.setLocation('final', 900);
    expect(mainSnapshot(storage)).toEqual(before);
    expect(bus.emit).toHaveBeenCalledWith('change', { kind: 'location', doc: 'main', scene: 'final' });
  });

  it('real changes are still written: a new spot, play time in the original game, a scene change', () => {
    const storage = freshStorage();
    const clock = { t: T0 };
    const g = session(storage, clock);
    const read = () => JSON.parse(storage.getItem(SAVE_KEY));
    g.setLocation('final', 950);
    expect(read().location).toEqual({ scene: 'final', x: 950 });
    g.addPlayTime(30000);
    g.save();
    expect(read().playMs).toBe(30000);
    g.setLocation('garden', 950);
    expect(read().location).toEqual({ scene: 'garden', x: 950 });
  });

  it('a write that failed is tried again when the tab hides', () => {
    const results = [{ ok: false, error: 'quota' }, { ok: true }];
    const saveManager = { save: vi.fn(() => results.shift() ?? { ok: true }) };
    const g = createGame({ saveManager, initial: defaultState(T0) });
    g.addItem('seed');
    expect(saveManager.save).toHaveBeenCalledTimes(1);
    g.save();
    expect(saveManager.save).toHaveBeenCalledTimes(2);
    g.save(); // written now: nothing more
    expect(saveManager.save).toHaveBeenCalledTimes(2);
  });
});

describe('D3: the Season 2 notice waits for the next-objective card', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  function noticeApp() {
    const game = createGame({ saveManager: null });
    for (const f of ['notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team', 'game-complete']) game.setFlag(f);
    const scope = {
      on: (el, ev, fn) => el.addEventListener(ev, fn),
      interval: (fn, ms) => setInterval(fn, ms),
    };
    return { game, scope, overlays: { count: 0 }, audio: { play() {} }, go: vi.fn() };
  }

  it('REGRESSION: while the card is up the notice is not shown; once «تمام» removes it, the notice appears', () => {
    vi.useFakeTimers();
    const app = noticeApp();
    expect(dueNotice(app.game, 'final')?.id).toBe('s2');
    const host = document.createElement('div');
    document.body.append(host);
    const guide = document.createElement('aside');
    guide.className = 'guide-card';
    host.append(guide);
    showContentNotice(app, 'final', host);
    expect(host.querySelector('.pack-notice')).toBeNull();
    vi.advanceTimersByTime(6000);
    expect(host.querySelector('.pack-notice')).toBeNull(); // still waiting under the card
    guide.remove(); // «تمام»
    vi.advanceTimersByTime(1500);
    const card = host.querySelector('.pack-notice');
    expect(card).not.toBeNull();
    card.querySelector('[data-go]').click();
    expect(app.go).toHaveBeenCalledWith('s2-archive', expect.anything());
  });

  it('with no card, the notice shows at once (unchanged)', () => {
    const app = noticeApp();
    const host = document.createElement('div');
    document.body.append(host);
    showContentNotice(app, 'final', host);
    expect(host.querySelector('.pack-notice')).not.toBeNull();
  });
});
