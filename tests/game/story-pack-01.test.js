/**
 * Story Pack 01 «الطرق اللي تتذكر»: save preservation, one-time rewards,
 * the husky's name, the "new places" notice, puzzle validity, the silent
 * embrace and its return to play — unit level and through the real app
 * (same harness as v3-app.test.js).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { createSaveManager, SAVE_KEY, SAVE_VERSION, defaultState } from '../../src/game/core/save.js';
import { cleanName, huskyName, fillNames, HUSKY_DEFAULT, HUSKY_FLAG, NAME_MAX } from '../../src/game/core/names.js';
import { syncMissions, missionState } from '../../src/game/progression/missions.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { MISSIONS_SP1, PACKS, SP1_UNLOCK } from '../../src/game/data/missions-sp1.js';
import { dueNotice, noticeFlag } from '../../src/game/ui/content-notice.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { CINEMATICS } from '../../src/game/data/cinematics.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { WORLDS } from '../../src/game/data/worlds.js';
import { currentObjective, ACTS } from '../../src/game/data/chapters.js';
import { SP1_SCENES } from '../../src/game/art/sp1-scenes.js';
import { RULES, solve, replay, runProgram } from '../../src/game/puzzles/rules.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { scriptTexts } from '../../src/game/narrative/dialogue.js';
import { memoryStorage } from '../helpers.js';

/**
 * A representative finished V3 save (built for the test — never a real
 * player's save): main story complete, items, collectibles, journal,
 * records, cosmetics, garden, games-room state, a location.
 */
function finishedSave() {
  const s = defaultState(1_700_000_000_000);
  Object.assign(s, {
    playMs: 9_876_000,
    flags: { 'intro-done': true, 'map-open': true, 'act1-done': true, 'act7-done': true, 'game-complete': true, 'rose-planted': true, 'mission:night-run': true, 'ending-choice': 'hope', 't.garden.enter': true },
    inventory: { treat: 3, diploma: 1, lunchbox: 1 },
    collected: ['star.garden.1', 'note.ryan.1', 'seed.garden.1', 'petal.hedge.2'],
    seen: ['cine:opening', 'it.garden.fountain'],
    journal: ['snooki', 'ending', 'gameroom'],
    records: { 'game:maze': { plays: 4, best: 61.5, medal: 'gold', completed: true }, 'game:race-night': { plays: 2, best: 88, medal: 'silver', completed: true } },
    unlocks: ['car-emerald', 'collar-sky'],
    cosmetics: { anjiOutfit: 'evening', anjiBow: 'gold', snookiHat: 'crown', snookiCollar: 'sky', carColor: 'emerald', cardBack: 'gold' },
    location: { scene: 'final', x: 1420 },
    garden: [{ id: 'kittenhouse', cell: 3 }, { id: 'robo', cell: 7 }],
    memories: { 'story-1': { solved: true, attempts: 2 } },
    hub: { lines: { 'snooki-tap': 2 }, gifts: [{ wrap: 'blue', ribbon: 'gold', flower: 'rose', note: 'hi' }], daily: '2026-10-20' },
  });
  return s;
}

const strip = ({ updatedAt, ...rest }) => rest;

