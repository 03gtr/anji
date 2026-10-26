/**
 * V2 content integrity: missions can actually be completed (every flag they
 * wait for is set somewhere), rewards apply once, the finale's tone rules
 * hold, the owl is «العم منذر» everywhere, the clock clue is 2:30, saves
 * migrate, tips behave, and the new minigame rules work.
 */
import { describe, it, expect } from 'vitest';
import { MISSIONS, KIND_NAMES } from '../../src/game/data/missions.js';
import { missionState, syncMissions } from '../../src/game/progression/missions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { ITEMS, COLLECTIBLES, JOURNAL } from '../../src/game/data/items.js';
import { CAST } from '../../src/game/characters/cast.js';
import { ANJI_PALETTE } from '../../src/game/characters/anji.js';
import { createGame, groupOf } from '../../src/game/core/game.js';
import { defaultState, migrate, normalize, SAVE_VERSION } from '../../src/game/core/save.js';
import { sanitizeSettings, createSettings } from '../../src/game/core/settings.js';
import { createTips, TIPS } from '../../src/game/ui/tips.js';
import { createDialogue, walkScript } from '../../src/game/narrative/dialogue.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { atoms, check } from '../../src/game/core/conditions.js';
import { RECIPES, checkRecipe, exampleSolution } from '../../src/game/minigames/kitchen-logic.js';
import { BRIEFS, judgeLook } from '../../src/game/minigames/dressup.js';
import { QUIZ_SETS } from '../../src/game/minigames/quiz-sets.js';
import { PIPE_LEVELS, parseLevel, scramble, isSolved } from '../../src/game/minigames/pipes-logic.js';
import { WORLDS } from '../../src/game/data/worlds.js';

/* ── every effect anywhere in the content ── */
function allEffects() {
  const out = [];
  const pushFx = (fx) => [].concat(fx || []).forEach((e) => typeof e === 'string' && out.push(e));
  const visitActions = (list) => {
    for (const a of [].concat(list || [])) {
      if (!a || typeof a === 'function') continue;
      pushFx(a.fx);
      if (Array.isArray(a.say)) walkScript(a.say, (n) => pushFx(n.do));
      visitActions(a.then);
      visitActions(a.else);
    }
  };
  for (const s of Object.values(SCENES)) {
    visitActions(s.enter);
    for (const it of s.interact || []) {
      visitActions(it.run);
      for (const c of it.cases || []) visitActions(c.run);
    }
    for (const t of s.triggers || []) visitActions(t.run);
  }
  for (const script of Object.values(DIALOGUE)) walkScript(script, (n) => {
    pushFx(n.do);
    for (const o of n.choice || []) pushFx(o.do);
  });
  for (const p of Object.values(PUZZLES)) pushFx(p.reward);
  for (const m of Object.values(MINIGAMES)) pushFx([...(m.reward || []), ...(m.goldReward || [])]);
  for (const m of MISSIONS) pushFx(m.reward);
  return out;
}
const EFFECTS = allEffects();
const setsFlag = (id) => EFFECTS.includes(`flag:${id}`) || id.startsWith('mission:') || id.startsWith('t.');
const givesItem = (id) => EFFECTS.includes(`item:${id}`);
const playedGames = new Set();
(function collectGames() {
  const visit = (list) => {
    for (const a of [].concat(list || [])) {
      if (!a || typeof a === 'function') continue;
      if (a.game) playedGames.add(a.game);
      visit(a.then);
      visit(a.else);
    }
  };
  for (const s of Object.values(SCENES)) for (const it of s.interact || []) [it.run, ...(it.cases || []).map((c) => c.run)].forEach(visit);
  for (const w of WORLDS) if (w.game) playedGames.add(w.game);
})();

