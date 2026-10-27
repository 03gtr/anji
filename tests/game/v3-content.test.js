/**
 * V3 content: the games room. Save migration v2 → v3, dialogue coverage for
 * every game and moment, rewards and unlocks, activities/pranks reachability,
 * the duet and clock rules, memory-template privacy, the character asset
 * manifest, and the public build's private-content guard.
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defaultState, migrate, normalize, SAVE_VERSION, MAX_GIFTS, createSaveManager } from '../../src/game/core/save.js';
import { createGame } from '../../src/game/core/game.js';
import { HUB_LINES, HUB_GAMES, MOMENTS, linesFor, pickLines } from '../../src/game/data/hub-lines.js';
import { ACTIVITIES, PRANKS } from '../../src/game/data/activities.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { COSMETICS, JOURNAL } from '../../src/game/data/items.js';
import { PIECES } from '../../src/game/minigames/garden-logic.js';
import { CARD_BACKS } from '../../src/game/tabletop/ui.js';
import { createDuet, pressPad, shownPattern, duetMedal } from '../../src/game/tabletop/duet.js';
import { clock, arrange, replay, solve } from '../../src/game/puzzles/rules.js';
import { validateMemory } from '../../src/game/memories/schema.js';
import { loadPersonal, withMemoryLabels } from '../../src/game/memories/registry.js';
import { STORY_MEMORIES } from '../../src/game/memories/templates.js';
import { CHARACTER_ASSETS, PRIVATE_ASSETS } from '../../src/game/art/manifest.js';
import { PRIVATE_ART, PRIVATE_MEMORIES } from '@private-sources';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { walkScript } from '../../src/game/narrative/dialogue.js';
import { isValidEffect } from '../../src/game/core/effects.js';
import { memoryStorage } from '../helpers.js';

const root = resolve(__dirname, '../..');

/* every flag / unlock set anywhere */
const EFFECTS = (() => {
  const out = [];
  const push = (fx) => [].concat(fx || []).forEach((e) => typeof e === 'string' && out.push(e));
  for (const p of Object.values(PUZZLES)) push(p.reward);
  for (const m of Object.values(MINIGAMES)) push([...(m.reward || []), ...(m.goldReward || [])]);
  const visit = (list) => {
    for (const a of [].concat(list || [])) {
      if (!a || typeof a === 'function') continue;
      push(a.fx);
      if (Array.isArray(a.say)) walkScript(a.say, (n) => {
        push(n.do);
        for (const o of n.choice || []) push(o.do);
      });
      visit(a.then);
      visit(a.else);
    }
  };
  for (const s of Object.values(SCENES)) {
    for (const it of s.interact || []) [it.run, ...(it.cases || []).map((c) => c.run)].forEach(visit);
    for (const t of s.triggers || []) visit(t.run);
  }
  for (const a of [...ACTIVITIES, ...PRANKS]) visit(a.run);
  return out;
})();