describe('save compatibility (no schema change)', () => {
  it('the pack does not bump the save version or need a migration', () => {
    expect(SAVE_VERSION).toBe(3);
  });

  it('an existing finished save loads with every field unchanged', () => {
    const before = finishedSave();
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(before) });
    const { state, status } = createSaveManager({ storage }).load();
    expect(status).toBe('loaded');
    expect(strip(state)).toEqual(strip(before));
  });

  it('load → save → load is stable (idempotent), and so is repeating it', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(finishedSave()) });
    const saves = createSaveManager({ storage });
    const first = saves.load().state;
    saves.save(first);
    const second = saves.load().state;
    saves.save(second);
    const third = saves.load().state;
    expect(strip(second)).toEqual(strip(first));
    expect(strip(third)).toEqual(strip(first));
  });

  it('playing the whole pack only adds state: nothing existing changes', () => {
    const before = finishedSave();
    const game = createGame({ saveManager: null, initial: structuredClone(before) });
    for (const f of ['sp1-roads-seen', 'sp1-embrace', 'sp1-clinic-seen', 'sp1-visit-done', 'sp1-husky-met', 'sp1-gift-box', 'sp1-clue-1', 'sp1-clue-2', 'sp1-clue-3', 'sp1-gift-open', 'sp1-return', 'sp1-done']) game.setFlag(f);
    game.setFlag(HUSKY_FLAG, 'لولو');
    syncMissions(game);
    const after = game.state;
    for (const [k, v] of Object.entries(before.flags)) expect(after.flags[k], k).toEqual(v);
    for (const [k, v] of Object.entries(before.inventory)) expect(after.inventory[k], k).toBe(v);
    for (const k of ['collected', 'seen', 'journal', 'unlocks']) expect(after[k].slice(0, before[k].length), k).toEqual(before[k]);
    for (const k of ['records', 'cosmetics', 'location', 'garden', 'memories', 'hub', 'playMs', 'createdAt']) expect(after[k], k).toEqual(before[k]);
  });

  it('the husky name survives export → import and a malformed name falls back safely', () => {
    const saves = createSaveManager({ storage: memoryStorage() });
    const s = finishedSave();
    s.flags[HUSKY_FLAG] = 'ميرا';
    const restored = saves.importText(saves.exportText(s));
    expect(restored.flags[HUSKY_FLAG]).toBe('ميرا');
    for (const bad of [42, true, '', '   ', 'x'.repeat(200), '<b>hi</b>', `a${String.fromCharCode(0x202e)}b`, '١٢٣']) {
      const g = createGame({ saveManager: null, initial: { ...defaultState(), flags: { [HUSKY_FLAG]: bad } } });
      expect(huskyName(g), String(bad)).toBe(HUSKY_DEFAULT);
    }
  });
});

describe('husky name rules', () => {
  it('accepts letters (any script) and single spaces, up to the limit', () => {
    expect(cleanName('  لولو  ')).toBe('لولو');
    expect(cleanName('ثلجة   البيضاء')).toBe('ثلجة البيضاء');
    expect(cleanName('Snow')).toBe('Snow');
    expect(cleanName('a\nb')).toBe('a b'); // any whitespace becomes one space
    expect(cleanName('ي'.repeat(NAME_MAX))).toBe('ي'.repeat(NAME_MAX));
  });
  it('refuses digits, symbols, markup, control/direction characters and overlong names', () => {
    const RLM = String.fromCharCode(0x200f);
    const NUL = String.fromCharCode(0);
    for (const bad of ['', ' ', 'ي'.repeat(NAME_MAX + 1), 'Luna1', 'لو<لو', '"x"', `a${RLM}b`, `a${NUL}b`, null, undefined, 5]) expect(cleanName(bad), String(bad)).toBeNull();
  });
  it('fills {husky} everywhere it is used', () => {
    const g = createGame({ saveManager: null });
    expect(fillNames('{husky} و{husky}', g)).toBe(`${HUSKY_DEFAULT} و${HUSKY_DEFAULT}`);
    g.setFlag(HUSKY_FLAG, 'سما');
    expect(fillNames('{husky}!', g)).toBe('سما!');
    expect(fillNames(undefined, g)).toBeUndefined();
  });
});

