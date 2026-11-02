/**
 * Season 3's own save (docs/season-3/TECHNICAL_ARCHITECTURE.md §2): every Season 3 id lives in `snooki-game:s3`;
 * the original campaign's save and Season 2's stay byte-identical through Season 3 play, moves between the seasons,
 * reloads, corruption and a newer document. Driven through the real stores on a real (memory) storage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { createGame, isS2, isS3, seasonOf } from '../../src/game/core/game.js';
import { createSaveManager, defaultState, SAVE_KEY } from '../../src/game/core/save.js';
import { createS2Store, createSeasonStore, S2_KEY, S3_KEY, S2_VERSION } from '../../src/game/core/s2-store.js';
import { memoryStorage } from '../helpers.js';
import { S3_SCENES } from '../../src/game/data/scenes/s3.js';
import { MISSIONS_S3 } from '../../src/game/data/missions-s3.js';

const T0 = 1_800_000_000_000;
const MAIN_KEYS = [SAVE_KEY, `${SAVE_KEY}:backup`, `${SAVE_KEY}:shadow`];
const S2_KEYS = [S2_KEY, `${S2_KEY}:backup`, `${S2_KEY}:shadow`, `${S2_KEY}:previous`, `${S2_KEY}:broken`];

/** A player who finished the original game and played some of Season 2, on a fresh storage. */
function world(storage = memoryStorage(), { at = T0 + 100 } = {}) {
  if (!storage.getItem(SAVE_KEY)) {
    const main = defaultState(T0);
    main.flags = { 'intro-done': true, 'game-complete': true, 'husky-name': 'ثلج' };
    storage.setItem(SAVE_KEY, JSON.stringify({ ...main, v: 3 }));
    const s2 = createS2Store({ storage, now: () => T0 + 10 });
    const doc = s2.load(T0).state;
    doc.flags['mission:s2-17'] = true;
    doc.collected.push('s2.ev.e-wax');
    s2.save(doc);
  }
  let clock = at;
  const now = () => clock++;
  const saves = createSaveManager({ storage, now });
  const loaded = saves.load();
  const s2Store = createS2Store({ storage, now });
  const s3Store = createSeasonStore({ storage, key: S3_KEY, now });
  const game = createGame({
    saveManager: saves,
    s2Store,
    s3Store,
    initial: loaded.state,
    s2Initial: s2Store.load(loaded.state.createdAt).state,
    s3Initial: s3Store.load(loaded.state.createdAt).state,
    now,
  });
  const snap = (keys) => keys.map((k) => storage.getItem(k));
  return { storage, game, s3Store, main: () => snap(MAIN_KEYS), s2: () => snap(S2_KEYS), s3: () => JSON.parse(storage.getItem(S3_KEY) || 'null') };
}

/** Season 3 play of every kind of write. */
function playSeason3(game) {
  game.setLocation('s3-clinic', 140);
  game.setFlag('s3:01-confronted');
  game.setFlag('s3:dec:sabri-reply', 'deny');
  game.setFlags(['s3:01-marius-in', 's3:01-records']);
  game.collect('s3.ev.e-visitor-log');
  game.markSeen('dlg:s3.01-sabri-asks');
  game.markSeen('it.s3-clinic.log');
  game.addJournal('s3-sabri');
  game.recordResult('puzzle:s3-office', { completed: true });
  game.setFlag('mission:s3-01');
  game.setFlag('visited:s3-clinic');
  game.setFlag('t.s3-clinic.open');
  game.nextLine('s3:husky:clinic', 4);
  game.addPlayTime(30000);
  game.save();
}

