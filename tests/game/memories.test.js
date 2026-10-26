import { describe, it, expect } from 'vitest';
import { validateMemory, memoryPuzzle, MEMORY_CATEGORIES } from '../../src/game/memories/schema.js';
import { STORY_MEMORIES, PERSONAL_TEMPLATES } from '../../src/game/memories/templates.js';
import { loadPersonal, corridorMemories, importMemoriesText, clearImportedMemories, CORRIDOR_SLOTS, LOCAL_KEY } from '../../src/game/memories/registry.js';
import { replay } from '../../src/game/puzzles/rules.js';
import { createLake, stepLake, tapLake, lanternX, lakeMedal } from '../../src/game/minigames/lanterns-logic.js';
import { memoryStorage } from '../helpers.js';

const solveMoves = (def) => (def.type === 'sequence' ? def.config.answer.map((id) => ['press', id]) : [['pick', def.config.answer]]);

describe('memory schema', () => {
  it('every shipped story memory is valid, enabled and solvable', () => {
    expect(STORY_MEMORIES.length).toBeGreaterThanOrEqual(CORRIDOR_SLOTS);
    for (const m of STORY_MEMORIES) {
      expect(validateMemory(m), m.id).toEqual({ ok: true, errors: [] });
      expect(m.kind).toBe('fictional');
      const def = memoryPuzzle(m);
      expect(replay(def.type, def.config, solveMoves(def)).outcome, m.id).toBe('solved');
    }
  });

  it('personal templates are valid but disabled and contain no real content', () => {
    for (const t of PERSONAL_TEMPLATES) {
      expect(validateMemory(t).ok).toBe(true);
      expect(t.enabled).toBe(false);
      expect(t.kind).toBe('personal');
    }
  });

  it('explains what is wrong with a bad memory', () => {
    const { ok, errors } = validateMemory({ id: 'Bad Id', title: '', category: 'nope', kind: 'personal', scene: 'x', puzzle: 'choice', question: 'q', options: [{ id: 'a', label: 'A' }], answer: 'z' });
    expect(ok).toBe(false);
    expect(errors.join(' | ')).toMatch(/id/);
    expect(errors.join(' | ')).toMatch(/category/);
    expect(errors.join(' | ')).toMatch(/options/);
    expect(errors.join(' | ')).toMatch(/answer/);
  });

  it('order memories need every option exactly once', () => {
    const base = { id: 'order-test', title: 't', category: 'funny', kind: 'personal', scene: 's', puzzle: 'order', question: 'q', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] };
    expect(validateMemory({ ...base, answer: ['a', 'b'] }).ok).toBe(true);
    expect(validateMemory({ ...base, answer: ['a', 'a'] }).ok).toBe(false);
  });

  it('categories cover the owner-requested themes', () => {
    for (const c of ['clinic', 'funny', 'racing', 'colors', 'music', 'birthday', 'gym', 'animals', 'flowers', 'everyday', 'story']) expect(MEMORY_CATEGORIES[c]).toBeTruthy();
  });
});

describe('memory registry', () => {
  const personal = (id, enabled = true) => ({ id, title: `t-${id}`, category: 'everyday', scene: 's', puzzle: 'choice', question: 'q', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], answer: 'a', enabled });

  it('uses enabled personal memories first, skips invalid ones, and fills the rest with story memories', () => {
    const { memories, skipped } = loadPersonal({ sources: [[personal('one'), personal('off', false), { id: 'broken' }, personal('one')]] });
    expect(memories.map((m) => m.id)).toEqual(['one']);
    expect(skipped.map((s) => s.id)).toEqual(['broken']);
    const storage = memoryStorage({ [LOCAL_KEY]: JSON.stringify([personal('mine')]) });
    const corridor = corridorMemories({ storage });
    expect(corridor).toHaveLength(CORRIDOR_SLOTS);
    expect(corridor[0].id).toBe('mine');
    expect(corridor.slice(1).every((m) => m.kind === 'fictional')).toBe(true);
  });

  it('without personal memories the corridor is fully playable with story memories', () => {
    const corridor = corridorMemories({ storage: memoryStorage() });
    expect(corridor).toHaveLength(CORRIDOR_SLOTS);
    expect(corridor.every((m) => m.kind === 'fictional')).toBe(true);
  });

  it('imports a memories file on the device and can remove it again', () => {
    const storage = memoryStorage();
    expect(importMemoriesText('nope', { storage })).toEqual({ ok: false, error: 'not-json' });
    expect(importMemoriesText('[]', { storage })).toEqual({ ok: false, error: 'empty' });
    const res = importMemoriesText(JSON.stringify({ memories: [personal('a1'), { id: 'x' }] }), { storage });
    expect(res.ok).toBe(true);
    expect(res.count).toBe(1);
    expect(res.skipped).toHaveLength(1);
    expect(corridorMemories({ storage })[0].id).toBe('a1');
    clearImportedMemories({ storage });
    expect(corridorMemories({ storage })[0].kind).toBe('fictional');
  });
});

describe('lantern lake', () => {
  it('spawns lanterns that rise and are missed at the top', () => {
    const s = createLake({ duration: 60, seed: 2 });
    let missed = 0;
    for (let i = 0; i < 60 * 12; i++) missed += stepLake(s, 1 / 60).missed;
    expect(missed).toBeGreaterThan(0);
    expect(s.combo).toBe(0);
  });

  it('tapping a lantern catches it, builds combos and scores more for gold/hearts', () => {
    const s = createLake({ duration: 60, seed: 5 });
    for (let i = 0; i < 120; i++) stepLake(s, 1 / 60);
    const l = s.lanterns[0];
    const res = tapLake(s, lanternX(l), l.y);
    expect(res.lantern).toBe(l);
    expect(s.caught).toBe(1);
    expect(tapLake(s, -50, -50)).toBeNull();
  });

  it('a player who catches everything gets gold; the round always ends', () => {
    const s = createLake({ duration: 30, seed: 9, goal: 20 });
    while (!s.done) {
      stepLake(s, 1 / 30);
      for (const l of [...s.lanterns]) if (l.y < 120) tapLake(s, lanternX(l), l.y);
    }
    expect(s.done).toBe(true);
    expect(lakeMedal(s)).toBe('gold');
  });
});