describe('missions: stable ids, prerequisites, one-time rewards', () => {
  it('pack missions are registered with unique, prefixed ids and chain in order', () => {
    expect(MISSIONS.filter((m) => m.pack === 'sp1')).toEqual(MISSIONS_SP1);
    for (const m of MISSIONS_SP1) expect(m.id).toMatch(/^sp1-/);
    const story = MISSIONS_SP1.filter((m) => m.kind === 'story').map((m) => m.id);
    expect(story).toEqual(['sp1-two-roads', 'sp1-sweets-roses', 'sp1-husky-name', 'sp1-unsigned-gift', 'sp1-garden-remembers']);
  });

  it('nothing opens before the ending; the first chapter opens after it', () => {
    const g = createGame({ saveManager: null });
    for (const m of MISSIONS_SP1) expect(missionState(m, g).status, m.id).toBe('locked');
    g.setFlag('game-complete');
    expect(missionState(MISSIONS_SP1[0], g).status).toBe('active');
    // once the main story's objectives are all done, the HUD shows the pack's next step
    const satisfy = (a) => {
      const [kind, ...rest] = a.split(':');
      const id = rest.join(':');
      if (kind === 'flag') g.setFlag(id);
      else if (kind === 'record') g.recordResult(id, { completed: true });
      else if (kind === 'item') g.addItem(id);
      else throw new Error(`unexpected objective ${a}`);
    };
    for (const act of ACTS) for (const o of act.objectives) atoms(o.done).forEach(satisfy);
    expect(currentObjective(g)).toMatchObject({ act: null, title: 'حيث يلتقي الطريقان' });
  });

  it('the final chapter reward is applied once, also across reloads', () => {
    const storage = memoryStorage();
    const saves = createSaveManager({ storage });
    let g = createGame({ saveManager: saves });
    for (const f of ['game-complete', 'sp1-gift-open', 'sp1-return', 'sp1-done']) g.setFlag(f);
    const first = syncMissions(g).completed.map((m) => m.id);
    expect(first).toContain('sp1-garden-remembers');
    expect(g.isUnlocked('collar-rose')).toBe(true);
    g = createGame({ saveManager: saves, initial: saves.load().state });
    expect(syncMissions(g).completed).toEqual([]);
    expect(g.state.unlocks.filter((u) => u === 'collar-rose')).toHaveLength(1);
  });

  it('keepsakes are collected once even if a scene replays', () => {
    const g = createGame({ saveManager: null });
    expect(g.collect('keepsake.roads.1')).toBe(true);
    expect(g.collect('keepsake.roads.1')).toBe(false);
    expect(g.countGroup('keepsake')).toBe(1);
  });

  it('one-time story beats are guarded by their own result flag (replay prevention)', () => {
    const g = createGame({ saveManager: null });
    const trig = (scene, id) => SCENES[scene].triggers.find((t) => t.id === id);
    expect(check(trig('roads', 'embrace').if, g)).toBe(true);
    g.setFlag('sp1-embrace');
    expect(check(trig('roads', 'embrace').if, g)).toBe(false);
    g.setFlags(['sp1-ball-found']);
    expect(check(trig('roseclinic', 'zoomies').if, g)).toBe(true);
    g.setFlag('surprise:sp1-zoomies');
    expect(check(trig('roseclinic', 'zoomies').if, g)).toBe(false);
  });
});

describe('the new-content notice', () => {
  it('appears only when the pack is really playable, and only until acknowledged', () => {
    const g = createGame({ saveManager: null });
    g.setFlag('notice:s2'); // Season 2's notice (it also opens with the ending) is tested in s2-m1.test.js
    expect(dueNotice(g, 'garden')).toBeNull(); // story not finished
    g.setFlag('game-complete');
    expect(dueNotice(g, 'garden')?.id).toBe('sp1');
    expect(dueNotice(g, 'roads')).toBeNull(); // already there
    g.setFlag(noticeFlag(PACKS[0]));
    expect(dueNotice(g, 'garden')).toBeNull();
  });
  it('is not shown if the pack content failed to load', () => {
    const g = createGame({ saveManager: null });
    g.setFlag('notice:s2'); // (Season 2's own notice: tested in s2-m1.test.js)
    g.setFlag('game-complete');
    const saved = SCENES.roads;
    delete SCENES.roads;
    try {
      expect(dueNotice(g, 'garden')).toBeNull();
    } finally {
      SCENES.roads = saved;
    }
  });
  it('a pack unlock matches its map location', () => {
    for (const p of PACKS) expect(WORLDS.find((w) => w.id === p.world)).toMatchObject({ scene: p.scene, ready: true, unlock: SP1_UNLOCK });
  });
});