describe('save v3', () => {
  it('migrates a v2 save: card back + games-room section, nothing lost', () => {
    expect(SAVE_VERSION).toBe(3);
    const v2 = { ...defaultState(0), v: 2, flags: { 'study-done': true }, journal: ['munther'] };
    delete v2.hub;
    delete v2.cosmetics.cardBack;
    const up = normalize(migrate(structuredClone(v2)));
    expect(up.v).toBe(3);
    expect(up.cosmetics.cardBack).toBe('classic');
    expect(up.hub).toEqual({ lines: {}, gifts: [], daily: null });
    expect(up.flags['study-done']).toBe(true);
    expect(up.journal).toEqual(['munther']);
  });
  it('validates games-room data: bad gifts dropped, list bounded, junk ignored', () => {
    const raw = { ...defaultState(0), hub: { lines: { a: 2, b: -1, c: 'x' }, gifts: [{ wrap: 'rose', ribbon: 'blue', flower: 'none', note: 'smile' }, { wrap: 5 }, ...Array(40).fill({ wrap: 'a', ribbon: 'b', flower: 'c', note: 'd' })], daily: 'yesterday' } };
    const n = normalize(raw);
    expect(n.hub.lines).toEqual({ a: 2 });
    expect(n.hub.gifts).toHaveLength(MAX_GIFTS);
    expect(n.hub.gifts[0]).toEqual({ wrap: 'rose', ribbon: 'blue', flower: 'none', note: 'smile' });
    expect(n.hub.daily).toBeNull();
  });
  it('export → import keeps the games-room progress', () => {
    const storage = memoryStorage();
    const saves = createSaveManager({ storage, now: () => 0 });
    const game = createGame({ initial: defaultState(0), saveManager: saves, now: () => 0 });
    game.addGift({ wrap: 'midnight', ribbon: 'gold', flower: 'blue-rose', note: 'garden' });
    game.setCosmetic('cardBack', 'stars');
    game.nextLine('any:win', 3);
    const back = saves.importText(saves.exportText(game.state));
    expect(back.hub.gifts).toHaveLength(1);
    expect(back.cosmetics.cardBack).toBe('stars');
    expect(back.hub.lines['any:win']).toBe(1);
  });
  it('dialogue lines rotate (and wrap around) so they rarely repeat', () => {
    const game = createGame({ initial: defaultState(0), now: () => 0 });
    expect([0, 1, 2, 3].map(() => game.nextLine('k', 3))).toEqual([0, 1, 2, 0]);
    for (let i = 0; i < MAX_GIFTS; i++) game.addGift({ wrap: 'a', ribbon: 'b', flower: 'c', note: 'd' });
    expect(game.addGift({ wrap: 'a', ribbon: 'b', flower: 'c', note: 'd' })).toBe(false);
  });
});

describe('games-room dialogue', () => {
  it('every game has lines for every moment (own or generic)', () => {
    for (const g of [...HUB_GAMES, 'revenge']) for (const m of MOMENTS) expect(linesFor(g, m).length, `${g}:${m}`).toBeGreaterThan(0);
    expect(HUB_LINES['room:first'].length).toBeGreaterThan(0);
    expect(HUB_LINES['room:again'].length).toBeGreaterThan(1);
  });
  it('lines are well formed: Ryan speaks as his playing version, Snooki with valid expressions', () => {
    for (const [key, pool] of Object.entries(HUB_LINES)) {
      for (const script of pool) {
        expect(script.length, key).toBeGreaterThan(0);
        for (const l of script) {
          expect(['ryanpc', 'snooki'], key).toContain(l.s);
          expect(l.t.trim(), key).toBeTruthy();
        }
      }
    }
  });
  it('Ryan never claims to be live or watching, and never pressures her to play', () => {
    const ryan = Object.values(HUB_LINES).flat(2).filter((l) => l.s === 'ryanpc').map((l) => l.t).join('\n');
    expect(ryan).not.toMatch(/أراقبچ|أشوفچ هسه|بالبث|مباشر|لازم تلعبين|لازم ترجعين/);
    expect(HUB_LINES['room:first'].flat().map((l) => l.t).join(' ')).toMatch(/نسخة/); // says what it is
  });
  it('picking rotates through the game pool and the generic pool', () => {
    let i = 0;
    const next = (k, n) => i++ % n;
    const a = pickLines('checkers', 'win', next);
    const b = pickLines('checkers', 'win', next);
    expect(a).not.toEqual(b);
  });
});

