/**
 * Content integrity: every reference between story data, scenes, puzzles,
 * minigames, items and the map must resolve, and every collectible must be
 * physically reachable. These tests catch dead ends before a player does.
 */
import { describe, it, expect } from 'vitest';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MINIGAMES } from '../../src/game/minigames/registry.js';
import { CINEMATICS } from '../../src/game/data/cinematics.js';
import { ITEMS, COLLECTIBLES, JOURNAL, COSMETICS } from '../../src/game/data/items.js';
import { WORLDS, ROUTES } from '../../src/game/data/worlds.js';
import { ACTS } from '../../src/game/data/chapters.js';
import { walkScript } from '../../src/game/narrative/dialogue.js';
import { atoms } from '../../src/game/core/conditions.js';
import { isValidEffect } from '../../src/game/core/effects.js';
import { KNOWN_SPEAKERS } from '../../src/game/characters/portraits.js';
import { ANJI_EXPRESSIONS } from '../../src/game/characters/anji.js';
import { SNOOKI_EXPRESSIONS } from '../../src/game/characters/snooki.js';
import { MOVE } from '../../src/game/world/physics.js';
import { GROUND } from '../../src/game/world/props.js';

const EXPR = { anji: ANJI_EXPRESSIONS, snooki: SNOOKI_EXPRESSIONS, needle: ['cheerful', 'determined', 'sneaky'], ryan: ['back', 'turn'] };
const COND_KINDS = new Set(['flag', 'item', 'got', 'seen', 'record', 'medal', 'count']);

/** Every action (recursively) in a scene. */
function sceneActions(scene) {
  const out = [];
  const visit = (list) => {
    for (const a of [].concat(list || [])) {
      if (typeof a === 'function') continue;
      out.push(a);
      visit(a.then);
      visit(a.else);
    }
  };
  visit(scene.enter);
  for (const it of scene.interact || []) {
    visit(it.run);
    for (const c of it.cases || []) visit(c.run);
  }
  for (const t of scene.triggers || []) visit(t.run);
  for (const e of scene.exits || []) visit(e.locked);
  return out;
}

function sceneConditions(scene) {
  const conds = [];
  const push = (c) => c !== undefined && conds.push(c);
  push(scene.snookiHidden);
  for (const k of ['platforms', 'blockers', 'items', 'actors', 'dynamic', 'interact', 'triggers', 'exits']) for (const x of scene[k] || []) push(x.if);
  for (const it of scene.interact || []) for (const c of it.cases || []) push(c.if);
  for (const a of sceneActions(scene)) push(a.if);
  return conds;
}

function checkEffect(fx, where) {
  for (const e of [].concat(fx)) {
    expect(isValidEffect(e), `${where}: bad effect ${e}`).toBe(true);
    const [kind, ...rest] = e.replace(/^[!-]/, '').split(':');
    const id = rest.join(':');
    if (kind === 'item') expect(ITEMS[id], `${where}: unknown item ${id}`).toBeTruthy();
    if (kind === 'got') expect(COLLECTIBLES[id], `${where}: unknown collectible ${id}`).toBeTruthy();
    if (kind === 'journal') expect(JOURNAL[id], `${where}: unknown journal entry ${id}`).toBeTruthy();
    if (kind === 'unlock') expect(COSMETICS[id], `${where}: unknown unlock ${id}`).toBeTruthy();
  }
}

function checkCondition(cond, where) {
  for (const atom of atoms(cond)) expect(COND_KINDS.has(atom.split(':')[0]), `${where}: bad condition ${atom}`).toBe(true);
}

function checkScript(script, where) {
  walkScript(script, (n) => {
    if (n.s) expect(KNOWN_SPEAKERS.has(n.s), `${where}: unknown speaker ${n.s}`).toBe(true);
    if (n.e && EXPR[n.s]) expect(EXPR[n.s], `${where}: ${n.s} has no expression "${n.e}"`).toContain(n.e);
    if (n.do) checkEffect(n.do, where);
    if ('if' in n) checkCondition(n.if, where);
  });
}

describe('dialogue content', () => {
  for (const [id, script] of Object.entries(DIALOGUE)) {
    it(`${id} is well formed`, () => checkScript(script, id));
  }
  for (const [id, shots] of Object.entries(CINEMATICS)) {
    it(`cinematic ${id} is well formed`, () => shots.forEach((s, i) => s.say && checkScript(s.say, `${id}#${i}`)));
  }
});