describe('puzzles: valid from their starting state', () => {
  for (const id of ['sp1-cipher', 'sp1-lost-ball', 'sp1-build-steps']) {
    it(`${id} has a solution that the rules accept`, () => {
      const def = PUZZLES[id];
      const moves = solve(def.type, def.config);
      expect(moves?.length, id).toBeGreaterThan(0);
      const res = replay(def.type, def.config, moves);
      expect(res.outcome).toBe('solved');
      expect(def.hints.length).toBeGreaterThanOrEqual(3);
      expect(def.success).toBeTruthy();
    });
  }
  it('the cipher is fair: every symbol is given by a clue in the world', () => {
    const { config } = PUZZLES['sp1-cipher'];
    const told = new Map(config.key);
    const clueText = scriptTexts(DIALOGUE['sp1.clue-3']).join(' ');
    expect(told.get('sym:rose')).toBe('و');
    expect(told.get('sym:heart')).toBe('د');
    expect(clueText).toMatch(/أول حرف من عيد/); // the moon: ع
    expect(config.word.join('')).toBe('وعد');
    expect(config.letters).toContain('ع');
  });
  it('the lost-ball levels need turns (not just "forward") and crash on trees', () => {
    const { stages } = PUZZLES['sp1-lost-ball'].config;
    expect(runProgram(stages[1], ['F']).crash).toBe(true);
    expect(stages.slice(1).every((st) => !runProgram(st, Array(st.max).fill('F')).ok)).toBe(true);
    const wrong = RULES.program.run(PUZZLES['sp1-lost-ball'].config, { ...RULES.program.init(), prog: ['F'], stage: 1 });
    expect(wrong.message).toMatch(/شجرة/);
  });
});

describe('cinematics', () => {
  it('the embrace is silent: no captions, no dialogue, every shot drawn in code', () => {
    const shots = CINEMATICS['sp1-embrace'];
    expect(shots.length).toBeGreaterThanOrEqual(4);
    for (const s of shots) {
      expect(s.silent).toBe(true);
      expect(s.caption).toBeUndefined();
      expect(s.say).toBeUndefined();
      expect(SP1_SCENES[s.scene], s.scene).toBeTypeOf('function');
    }
  });
  it('the code montage lasts about three seconds', () => {
    const total = CINEMATICS['sp1-montage'].reduce((n, s) => n + s.ms, 0);
    expect(total).toBeGreaterThanOrEqual(2000);
    expect(total).toBeLessThanOrEqual(3200);
  });
  it('the illustrations embed no raster images, links or real-site screenshots', () => {
    const game = createGame({ saveManager: null });
    for (const [name, draw] of Object.entries(SP1_SCENES)) {
      const svg = draw(game, `t-${name}`);
      expect(svg, name).toMatch(/^<svg /);
      expect(svg, name).not.toMatch(/<image|href=|data:image|\.webp|\.png|\.jpe?g|<script/i);
    }
  });
  it('the AI disclaimer is not placed in the embrace scene', () => {
    expect(JSON.stringify(SCENES.roads)).not.toMatch(/disclaimer/);
    expect(SCENES.roseclinic.interact.some((it) => it.run?.some((a) => a.say === 'sp1.disclaimer'))).toBe(true);
  });
});