describe('activities and pranks', () => {
  it('there are at least 7 activities and 10 pranks, each runnable and rewarded', () => {
    expect(ACTIVITIES.length).toBeGreaterThanOrEqual(7);
    expect(PRANKS.length).toBeGreaterThanOrEqual(10);
    for (const a of [...ACTIVITIES, ...PRANKS]) {
      expect(a.title && a.text && a.done, a.id).toBeTruthy();
      const refs = JSON.stringify(a.run);
      for (const [, p] of refs.matchAll(/"puzzle":"([^"]+)"/g)) expect(PUZZLES[p], `${a.id} → ${p}`).toBeTruthy();
      for (const [, g] of refs.matchAll(/"game":"([^"]+)"/g)) expect(MINIGAMES[g], `${a.id} → ${g}`).toBeTruthy();
      // the "done" flag is set by some reward → every entry can be completed
      const flag = a.done.replace(/^flag:/, '');
      expect(EFFECTS.includes(`flag:${flag}`), `${a.id}: nothing sets ${flag}`).toBe(true);
    }
  });
  it('every V3 reward is a valid effect pointing at real content', () => {
    for (const e of EFFECTS.filter((x) => /cardback|jester|outfit-garden|hub-|prank|delivery|picnic|chocolates|duet|gift|promise|waiting-clock|gameroom/.test(x))) {
      expect(isValidEffect(e), e).toBe(true);
      const [kind, id] = e.replace(/^[!-]/, '').split(':');
      if (kind === 'unlock') expect(COSMETICS[id], e).toBeTruthy();
      if (kind === 'journal') expect(JOURNAL[id], e).toBeTruthy();
    }
  });
  it('card backs: every cosmetic has a design, and every design can be unlocked', () => {
    const backs = Object.entries(COSMETICS).filter(([, c]) => c.slot === 'cardBack');
    for (const [, c] of backs) expect(CARD_BACKS[c.value], c.value).toBeTruthy();
    for (const [key, c] of backs) if (!c.free) expect(EFFECTS.includes(`unlock:${key}`), key).toBe(true);
  });
  it('every new garden decoration unlocks from something the player can do', () => {
    for (const [id, p] of Object.entries(PIECES)) {
      if (!p.unlock || !p.unlock.startsWith('flag:') || p.unlock.startsWith('flag:mission:') || p.unlock === 'flag:game-complete') continue;
      expect(EFFECTS.includes(p.unlock), `${id} needs ${p.unlock}`).toBe(true);
    }
  });
  it('comedy targets Snooki and situations, never Anji', () => {
    const text = JSON.stringify([...PRANKS, ...Object.entries(PUZZLES).filter(([k]) => /prank|treasure|sign|decoy|404|wake|shadow|paw|surprise|expert/.test(k))]);
    expect(text).not.toMatch(/أنجي (غبية|بطيئة|ما تفهم)|شكلچ|وزنچ/);
  });
});

describe('duet and clock rules', () => {
  it('duet: the pattern grows each round, a miss replays, no game over', () => {
    const s = createDuet(3, { length: 3 });
    expect(shownPattern(s)).toHaveLength(1);
    expect(pressPad(s, s.seq[0])).toBe('round');
    expect(shownPattern(s)).toHaveLength(2);
    expect(pressPad(s, (s.seq[0] + 1) % 4)).toBe('miss');
    expect(s.done).toBe(false);
    expect(shownPattern(s)).toHaveLength(2);
    pressPad(s, s.seq[0]);
    expect(pressPad(s, s.seq[1])).toBe('round');
    for (const p of s.seq) pressPad(s, p);
    expect(s.done).toBe(true);
    expect(duetMedal(s)).toBe('silver');
  });
  it('waiting clock accepts "around 2:30" (±15 min), not a rigid minute', () => {
    const cfg = PUZZLES['waiting-clock'].config;
    const at = (h, m) => clock.submit(cfg, { h, m, mistakes: 0 }).outcome;
    expect(at(2, 30)).toBe('solved');
    expect(at(2, 15)).toBe('solved');
    expect(at(2, 45)).toBe('solved');
    expect(at(3, 0)).toBe('wrong');
    expect(replay('clock', cfg, solve('clock', cfg)).outcome).toBe('solved');
  });
  it('arrange: identical pieces are interchangeable; a full wrong box says how many are right', () => {
    const cfg = PUZZLES['chocolate-box'].config;
    expect(replay('arrange', cfg, solve('arrange', cfg)).outcome).toBe('solved');
    let s = arrange.init();
    cfg.slots.forEach((slot, i) => {
      s = arrange.pick(cfg, s, cfg.pieces[i].id).state;
      s = arrange.place(cfg, s, slot.id).state;
    });
    const r = arrange.check(cfg, s);
    expect(r.outcome).toBe('wrong');
    expect(r.message).toMatch(/من ٩|من 9/);
  });
});

