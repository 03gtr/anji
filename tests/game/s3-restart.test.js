/**
 * The restart policy (owner decision, 2026-11-01: `all`): starting over restarts every season together — the
 * original game, Season 2 and Season 3 — never one season alone, and never without the game's own confirmation.
 * Nothing of the old playthrough is deleted by a restart: each season's old document is kept aside (`:previous`,
 * moved by the first write of the new playthrough), and it never resurfaces in the new one. Driven through the real
 * app (title button, settings' wipe) on a memory storage holding all three saves.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { defaultState, SAVE_KEY, SAVE_VERSION } from '../../src/game/core/save.js';
import { S2_KEY, S3_KEY, createSeasonStore } from '../../src/game/core/s2-store.js';
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
const KEYS = [SAVE_KEY, `${SAVE_KEY}:backup`, `${SAVE_KEY}:shadow`, S2_KEY, `${S2_KEY}:backup`, `${S2_KEY}:previous`, S3_KEY, `${S3_KEY}:backup`, `${S3_KEY}:previous`];

/** A player with all three saves: the original game finished, Season 2 done, Season 3 begun (and she was last there). */
function threeSaves() {
  const main = defaultState(T0);
  main.flags = { 'intro-done': true, 'map-open': true, 'game-complete': true, 'act8-done': true, 'husky-name': 'ثلج' };
  main.location = { scene: 'final', x: 900 };
  main.updatedAt = T0 + 10;
  const s2 = { v: 1, owner: T0, rev: 3, updatedAt: T0 + 20, flags: { 'mission:s2-17': true }, collected: ['s2.ev.e-wax'], journal: ['s2-truth'], location: { scene: 's2-archive', x: 300 }, here: false };
  const s3 = { v: 1, owner: T0, rev: 2, updatedAt: T0 + 30, flags: { 's3:dec:sabri-reply': 'deny', 'mission:s3-01': true }, collected: ['s3.ev.e-visitor-log'], location: { scene: 's3-clinic', x: 140 }, here: true };
  return memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...main, v: SAVE_VERSION }), [S2_KEY]: JSON.stringify(s2), [S3_KEY]: JSON.stringify(s3) });
}
const snapshot = (storage) => Object.fromEntries(KEYS.map((k) => [k, storage.getItem(k)]));

/** After a restart: one consistent new playthrough, every season bound to it and empty. */
function expectFreshEverywhere(game, oldCreatedAt = T0) {
  const owner = game.state.createdAt;
  expect(owner).not.toBe(oldCreatedAt);
  expect(game.flag('game-complete')).toBeFalsy();
  expect(game.s2State.owner).toBe(owner);
  expect(game.s3State.owner).toBe(owner);
  expect(game.flag('mission:s2-17')).toBeFalsy();
  expect(game.flag('s3:dec:sabri-reply')).toBeUndefined();
  expect(game.has('s3.ev.e-visitor-log')).toBe(false);
  expect(game.s2State.collected).toEqual([]);
  expect(game.s3State.collected).toEqual([]);
  expect(game.resumeLocation().scene).not.toBe('s3-clinic');
}

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