describe('routing: which document an id belongs to', () => {
  it('Season 3 ids go to Season 3, Season 2 ids to Season 2, everything else to the original save', () => {
    for (const id of ['s3-clinic', 'mission:s3-01', 's3:dec:sabri-reply', 's3.ev.e-visitor-log', 'dlg:s3.01-sabri-asks', 'visited:s3-clinic', 't.s3-clinic.open', 'it.s3-clinic.log', 'puzzle:s3-office', 'pdraft:s3-office', 's3-sabri']) {
      expect(seasonOf(id), id).toBe('s3');
      expect(isS2(id), id).toBe(false);
    }
    for (const id of ['s2-archive', 'mission:s2-17', 's2.ev.e-wax']) expect(seasonOf(id), id).toBe('s2');
    for (const id of ['garden', 'mission:m1', 'star.garden.1', 'act8-done', 'puzzles3', 'xs3-y', 'sp1-s3x']) expect(seasonOf(id), id).toBe(null);
    // a bare segment is the season's own name, as `isS2('s2')` has always been true
    expect(seasonOf('s3')).toBe('s3');
  });

  // the game's content (missions, places, flags, evidence, dialogue, puzzles) lives in src/game/data; the season
  // machinery's own literals ('s3', 'snooki-game:s3') are not ids
  it('no content id that existed before Season 3 is one Season 3 would take (only one puzzle slot, never a save key)', () => {
    const hits = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.m?js$/.test(e.name) && !/s3-/.test(e.name)) {
          for (const m of fs.readFileSync(p, 'utf8').matchAll(/(['"`])((?:(?!\1)[^\\\n])*)\1/g)) if (isS3(m[2])) hits.push(`${path.relative('.', p)}: ${m[2]}`);
        }
      }
    };
    walk(path.resolve('src/game/data'));
    // Story Pack 01's «ماكنة الأفكار» has slots 's1' 's2' 's3' inside its config; a draft is saved under its puzzle id
    // (`pdraft:sp1-build-steps`), so the slot names never route a save (Season 2 has lived with its 's2' slot)
    const allowed = [path.join('src', 'game', 'data', 'puzzles-sp1.js') + ': s3'];
    // Season 3 registering itself on the map (data/worlds.js): its own pack/region name and its own places
    const worlds = path.join('src', 'game', 'data', 'worlds.js');
    // (and each Season 3 place opens when a Season 3 mission is done: its own completion flag)
    allowed.push(`${worlds}: s3`, ...S3_SCENES.map((s) => `${worlds}: ${s.id}`), ...MISSIONS_S3.map((m) => `${worlds}: flag:mission:${m.id}`));
    // (the seasons' puzzle guides, data/guides.js, name Season 3's puzzles by their ids: keys, never a save key)
    expect(hits.filter((h) => !allowed.includes(h.replace(/\//g, path.sep)) && !/[/\\]data[/\\]s3[/\\]|missions-s3|evidence-s3|puzzles-s3|dialogue[/\\]s3|scenes[/\\]s3|data[/\\]guides\.js/.test(h))).toEqual([]);
  });
});

describe('Season 3 writes only its own document', () => {
  it('a whole round of Season 3 play leaves the original save and Season 2’s byte-identical', () => {
    const w = world();
    const main = w.main();
    const s2 = w.s2();
    playSeason3(w.game);
    expect(w.main()).toEqual(main);
    expect(w.s2()).toEqual(s2);
    const doc = w.s3();
    expect(doc.owner).toBe(T0);
    expect(doc.flags).toMatchObject({ 's3:01-confronted': true, 's3:dec:sabri-reply': 'deny', 's3:01-marius-in': true, 'mission:s3-01': true, 'visited:s3-clinic': true, 't.s3-clinic.open': true });
    expect(doc.collected).toEqual(['s3.ev.e-visitor-log']);
    expect(doc.seen).toEqual(expect.arrayContaining(['dlg:s3.01-sabri-asks', 'it.s3-clinic.log']));
    expect(doc.journal).toEqual(['s3-sabri']);
    expect(doc.records['puzzle:s3-office'].completed).toBe(true);
    expect(doc.lines['s3:husky:clinic']).toBe(1);
    expect(doc.playMs).toBe(30000);
    expect(doc.here).toBe(true);
    expect(doc.location).toEqual({ scene: 's3-clinic', x: 140 });
  });

  it('the game reads each id from its own document', () => {
    const { game } = world();
    playSeason3(game);
    expect(game.flag('s3:dec:sabri-reply')).toBe('deny');
    expect(game.flag('mission:s2-17')).toBe(true);
    expect(game.flag('game-complete')).toBe(true);
    expect(game.state.flags['s3:01-confronted']).toBeUndefined();
    expect(game.s2State.flags['s3:01-confronted']).toBeUndefined();
    expect(game.journalIds()).toContain('s3-sabri');
  });

  it('a main state that carries Season 3 ids (a fixture, a developer link) hands them to Season 3, in memory only', () => {
    const storage = memoryStorage();
    const main = defaultState(T0);
    main.flags = { 'game-complete': true, 's3:01-confronted': true };
    main.collected = ['star.garden.1', 's3.ev.e-visitor-log'];
    const game = createGame({ saveManager: null, initial: main });
    expect(game.state.flags['s3:01-confronted']).toBeUndefined();
    expect(game.s3State.flags['s3:01-confronted']).toBe(true);
    expect(game.state.collected).toEqual(['star.garden.1']);
    expect(game.s3State.collected).toEqual(['s3.ev.e-visitor-log']);
    expect(storage.getItem(S3_KEY)).toBeNull();
  });
});

describe('moving between the seasons and the original game', () => {
  it('Season 2 → Season 3 → the original game: each season writes only its own `here`; the original save only for a real move', () => {
    const w = world();
    w.game.setLocation('s2-archive', 300);
    const main = w.main();
    w.game.setLocation('s3-clinic', 140);
    expect(w.main()).toEqual(main); // leaving Season 2 for Season 3 never writes the original save
    expect(JSON.parse(w.storage.getItem(S2_KEY)).here).toBe(false);
    expect(w.s3().here).toBe(true);
    expect(w.game.location()).toEqual({ scene: 's3-clinic', x: 140 });
    w.game.setLocation('garden', 500);
    expect(w.s3().here).toBe(false);
    expect(JSON.parse(w.storage.getItem(SAVE_KEY)).location).toEqual({ scene: 'garden', x: 500 });
    expect(w.game.resumeLocation()).toEqual({ scene: 'garden', x: 500 });
  });

  it('standing still in a Season 3 place writes nothing', () => {
    const w = world();
    w.game.setLocation('s3-clinic', 140);
    const s3 = w.storage.getItem(S3_KEY);
    const main = w.main();
    w.game.setLocation('s3-clinic', 140);
    expect(w.storage.getItem(S3_KEY)).toBe(s3);
    expect(w.main()).toEqual(main);
  });

  it('play time in a Season 3 place counts in Season 3 only', () => {
    const w = world();
    w.game.setLocation('s3-clinic', 140);
    const mainMs = w.game.state.playMs;
    w.game.addPlayTime(5000);
    w.game.save();
    expect(w.game.state.playMs).toBe(mainMs);
    expect(w.s3().playMs).toBe(5000);
  });
});

describe('reload and resume', () => {
  it('a reload in a Season 3 place resumes there, with everything Season 3 holds', () => {
    const w = world();
    playSeason3(w.game);
    const again = world(w.storage, { at: T0 + 10_000 });
    expect(again.game.resumeLocation()).toEqual({ scene: 's3-clinic', x: 140 });
    expect(again.game.flag('s3:dec:sabri-reply')).toBe('deny');
    expect(again.game.has('s3.ev.e-visitor-log')).toBe(true);
    expect(again.game.location()).toEqual({ scene: 's3-clinic', x: 140 });
  });

  it('after leaving Season 3 for the original game, «كمّلي» resumes in the original game', () => {
    const w = world();
    playSeason3(w.game);
    w.game.setLocation('garden', 300);
    const again = world(w.storage, { at: T0 + 10_000 });
    expect(again.game.resumeLocation()).toEqual({ scene: 'garden', x: 300 });
  });

  it('a reload after a decision keeps the decision', () => {
    const w = world();
    w.game.setLocation('s3-clinic', 140);
    w.game.setFlag('s3:dec:marius-honest', 'honest');
    expect(world(w.storage, { at: T0 + 10_000 }).game.flag('s3:dec:marius-honest')).toBe('honest');
  });
});

describe('a damaged or newer Season 3 document', () => {
  it('a corrupt document recovers from its backup; the original save and Season 2 untouched', () => {
    const w = world();
    playSeason3(w.game);
    w.game.setFlag('s3:01-later'); // a second write: the first good document is now the backup
    const main = w.main();
    const s2 = w.s2();
    w.storage.setItem(S3_KEY, '{not json');
    const again = world(w.storage, { at: T0 + 10_000 });
    expect(again.game.flag('s3:01-confronted')).toBe(true);
    expect(w.main()).toEqual(main);
    expect(w.s2()).toEqual(s2);
    expect(w.storage.getItem(`${S3_KEY}:broken`)).toBe('{not json');
  });

  it('a corrupt document with no backup starts Season 3 fresh — and nothing else', () => {
    const w = world();
    const main = w.main();
    const s2 = w.s2();
    w.storage.setItem(S3_KEY, '{not json');
    const again = world(w.storage, { at: T0 + 10_000 });
    expect(again.game.flag('s3:01-confronted')).toBeUndefined();
    expect(again.game.flag('mission:s2-17')).toBe(true);
    expect(w.main()).toEqual(main);
    expect(w.s2()).toEqual(s2);
  });

  it('a document from a newer build is read, never overwritten', () => {
    const w = world();
    const newer = JSON.stringify({ v: S2_VERSION + 1, owner: T0, rev: 9, flags: { 's3:future': true } });
    w.storage.setItem(S3_KEY, newer);
    const again = world(w.storage, { at: T0 + 10_000 });
    expect(again.s3Store.readOnly).toBe(true);
    again.game.setFlag('s3:01-confronted');
    expect(w.storage.getItem(S3_KEY)).toBe(newer);
  });
});

describe('a new game and backups', () => {
  it('a new playthrough starts Season 3 fresh; the old one is kept aside, never deleted', () => {
    const w = world();
    playSeason3(w.game);
    const old = w.storage.getItem(S3_KEY);
    w.game.replace(defaultState(T0 + 500_000));
    w.game.setFlag('s3:01-confronted');
    expect(w.game.flag('s3:dec:sabri-reply')).toBeUndefined();
    expect(w.s3().owner).toBe(T0 + 500_000);
    expect(w.storage.getItem(`${S3_KEY}:previous`)).toBe(old);
  });

  it('a backup file carries Season 3, and restoring it brings Season 3 back', () => {
    const w = world();
    playSeason3(w.game);
    const saves = createSaveManager({ storage: w.storage, now: () => T0 + 20_000 });
    const text = saves.exportText(w.game.state, w.game.s2State, w.game.s3State);
    expect(JSON.parse(text).s3.flags['s3:dec:sabri-reply']).toBe('deny');
    const fresh = world(memoryStorage(), { at: T0 + 30_000 });
    fresh.game.replace(saves.importText(text), { s2: saves.importS2(text), s3: saves.importS3(text) });
    expect(fresh.game.flag('s3:dec:sabri-reply')).toBe('deny');
    expect(fresh.game.flag('mission:s2-17')).toBe(true);
    expect(saves.importS3('{"game":"x"}')).toBeNull();
    expect(saves.importS3('not json')).toBeNull();
  });
});