describe('missions', () => {
  it('there are at least ten, with unique ids, a kind, a place, steps and a reward', () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    for (const m of MISSIONS) {
      expect(KIND_NAMES[m.kind], m.id).toBeTruthy();
      expect(m.title && m.where && m.summary && m.rewardText, m.id).toBeTruthy();
      expect(m.steps.length, m.id).toBeGreaterThanOrEqual(2);
      for (const s of m.steps) expect(s.text && s.hint, `${m.id}: every step has text and a hint`).toBeTruthy();
      for (const e of [].concat(m.reward)) expect(typeof e).toBe('string');
    }
  });

  it('every condition a mission waits for can actually become true (no soft-locks)', () => {
    for (const m of MISSIONS) {
      for (const cond of [m.unlock, ...m.steps.map((s) => s.done)]) {
        for (const atom of atoms(cond)) {
          const [kind, ...rest] = atom.split(':');
          const id = rest.join(':');
          if (kind === 'flag') expect(setsFlag(id), `${m.id}: nothing sets flag ${id}`).toBe(true);
          if (kind === 'item') expect(givesItem(id), `${m.id}: nothing gives item ${id}`).toBe(true);
          if (kind === 'record') expect(MINIGAMES[id.replace(/^game:/, '')] && playedGames.has(id.replace(/^game:/, '')), `${m.id}: ${id} is never played`).toBeTruthy();
          if (kind === 'count') {
            const [, group, n] = id.match(/^([\w-]+)\s*>=\s*(\d+)$/);
            const total = Object.keys(COLLECTIBLES).filter((c) => groupOf(c) === group).length;
            expect(total, `${m.id}: only ${total} ${group}`).toBeGreaterThanOrEqual(Number(n));
          }
        }
      }
    }
  });

  it('missions point at each other only by existing ids', () => {
    const ids = new Set(MISSIONS.map((m) => m.id));
    for (const m of MISSIONS) for (const next of m.leadsTo) expect(ids.has(next), `${m.id} → ${next}`).toBe(true);
  });

  it('progress is derived: locked → active (step by step) → complete; reward applied once', () => {
    const game = createGame({ initial: defaultState(0), now: () => 0 });
    const m = MISSIONS.find((x) => x.id === 'unfinished-build');
    expect(missionState(m, game).status).toBe('locked');
    game.setFlag('study-done');
    expect(missionState(m, game)).toMatchObject({ status: 'active', step: 0 });
    expect(syncMissions(game).unlocked.map((x) => x.id)).toContain('unfinished-build');
    for (const f of ['clock-seen', 'build-seen', 'build-fixed', 'symbols-seen']) game.setFlag(f);
    expect(missionState(m, game).step).toBe(4);
    game.setFlag('drawer-open');
    const first = syncMissions(game);
    expect(first.completed.map((x) => x.id)).toContain('unfinished-build');
    expect(game.hasItem('shelf-key')).toBe(true);
    expect(game.inJournal('build-message')).toBe(true);
    // never twice
    expect(syncMissions(game).completed.map((x) => x.id)).not.toContain('unfinished-build');
    expect(game.itemCount('shelf-key')).toBe(1);
    // and it opens the next one
    expect(missionState(MISSIONS.find((x) => x.id === 'hidden-passage'), game).status).toBe('active');
  });

  it('«حديقة على ذوقچ» can be completed: missions unlock special pieces she can plant', () => {
    const game = createGame({ initial: defaultState(0), now: () => 0 });
    const m = MISSIONS.find((x) => x.id === 'garden-plus');
    game.setFlag('game-complete');
    expect(missionState(m, game).step).toBe(0);
    game.setFlag('mission:lost-kitten');
    game.setFlag('mission:robo-snooki');
    expect(missionState(m, game).step).toBe(1);
    game.setGarden([{ id: 'cat-house', cell: 0 }, { id: 'robo', cell: 1 }]);
    expect(syncMissions(game).completed.map((x) => x.id)).toContain('garden-plus');
  });

  it('the clock → task → symbols → drawer → passage → night run chain is connected', () => {
    const chain = ['unfinished-build', 'hidden-passage', 'night-run'];
    for (let i = 0; i < chain.length - 1; i++) expect(MISSIONS.find((m) => m.id === chain[i]).leadsTo).toContain(chain[i + 1]);
  });
});

