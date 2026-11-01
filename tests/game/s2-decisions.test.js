/**
 * Season 2 — the decision audit: every decision (M1's and the Living Story's), every value of it, where she makes it
 * and where the story reads it. A value nobody can choose, or that nothing reads, is a broken promise to the
 * player. (tests/game/s2-m03.test.js checks each value is read; here each value is also made somewhere, and the
 * audit table in docs/season-2/DECISIONS.md is the one these data give — S2_DECISIONS_DOC=1 rewrites it.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { isS2 } from '../../src/game/core/game.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { PUZZLES } from '../../src/game/data/puzzles.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { DECISIONS_S2 } from '../../src/game/data/evidence-s2.js';
import { DECISIONS_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';

const ALL = { ...DECISIONS_S2, ...DECISIONS_S2_M2 };
const EFFECT_KEYS = new Set(['fx', 'do', 'reward']);

/** Every `dec:` string in Season 2's data, as a setter (inside an effect list) or a reader (anywhere else). */
function audit() {
  const set = {};
  const read = {};
  const add = (map, key, value, where) => {
    ((map[key] ??= {})[value] ??= new Set()).add(where);
  };
  const walk = (x, where, effect) => {
    if (typeof x === 'string') {
      const m = x.match(/^!?dec:([a-z-]+)(?:=([a-z-]+))?$/);
      if (!m) return;
      const [, key, value] = m;
      if (effect) add(set, key, value, where);
      else for (const v of value ? [value] : ALL[key] || []) add(read, key, v, where); // `dec:key` alone: any value
      return;
    }
    if (Array.isArray(x)) return x.forEach((y) => walk(y, where, effect));
    if (!x || typeof x !== 'object') return;
    for (const [k, v] of Object.entries(x)) walk(v, where, effect || EFFECT_KEYS.has(k));
  };
  for (const s of Object.values(SCENES)) if (isS2(s.id)) walk([s.interact, s.actors, s.triggers, s.dynamic, s.exits], `scene ${s.id}`, false);
  for (const [k, d] of Object.entries(DIALOGUE)) if (k.startsWith('s2')) walk(d, `dialogue ${k}`, false);
  for (const [k, p] of Object.entries(PUZZLES)) if (k.startsWith('s2')) walk(p, `puzzle ${k}`, false);
  for (const m of MISSIONS) if (m.id.startsWith('s2')) walk([m.unlock, m.steps], `mission ${m.id}`, false);
  // Ryan's reactions read rabi-reply in code (progression/social.js: replyFrom), not in data
  for (const v of ALL['rabi-reply']) add(read, 'rabi-reply', v, 'progression/social.js (Ryan\'s reaction)');
  return { set, read };
}

describe('the decision audit (every decision, every value: made somewhere, read somewhere)', () => {
  const { set, read } = audit();

  for (const [key, values] of Object.entries(ALL)) {
    it(`${key}: each of ${values.join(' / ')} can be chosen, and changes something later`, () => {
      for (const v of values) {
        expect(set[key]?.[v]?.size ?? 0, `dec:${key}=${v} is made somewhere`).toBeGreaterThan(0);
        expect(read[key]?.[v]?.size ?? 0, `dec:${key}=${v} is read somewhere`).toBeGreaterThan(0);
      }
      // no value is made that the registry does not list
      for (const v of Object.keys(set[key] || {})) expect(values, `dec:${key}=${v} is a listed value`).toContain(v);
    });
  }

  it('no decision is made or read that the registries do not list', () => {
    for (const key of [...Object.keys(set), ...Object.keys(read)]) expect(ALL[key], key).toBeTruthy();
  });

  it('the audit table in docs/season-2/DECISIONS.md is the one the data give', () => {
    const rows = Object.entries(ALL).map(([key, values]) => {
      const cell = (map, v) => [...(map[key]?.[v] || [])].sort().join('<br>');
      return values.map((v, i) => `| ${i ? '' : `**${key}**`} | \`${v}\` | ${cell(set, v)} | ${cell(read, v)} |`).join('\n');
    });
    const doc = [
      '# Season 2 — decision audit',
      '',
      'Generated from the game data by `tests/game/s2-decisions.test.js` (run it with `S2_DECISIONS_DOC=1` to rewrite',
      'this file); the same test fails if any value cannot be chosen or is never read. "Made at": where an effect sets',
      'the value (a dialogue choice, a scene action). "Read at": every condition that tests it. Each read is a change',
      'the player meets later (a line, a person who comes or not, a route, a puzzle\'s start); the per-mission tests',
      'play both values through (tests/game/s2-m0*.test.js, tests/game/s2-living.test.js) and',
      'tests/game/s2-campaign.test.js plays Missions 01–06 in one save, each decision both ways.',
      '',
      '| Decision | Value | Made at | Read at |',
      '|---|---|---|---|',
      ...rows,
      '',
    ].join('\n');
    const file = path.resolve('docs/season-2/DECISIONS.md'); // (vitest runs from the project root)
    if (process.env.S2_DECISIONS_DOC) fs.writeFileSync(file, doc);
    expect(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).toBe(doc);
  });
});