describe('restart = all seasons together (owner decision)', () => {
  it('«مغامرة جديدة» asks first; «لا» changes nothing in any of the three saves', async () => {
    const storage = threeSaves();
    const before = snapshot(storage);
    app = createGameApp(root, { storage, reducedMotion: true });
    await app.toTitle(); // (as main.js opens the game)
    await until(() => $('.title-screen [data-act="new"]'));
    $('.title-screen [data-act="new"]').click();
    await until(() => $('.overlay [data-no]'));
    expect($('.overlay').textContent).toMatch(/مغامرة جديدة/);
    $('.overlay [data-no]').click();
    await wait(50);
    expect(snapshot(storage)).toEqual(before);
    expect(app.game.flag('s3:dec:sabri-reply')).toBe('deny');
  });

  it('confirmed: the original game, Season 2 and Season 3 all start over, bound to one new playthrough', async () => {
    const storage = threeSaves();
    const oldS2 = storage.getItem(S2_KEY);
    const oldS3 = storage.getItem(S3_KEY);
    app = createGameApp(root, { storage, reducedMotion: true });
    await app.toTitle(); // (as main.js opens the game)
    await until(() => $('.title-screen [data-act="new"]'));
    $('.title-screen [data-act="new"]').click();
    await until(() => $('.overlay [data-yes]'));
    $('.overlay [data-yes]').click();
    await until(() => app.game.state.createdAt !== T0);
    expectFreshEverywhere(app.game);
    // nothing deleted: until the new playthrough writes a season, its old document is where it was…
    expect(storage.getItem(S2_KEY)).toBe(oldS2);
    expect(storage.getItem(S3_KEY)).toBe(oldS3);
    // …and its first write keeps the old one aside, never over it
    app.game.setFlag('s3:01-confronted');
    app.game.setFlag('s2:anything');
    expect(storage.getItem(`${S3_KEY}:previous`)).toBe(oldS3);
    expect(storage.getItem(`${S2_KEY}:previous`)).toBe(oldS2);
    expect(JSON.parse(storage.getItem(S3_KEY)).owner).toBe(app.game.state.createdAt);
    expect(JSON.parse(storage.getItem(S3_KEY)).flags).toEqual({ 's3:01-confronted': true });
  });

  it('the settings wipe (two confirmations) also starts every season over; old season progress never comes back', async () => {
    const storage = threeSaves();
    app = createGameApp(root, { storage, reducedMotion: true });
    await wait(20);
    await app.newGame({ wipe: true });
    expectFreshEverywhere(app.game);
    expect(JSON.parse(storage.getItem(SAVE_KEY)).createdAt).toBe(app.game.state.createdAt);
  });

  it('a reload right after a restart (no season written yet) is the new playthrough — the old Season 3 place does not resume', async () => {
    const storage = threeSaves();
    app = createGameApp(root, { storage, reducedMotion: true });
    await wait(20);
    await app.newGame();
    const owner = app.game.state.createdAt;
    app.destroy();
    app = createGameApp(root, { storage, reducedMotion: true });
    expect(app.game.state.createdAt).toBe(owner);
    expectFreshEverywhere(app.game);
  });

  it('no partial state: after a restart and some play, every document belongs to the same playthrough', async () => {
    const storage = threeSaves();
    app = createGameApp(root, { storage, reducedMotion: true });
    await wait(20);
    await app.newGame();
    app.game.setFlag('intro-done');
    app.game.setFlag('s2:x');
    app.game.setFlag('s3:x');
    const owner = JSON.parse(storage.getItem(SAVE_KEY)).createdAt;
    expect(JSON.parse(storage.getItem(S2_KEY)).owner).toBe(owner);
    expect(JSON.parse(storage.getItem(S3_KEY)).owner).toBe(owner);
  });
});

describe('Season 3 in the app’s save protections', () => {
  it('a Season 3 document from a newer build: the calm message, and nothing written to it', async () => {
    const storage = threeSaves();
    const newer = JSON.stringify({ v: 99, owner: T0, rev: 9, flags: { 's3:future': true } });
    storage.setItem(S3_KEY, newer);
    app = createGameApp(root, { storage, reducedMotion: true });
    await until(() => $('.save-blocked'));
    expect($('.save-blocked').textContent).toMatch(/نسخة أحدث/);
    app.game.setFlag('s3:01-confronted');
    expect(storage.getItem(S3_KEY)).toBe(newer);
  });

  it('another tab wrote Season 3 meanwhile: this one says so and does not overwrite it', async () => {
    const storage = threeSaves();
    app = createGameApp(root, { storage, reducedMotion: true });
    const other = createSeasonStore({ storage, key: S3_KEY });
    const doc = other.load(T0).state;
    doc.flags['s3:other-tab'] = true;
    other.save(doc);
    const theirs = storage.getItem(S3_KEY);
    app.game.setFlag('s3:this-tab');
    await until(() => $('.save-blocked'));
    expect($('.save-blocked').textContent).toMatch(/مفتوحة بمكان ثاني/);
    expect(storage.getItem(S3_KEY)).toBe(theirs);
  });

  it('the browser announcing another tab’s Season 3 write is enough to warn (before this tab tries)', async () => {
    const storage = threeSaves();
    app = createGameApp(root, { storage, reducedMotion: true });
    await wait(20);
    window.dispatchEvent(new StorageEvent('storage', { key: S3_KEY, newValue: '{}' }));
    await until(() => $('.save-blocked'));
    expect($('.save-blocked').textContent).toMatch(/مفتوحة بمكان ثاني/);
  });
});