describe('V2 story corrections', () => {
  it('the owl is «العم منذر» everywhere', () => {
    expect(CAST.munther.name).toBe('العم منذر');
    expect(CAST.hoot).toBeUndefined();
    const texts = [];
    for (const script of Object.values(DIALOGUE)) walkScript(script, (n) => n.t && texts.push(n.t));
    for (const j of Object.values(JOURNAL)) texts.push(j.text, j.title);
    expect(texts.join('\n')).not.toMatch(/هوت|Hoot/);
  });

  it('the clock stops at 2:30 and the garage code follows it', () => {
    expect(PUZZLES['garage-lock'].config.answer).toEqual([0, 2, 3, 0]);
    expect(JOURNAL.clock.text).toContain('٢:٣٠');
    const clockLines = [];
    walkScript(DIALOGUE['a2.clock'], (n) => n.t && clockLines.push(n.t));
    expect(clockLines.join(' ')).toContain('كأن صاحب البيت چان ينتظر أحد');
  });

  it('the kitchen says «وجبة ما بعد الجيم», not «بول ما بعد الجم»', () => {
    const titles = RECIPES.map((r) => r.title);
    expect(titles).toContain('وجبة ما بعد الجيم');
    expect(JSON.stringify(RECIPES)).not.toMatch(/بول|الجم[^ي]/);
  });

  it('Anji has green eyes', () => {
    const hex = ANJI_PALETTE.eye.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('the finale never mentions family opposition and never makes her owe anything', () => {
    const lines = [];
    for (const [id, script] of Object.entries(DIALOGUE)) walkScript(script, (n) => n.t && lines.push([id, n.t]));
    const forbidden = /أهلچ|أهلي|الأهل|عائلت|عيلت|أبوچ|أمچ|يرفضون|رفضوا|ما يقبلون|لازم تسامحين|لازم تنطرين|لازم تبقين|مديونة إلي بشي لأن(?! تعبت)/;
    for (const [id, t] of lines) expect(t, id).not.toMatch(forbidden);
    // the one line about debt says the opposite: nothing is owed
    const meet = [];
    walkScript(DIALOGUE['a8.meet'], (n) => n.t && meet.push(n.t));
    expect(meet.join(' ')).toContain('مو دين');
  });

  it('the drawing is never described in code: only the private image carries it', () => {
    // its journal entry and every finale line stay generic (no Latin text quoted from it)
    expect(JOURNAL.drawing.text).not.toMatch(/[A-Za-z]/);
    for (const id of ['a8.meet', 'a8.drawing', 'a8.ending']) walkScript(DIALOGUE[id], (n) => n.t && expect(n.t, id).not.toMatch(/[A-Za-z]{3,}/));
  });
});

describe('three hopeful endings', () => {
  const play = (flags = [], collected = []) => {
    const game = createGame({ initial: defaultState(0), now: () => 0 });
    flags.forEach((f) => game.setFlag(f));
    collected.forEach((c) => game.collect(c));
    const d = createDialogue(DIALOGUE['a8.ending'], { check: (c) => check(c, game), apply: (fx) => applyEffects(fx, game) });
    for (let step = d.next(); step && step.type !== 'end'; step = d.next()) {
      if (step.type === 'choice') d.choose(0);
    }
    return game;
  };
  it('key clues found → Garden of Hope', () => {
    const g = play(['mission:unfinished-build', 'mission:hidden-passage']);
    expect(g.flag('ending-hope')).toBe(true);
    expect(g.flag('game-complete')).toBe(true);
  });
  it('most notes found → Garden of Memories', () => {
    const notes = Object.keys(COLLECTIBLES).filter((id) => id.startsWith('note.')).slice(0, 7);
    expect(play([], notes).flag('ending-memories')).toBe(true);
  });
  it('main story only → Garden Still Growing (still hopeful, still complete)', () => {
    const g = play();
    expect(g.flag('ending-growing')).toBe(true);
    expect(g.flag('game-complete')).toBe(true);
    expect(JOURNAL['ending-growing'].text).toMatch(/تكبر/);
  });
});

describe('saves, settings and tips (V2)', () => {
  it('a version-1 save migrates: the owl journal entry becomes «munther»', () => {
    expect(SAVE_VERSION).toBe(2);
    const v1 = { ...defaultState(0), v: 1, journal: ['snooki', 'hoot', 'clock'] };
    const up = normalize(migrate(structuredClone(v1)));
    expect(up.v).toBe(2);
    expect(up.journal).toEqual(['snooki', 'munther', 'clock']);
  });

  it('settings keep tips, seen tips and race difficulty, and reject junk', () => {
    expect(sanitizeSettings({ tips: false, tipsSeen: ['move', 3, 'move'], raceDifficulty: 'easy' })).toMatchObject({ tips: false, tipsSeen: ['move'], raceDifficulty: 'easy' });
    expect(sanitizeSettings({ raceDifficulty: 'insane' }).raceDifficulty).toBe('normal');
  });

  function memoryStorage() {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  }

  it('tips show one at a time, once each, can wait for overlays, and can be turned off', () => {
    const settings = createSettings({ storage: memoryStorage() });
    let blocked = true;
    const root = document.createElement('div');
    const tips = createTips(root, { settings, blocked: (t) => blocked && t.place !== 'top' });
    expect(tips.show('move')).toBe(true);
    expect(tips.current).toBeNull(); // waiting: an overlay covers the screen
    tips.show('hint'); // overlay tips are allowed
    expect(tips.current).toBe('hint');
    root.querySelector('[data-ok]').click();
    blocked = false;
    tips.refresh();
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(tips.current).toBe('move');
        expect(settings.get().tipsSeen).toContain('hint');
        expect(tips.show('hint')).toBe(false); // seen: never again
        root.querySelector('[data-off]').click();
        expect(settings.get().tips).toBe(false);
        expect(tips.show('journal')).toBe(false);
        tips.reset();
        expect(settings.get().tips).toBe(true);
        expect(settings.get().tipsSeen).toEqual([]);
        resolve();
      }, 300);
    });
  });

  it('every tip has an icon and text', () => {
    for (const [id, t] of Object.entries(TIPS)) expect(t.icon && t.text, id).toBeTruthy();
  });
});