describe('scenes', () => {
  for (const scene of Object.values(SCENES)) {
    describe(scene.id, () => {
      it('every referenced dialogue, puzzle, minigame, cinematic and scene exists', () => {
        for (const a of sceneActions(scene)) {
          if (typeof a.say === 'string') expect(DIALOGUE[a.say], `dialogue ${a.say}`).toBeTruthy();
          if (Array.isArray(a.say)) checkScript(a.say, `${scene.id} inline`);
          if (a.puzzle) expect(PUZZLES[a.puzzle], `puzzle ${a.puzzle}`).toBeTruthy();
          if (a.game) expect(MINIGAMES[a.game], `minigame ${a.game}`).toBeTruthy();
          if (a.cine) expect(CINEMATICS[a.cine], `cinematic ${a.cine}`).toBeTruthy();
          // a scene may point at a location that is registered on the map but not built yet
          if (a.goto) expect(SCENES[a.goto] || WORLDS.some((w) => w.id === a.goto && !w.ready), `scene ${a.goto}`).toBeTruthy();
          if (a.fx) checkEffect(a.fx, scene.id);
        }
      });

      it('every condition is valid', () => sceneConditions(scene).forEach((c) => checkCondition(c, scene.id)));

      it('interactables have unique ids, labels and sit inside the scene', () => {
        const ids = (scene.interact || []).map((i) => i.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const it of scene.interact || []) {
          expect(it.label, it.id).toBeTruthy();
          expect(it.x).toBeGreaterThan(0);
          expect(it.x).toBeLessThan(scene.width);
        }
      });

      it('exits lead to known scenes or to places marked as not built yet', () => {
        for (const ex of scene.exits || []) {
          const known = SCENES[ex.to] || WORLDS.some((w) => w.scene === ex.to && !w.ready);
          expect(known, `exit to ${ex.to}`).toBeTruthy();
        }
      });

      it('every collectible is registered and physically reachable', () => {
        const jump = MOVE.jumpVelocity ** 2 / (2 * MOVE.gravity); // ≈105 units
        const HEIGHT = 112; // Anji's drawn height
        // surfaces she can stand on: the ground plus platforms reachable by chains of jumps
        const surfaces = [{ x: 0, w: scene.width, y: GROUND }];
        let added = true;
        while (added) {
          added = false;
          for (const p of scene.platforms || []) {
            if (surfaces.includes(p)) continue;
            const fromSome = surfaces.some((s) => p.y >= s.y - jump + 4 && p.x < s.x + s.w + 80 && p.x + p.w > s.x - 80);
            if (fromSome) {
              surfaces.push(p);
              added = true;
            }
          }
        }
        for (const item of scene.items || []) {
          expect(COLLECTIBLES[item.id], `register ${item.id}`).toBeTruthy();
          expect(COLLECTIBLES[item.id].world, item.id).toBe(scene.id);
          const iy = item.y ?? GROUND - 40;
          const ok = surfaces.some((s) => item.x >= s.x - 30 && item.x <= s.x + s.w + 30 && iy >= s.y - jump - HEIGHT - 6 && iy <= s.y + 4);
          expect(ok, `${item.id} at (${item.x}, ${iy}) cannot be reached`).toBe(true);
        }
      });
    });
  }

  it('every registered collectible appears somewhere a player can find it', () => {
    const placed = new Set(Object.values(SCENES).flatMap((s) => (s.items || []).map((i) => i.id)));
    const viaFx = new Set(
      [...Object.values(SCENES).flatMap((s) => sceneActions(s)), ...Object.values(DIALOGUE).flat()]
        .flatMap((a) => [].concat(a.fx || a.do || []))
        .filter((e) => typeof e === 'string' && e.startsWith('got:'))
        .map((e) => e.slice(4)),
    );
    for (const id of Object.keys(COLLECTIBLES)) {
      const minigame = id.startsWith('petal.'); // collected inside the maze
      expect(placed.has(id) || viaFx.has(id) || minigame, `${id} is never placed`).toBe(true);
    }
  });
});

describe('world map and chapters', () => {
  it('playable locations point at real scenes or minigames', () => {
    for (const w of WORLDS.filter((x) => x.ready)) {
      expect(w.scene ? SCENES[w.scene] : MINIGAMES[w.game], w.id).toBeTruthy();
    }
  });
  it('routes connect existing locations', () => {
    for (const [a, b] of ROUTES) expect(WORLDS.some((w) => w.id === a) && WORLDS.some((w) => w.id === b)).toBe(true);
  });
  it('chapter objectives use valid conditions', () => {
    for (const act of ACTS) for (const o of act.objectives) checkCondition(o.done, `act ${act.act}`);
  });
});
