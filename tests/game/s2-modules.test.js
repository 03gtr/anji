/**
 * Season 2, M2 — the mission modules share one namespace (data/m2/index.js). `gather` concatenates lists and
 * merges maps, so two modules (or a module and M1) using the same id would not fail: the later one would
 * silently replace the earlier. Missions 02 and 04 once both named a place `s2-shed`; these checks keep every
 * id one module's own.
 */
import { describe, it, expect } from 'vitest';
import { M2_MODULES } from '../../src/game/data/m2/index.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { EVIDENCE_S2, DECISIONS_S2, JOURNAL_S2 } from '../../src/game/data/evidence-s2.js';
import { PUZZLES_S2 } from '../../src/game/data/puzzles-s2.js';
import { S2 } from '../../src/game/data/dialogue/s2.js';
import { MISSIONS_S2 } from '../../src/game/data/missions-s2.js';
import { EVIDENCE_S2_M2, DECISIONS_S2_M2, JOURNAL_S2_M2, CASE_S2_M2 } from '../../src/game/data/evidence-s2-m2.js';
import { MISSIONS as GRAPH } from '../../docs/season-2/graph.mjs';
import { PUZZLES_S2_M2 } from '../../src/game/data/puzzles-s2-m2.js';
import { S2_M2 } from '../../src/game/data/dialogue/s2-m2.js';
import { MISSIONS_S2_M2 } from '../../src/game/data/missions-s2-m2.js';

/** Every id one registry part of each module defines (map keys, or list items' `id`/`mission`). */
const idsOf = (m, key) => {
  const part = m[key];
  if (!part) return [];
  return Array.isArray(part) ? part.map((x) => x.id ?? x.mission) : Object.keys(part);
};
const owners = (key) => {
  const seen = new Map();
  for (const m of M2_MODULES) for (const id of idsOf(m, key)) seen.set(id, [...(seen.get(id) || []), m.id]);
  return seen;
};
// M1's registries (Missions s2-01…s2-11, and Mission 01 «سر المكتب» written straight into the M2 registries)
const M1 = {
  evidence: [...Object.keys(EVIDENCE_S2), 'f-rota', 'f-calendar', 'f-sticky', 'f-print', 'e-versions'],
  decisions: [...Object.keys(DECISIONS_S2), 'office-cover'],
  journal: Object.keys(JOURNAL_S2),
  puzzles: [...Object.keys(PUZZLES_S2), 's2-who-said'],
  dialogue: Object.keys(S2),
  missions: [...MISSIONS_S2.map((x) => x.id), 's2-12'],
};

describe('Season 2 mission modules: every id belongs to one module', () => {
  for (const key of ['missions', 'evidence', 'decisions', 'case', 'journal', 'puzzles', 'dialogue', 'scenes']) {
    it(`no two modules define the same ${key} id`, () => {
      const twice = [...owners(key)].filter(([, by]) => by.length > 1);
      expect(twice).toEqual([]);
    });
  }

  for (const key of Object.keys(M1)) {
    it(`no module redefines one of M1's ${key}`, () => {
      const mine = new Set(M1[key]);
      const clash = M2_MODULES.flatMap((m) => idsOf(m, key).filter((id) => mine.has(id)).map((id) => `${m.id}:${id}`));
      expect(clash).toEqual([]);
    });
  }

  it("each module's places are the ones the game registers (none replaced by another's)", () => {
    for (const m of M2_MODULES) {
      for (const s of m.scenes || []) {
        expect(SCENES[s.id], s.id).toBeTruthy();
        expect(SCENES[s.id].title, s.id).toBe(s.title);
        expect(SCENES[s.id].seed, s.id).toBe(s.seed);
      }
    }
  });

  it("every module's evidence, decision, puzzle, dialogue line and mission reaches the registries as written", () => {
    for (const m of M2_MODULES) {
      for (const [id, ev] of Object.entries(m.evidence || {})) expect(EVIDENCE_S2_M2[id], id).toBe(ev);
      for (const [id, v] of Object.entries(m.decisions || {})) expect(DECISIONS_S2_M2[id], id).toBe(v);
      for (const [id, j] of Object.entries(m.journal || {})) expect(JOURNAL_S2_M2[id], id).toBe(j);
      for (const [id, p] of Object.entries(m.puzzles || {})) expect(PUZZLES_S2_M2[id], id).toBe(p);
      for (const [id, d] of Object.entries(m.dialogue || {})) expect(S2_M2[id], id).toBe(d);
      for (const ms of m.missions || []) expect(MISSIONS_S2_M2.filter((x) => x.id === ms.id), ms.id).toEqual([ms]);
    }
  });

  it('the evidence graph and the notebook agree: what each mission yields is what its notebook page adds', () => {
    for (const c of CASE_S2_M2) {
      const g = GRAPH.find((m) => m.id === c.mission);
      expect(g, c.mission).toBeTruthy();
      for (const e of g.yields) {
        expect(c.ids, `${c.mission} yields ${e}`).toContain(e);
        expect(EVIDENCE_S2_M2[e], e).toBeTruthy();
      }
      // a module's notebook page lists only its own evidence
      const m = M2_MODULES.find((x) => x.missions[0].id === c.mission);
      if (m) for (const e of c.ids) expect(m.evidence?.[e], `${c.mission}: ${e}`).toBeTruthy();
    }
    // whatever a mission needs is registered evidence, yielded by a mission it comes after
    for (const g of GRAPH.filter((m) => /^s2-1[2-7]$/.test(m.id))) {
      for (const e of g.needs) {
        expect(EVIDENCE_S2[e] || EVIDENCE_S2_M2[e], `${g.id} needs ${e}`).toBeTruthy();
        expect(GRAPH.some((m) => m.id < g.id && m.yields.includes(e)), `${g.id} needs ${e}`).toBe(true); // ids sort in story order
      }
    }
  });

  it('the missions lead one to the next: 01 → 02 → 03 → 04 → 05 → 06', () => {
    const order = ['s2-12', 's2-13', 's2-14', 's2-15', 's2-16', 's2-17'];
    const byId = Object.fromEntries(MISSIONS_S2_M2.map((x) => [x.id, x]));
    expect(MISSIONS_S2_M2.map((x) => x.id)).toEqual(order);
    order.forEach((id, i) => expect(byId[id].leadsTo, id).toEqual(order[i + 1] ? [order[i + 1]] : []));
  });
});