/* ── through the real app ─────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
        if (prop === 'measureText') return () => ({ width: 40 });
        if (prop === 'getImageData') return () => ({ data: [] });
        return noop;
      },
      set: () => true,
    },
  );
}

let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}
const $ = (sel) => root.querySelector(sel);

async function drainDialogue(max = 80) {
  for (let i = 0; i < max; i++) {
    const box = $('.overlay-dialogue .dlg-box');
    if (!box) return;
    const choice = $('.btn-choice');
    if (choice) choice.click();
    else {
      box.click();
      box.click();
    }
    await wait(5);
  }
}

describe('Story Pack 01 in the app', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.stubGlobal(
      'Image',
      class {
        constructor() {
          this.width = 100;
          this.height = 200;
          this.complete = true;
        }
        set src(v) {
          this._src = v;
          setTimeout(() => this.onload?.(), 0);
        }
        get src() {
          return this._src;
        }
        decode() {
          return Promise.resolve();
        }
      },
    );
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('the notice offers the new places once; «بعدين» is remembered after a reload', { timeout: 30000 }, async () => {
    const save = finishedSave();
    save.flags['final-entered'] = true; // skip the finale's own intro line
    // Season 2's own notice (it opens with the ending too) was already seen — kept in its own save
    const s2Seen = JSON.stringify({ v: 1, owner: save.createdAt, rev: 1, flags: { 'notice:s2': true } });
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(save), 'snooki-game:s2': s2Seen });
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    await app.go('final', { spawnX: 300 });
    const card = await until(() => $('.pack-notice'), 15000); // after the mission toasts clear
    expect(card.textContent).toMatch(/أكو أماكن جديدة تنتظرج بالحديقة/);
    card.querySelector('[data-later]').click();
    expect($('.pack-notice')).toBeNull();
    app.destroy();
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    await app.go('final', { spawnX: 300 });
    await wait(2500);
    expect($('.pack-notice')).toBeNull();
  });

  it('the embrace plays silently, saves once, and gives control back', async () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(finishedSave()) });
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    await app.go('roads', { spawnX: 640 });
    const cine = await until(() => $('.overlay-cine .cine'));
    await until(() => cine.classList.contains('is-silent'));
    expect($('.overlay-dialogue')).toBeNull();
    expect(cine.querySelector('.cine-caption').textContent).toBe('');
    expect(cine.querySelector('.cine-stage svg')).toBeTruthy();
    cine.querySelector('.cine-skip').click(); // leaving early is always possible
    await until(() => app.game.flag('sp1-embrace'));
    await until(() => app.screen.world?.mode === 'play', 6000);
    expect(app.game.inJournal('sp1-roads')).toBe(true);
    expect(app.game.has('keepsake.roads.1')).toBe(true);
    expect($('.controls').dataset.mode).toBe('play');
    // the saved progress is on "disk"
    expect(JSON.parse(storage.getItem(SAVE_KEY)).flags['sp1-embrace']).toBe(true);
  });

  it('the visit, the husky and her name: validated, saved, used in the story', async () => {
    const save = finishedSave();
    Object.assign(save.flags, { 'sp1-embrace': true, 'sp1-roads-seen': true, 'sp1-clinic-seen': true, [noticeFlag(PACKS[0])]: true });
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(save) });
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    await app.go('roseclinic', { spawnX: 690 });
    const world = await until(() => app.screen.world);
    await until(() => world.mode === 'play');
    const target = (label) => until(() => $('.pad-interact:not([disabled])')?.getAttribute('aria-label') === `فحص: ${label}`, 6000);
    await target('المصطبة');
    world.interact();
    await until(() => $('.overlay-dialogue'));
    await drainDialogue();
    await until(() => $('.overlay-dialogue'), 9000); // Ryan walks in first
    await drainDialogue();
    await until(() => app.game.flag('sp1-visit-done'), 6000);
    await until(() => world.mode === 'play', 6000);

    world.player.x = 750;
    await target('ريان');
    world.interact();
    await until(() => $('.overlay-dialogue'));
    await drainDialogue();
    await until(() => $('.overlay-dialogue'), 6000);
    await drainDialogue();
    const picker = await until(() => $('.name-picker'), 6000);
    const input = picker.querySelector('#np-input');
    input.value = 'Luna 2';
    picker.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(picker.querySelector('#np-error').hidden).toBe(false);
    expect(app.game.flag(HUSKY_FLAG)).toBeUndefined();
    input.value = '  نجمة ';
    picker.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await until(() => app.game.flag(HUSKY_FLAG) === 'نجمة');
    const named = await until(() => $('.overlay-dialogue'), 6000);
    expect(named.textContent).toMatch(/نجمة/);
    await drainDialogue();
    await until(() => app.game.flag('sp1-husky-met'), 6000);
    await until(() => world.mode === 'play', 6000);

    // asking again never overwrites
    expect(await app.ui.askName('husky')).toBe('نجمة');
    expect($('.name-picker')).toBeNull();

    // reload: the name and the chapter state come back
    app.destroy();
    app = createGameApp(root, { storage, reducedMotion: true });
    expect(app.game.flag(HUSKY_FLAG)).toBe('نجمة');
    expect(missionState(MISSIONS_SP1.find((m) => m.id === 'sp1-husky-name'), app.game).status).toBe('complete');
    expect(missionState(MISSIONS_SP1.find((m) => m.id === 'sp1-unsigned-gift'), app.game).status).toBe('active');
  });
});