describe('memory templates stay private', () => {
  it('story memories in the repo are fictional; no personal entries ship', () => {
    expect(STORY_MEMORIES.every((m) => m.kind === 'fictional')).toBe(true);
    expect(PRIVATE_MEMORIES).toEqual({}); // tests and public builds never bundle private/memories.json
    expect(PRIVATE_ART).toEqual({});
  });
  it('new fields validate; drafts are never shown in normal play', () => {
    const base = { id: 'pic-1', title: 'حلويات', category: 'everyday', kind: 'personal', enabled: true, scene: 'مشهد', puzzle: 'reveal' };
    expect(validateMemory({ ...base, object: 'picnic:sweet', status: 'confirmed', location: 'الحديقة' }).ok).toBe(true);
    expect(validateMemory({ ...base, object: 'bad object' }).ok).toBe(false);
    expect(validateMemory({ ...base, status: 'secret' }).ok).toBe(false);
    const { memories } = loadPersonal({ sources: [[{ ...base, status: 'draft' }, { ...base, id: 'pic-2', status: 'confirmed' }]] });
    expect(memories.map((m) => m.id)).toEqual(['pic-2']);
  });
  it('the picnic uses owner memories for its labels only when they exist', () => {
    const def = PUZZLES.picnic;
    expect(withMemoryLabels(def, 'picnic', { sources: [[]] })).toBe(def);
    const mem = { id: 'pic-3', title: 'الكيك الصغير', category: 'everyday', kind: 'personal', enabled: true, scene: 'مشهد', puzzle: 'reveal', object: 'picnic:sweet' };
    const dressed = withMemoryLabels(def, 'picnic', { sources: [[mem]] });
    expect(dressed.config.pieces.find((p) => p.id === 'sweets').label).toBe('الكيك الصغير');
    expect(dressed.config.slots).toEqual(def.config.slots);
  });
});

describe('character asset manifest', () => {
  it('lists every character, pose and expression with unique ids and files', () => {
    expect(new Set(CHARACTER_ASSETS.map((a) => a.id)).size).toBe(CHARACTER_ASSETS.length);
    expect(new Set(CHARACTER_ASSETS.map((a) => a.file)).size).toBe(CHARACTER_ASSETS.length);
    for (const c of ['anji', 'snooki', 'ryan', 'munther']) expect(CHARACTER_ASSETS.some((a) => a.character === c), c).toBe(true);
    for (const id of ['anji/view/front', 'anji/view/back', 'anji/expression/pout', 'anji/expression/shy', 'snooki/pose/bark', 'snooki/pose/stubborn', 'ryan/view/front-backlit', 'munther/expression/confused']) {
      expect(CHARACTER_ASSETS.some((a) => a.id === id), id).toBe(true);
    }
  });
  it('every public asset renders with the shared lighting model and is exported to docs/art', () => {
    for (const a of CHARACTER_ASSETS) {
      const svg = a.render();
      expect(svg.startsWith('<svg'), a.id).toBe(true);
      expect(a.public).toBe(true);
      expect(a.file.startsWith('docs/art/'), a.id).toBe(true);
      if (a.id !== 'ryan/shadow') expect(svg, a.id).toMatch(/feDiffuseLighting/);
      expect(existsSync(resolve(root, a.file)), `run npm run art:export (${a.file})`).toBe(true);
    }
  });
  it('private assets are marked private and live only in git-ignored folders', () => {
    for (const a of PRIVATE_ASSETS) {
      expect(a.public).toBe(false);
      expect(a.file.startsWith('private-art/') || a.file.startsWith('private/')).toBe(true);
    }
  });
});
