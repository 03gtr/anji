/**
 * The app around the two save documents: what a player sees when the protections act.
 *  - an older tab wrote over newer progress: asked once; «رجّعي الأحدث» brings it back, «خليها» keeps
 *    the save; both copies kept, Season 2 untouched either way;
 *  - a save from a newer build: a calm message, nothing written;
 *  - another tab wrote: a message with «أعيدي التحميل», nothing overwritten;
 *  - a backup file carries Season 2 and brings it back.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createSaveManager, defaultState, SAVE_KEY, SAVE_VERSION } from '../../src/game/core/save.js';
import { createSaveManager as createDeployed } from '../fixtures/deployed-client/save.js';
import { createGame as createDeployedGame } from '../fixtures/deployed-client/game.js';
import { S2_KEY } from '../../src/game/core/s2-store.js';
import { memoryStorage } from '../helpers.js';

let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}
const $ = (sel) => root.querySelector(sel);
const T0 = 1_800_000_000_000;
const finished = () => {
  const s = defaultState(T0);
  s.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج' };
  s.location = { scene: 'final', x: 900 };
  return s;
};
const s2Doc = (extra = {}) => JSON.stringify({ v: 1, owner: T0, rev: 3, flags: { 's2:board': 1, 'mission:s2-01': true }, collected: ['s2.ev.e-register'], journal: ['s2-case-open'], ...extra });

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
});
afterEach(() => {
  app?.destroy();
  app = null;
  root.remove();
  vi.restoreAllMocks();
});

describe('the app and the two save documents', () => {
  it('an older tab wrote over newer progress: asked once; «رجّعي الأحدث» brings it back; Season 2 untouched', async () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: SAVE_VERSION }), [S2_KEY]: s2Doc() });
    const oldTab = createDeployed({ storage });
    const oldGame = createDeployedGame({ saveManager: oldTab, initial: oldTab.load().state });
    const m = createSaveManager({ storage });
    const s = m.load().state;
    s.flags['dg-box'] = true;
    m.save(s);
    oldGame.setLocation('final', 40); // the stale tab's autosave
    const s2Before = storage.getItem(S2_KEY);
    app = createGameApp(root, { storage, reducedMotion: true });
    await until(() => $('.overlay [data-yes]'));
    expect($('.overlay').textContent).toMatch(/نسخة قديمة من اللعبة/);
    $('.overlay [data-yes]').click();
    await until(() => app.game.flag('dg-box'));
    expect(JSON.parse(storage.getItem(SAVE_KEY)).flags['dg-box']).toBe(true);
    expect(storage.getItem(`${SAVE_KEY}:alt`)).not.toBeNull();
    expect(app.game.flag('mission:s2-01')).toBe(true); // Season 2 still there
    expect(JSON.parse(storage.getItem(S2_KEY)).flags).toEqual(JSON.parse(s2Before).flags);
  });

  it('…«خليها مثل ما هي» keeps the save and keeps the newer copy aside', async () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: SAVE_VERSION }) });
    const oldTab = createDeployed({ storage });
    const oldGame = createDeployedGame({ saveManager: oldTab, initial: oldTab.load().state });
    const m = createSaveManager({ storage });
    const s = m.load().state;
    s.flags['dg-box'] = true;
    m.save(s);
    oldGame.setLocation('final', 40);
    app = createGameApp(root, { storage, reducedMotion: true });
    await until(() => $('.overlay [data-no]'));
    $('.overlay [data-no]').click();
    await wait(20);
    expect(app.game.flag('dg-box')).toBeUndefined();
    expect(JSON.parse(storage.getItem(`${SAVE_KEY}:alt`)).flags['dg-box']).toBe(true);
  });

  it('a save from a newer build: a calm message, and nothing is written', async () => {
    const newer = JSON.stringify({ ...finished(), v: SAVE_VERSION + 1, rev: 4 });
    const storage = memoryStorage({ [SAVE_KEY]: newer });
    app = createGameApp(root, { storage, reducedMotion: true });
    await until(() => $('.save-blocked'));
    expect($('.save-blocked').textContent).toMatch(/نسخة أحدث/);
    app.game.setFlag('anything');
    expect(storage.getItem(SAVE_KEY)).toBe(newer);
  });

  it('another tab wrote meanwhile: this one says so and does not overwrite', async () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: SAVE_VERSION, rev: 2 }) });
    app = createGameApp(root, { storage, reducedMotion: true });
    // the other tab
    const other = createSaveManager({ storage });
    const st = other.load().state;
    st.flags.otherTab = true;
    other.save(st);
    const theirs = storage.getItem(SAVE_KEY);
    app.game.setFlag('thisTab');
    await until(() => $('.save-blocked'));
    expect($('.save-blocked').textContent).toMatch(/مفتوحة بمكان ثاني/);
    expect(storage.getItem(SAVE_KEY)).toBe(theirs);
  });

  it('a backup file carries Season 2, and restoring it brings Season 2 back', async () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...finished(), v: SAVE_VERSION }), [S2_KEY]: s2Doc() });
    app = createGameApp(root, { storage, reducedMotion: true });
    const text = app.saves.exportText(app.game.state, app.game.s2State);
    expect(JSON.parse(text).s2.flags['mission:s2-01']).toBe(true);
    // another device: an empty game, then the file
    const storage2 = memoryStorage();
    app.destroy();
    app = createGameApp(root, { storage: storage2, reducedMotion: true });
    app.game.replace(app.saves.importText(text), { s2: app.saves.importS2(text) });
    expect(app.game.flag('mission:s2-01')).toBe(true);
    expect(app.game.inJournal('s2-case-open')).toBe(true);
    expect(JSON.parse(storage2.getItem(S2_KEY)).owner).toBe(T0);
  });
});