describe('V2 minigame rules', () => {
  it('«أكل البيت» follows the three recipe scraps', () => {
    const r = RECIPES.find((x) => x.id === 'home-meal');
    expect(checkRecipe(r, ['egg', 'spinach', 'rice', 'carrot']).ok).toBe(true);
    expect(checkRecipe(r, ['egg', 'spinach', 'pizza', 'carrot']).ok).toBe(false);
    expect(checkRecipe(r, ['egg', 'spinach', 'carrot', 'fish']).reason).toMatch(/يشبّع/);
    expect(checkRecipe(r, exampleSolution(r)).ok).toBe(true);
  });

  it('stylist briefs accept the right look and name what is off', () => {
    expect(judgeLook(BRIEFS[1], { anjiOutfit: 'racer', snookiHat: 'goggles' })).toEqual([]);
    expect(judgeLook(BRIEFS[1], { anjiOutfit: 'cozy', snookiHat: 'goggles' })).toEqual(['anjiOutfit']);
    for (const b of BRIEFS) for (const [, ok] of Object.entries(b.need)) expect(ok.length).toBeGreaterThan(0);
  });

  it('the detective exam only asks about things the story showed, with valid answers', () => {
    for (const r of QUIZ_SETS.exam.rounds) {
      expect(r.options.some((o) => o.id === r.answer), r.clue).toBe(true);
      expect(r.explain).toBeTruthy();
    }
  });

  it('Robo-Snooki circuit is solvable and starts unsolved', () => {
    const level = parseLevel(PIPE_LEVELS.robo);
    const solved = level.grid.map((row) => row.map((c) => c.solved));
    expect(isSolved(level, solved)).toBe(true);
    expect(isSolved(level, scramble(level, 3))).toBe(false);
  });

  it('new map places point at real scenes', () => {
    for (const id of ['study', 'meadow']) expect(SCENES[WORLDS.find((w) => w.id === id).scene], id).toBeTruthy();
    expect(ITEMS['night-key']).toBeTruthy();
  });
});
