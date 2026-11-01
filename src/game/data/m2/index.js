/**
 * Season 2, M2 — the Living Story's mission modules (docs/season-2/MISSION_MODULES.md). Each module is one
 * mission's whole content; the M2 registries (missions-, puzzles-, evidence-s2-m2.js, dialogue/s2-m2.js,
 * scenes/s2-m2.js) read them from here, so a mission is added by writing its module and listing it below.
 * Mission 01 «سر المكتب» predates the modules and lives in those registries directly.
 */
import M02 from './m02-snooki.js';
import M03 from './m03-jojo.js';
import M04 from './m04-sister.js';
import M05 from './m05-night.js';
import M06 from './m06-truth.js';

export const M2_MODULES = [M02, M03, M04, M05, M06];

/** One registry part gathered from every module (lists are concatenated, maps merged — ids are checked by tests). */
export const gather = (key) => {
  const parts = M2_MODULES.map((m) => m[key]).filter(Boolean);
  return parts.every(Array.isArray) ? parts.flat() : Object.assign({}, ...parts);
};

/**
 * A module may extend a place that already exists (M1's or another mission's): `patches[sceneId]` adds actors,
 * drawings, interactables, triggers and exits. An actor or interactable with an id the place already has is
 * merged into it: its fields are added, and its `cases` go BEFORE the place's own — so each added case must be
 * gated on its own mission, and the place behaves exactly as before until then.
 */
export function withM2(scene) {
  const patches = M2_MODULES.map((m) => m.patches?.[scene.id]).filter(Boolean);
  if (!patches.length) return scene;
  const merge = (base = [], extra = []) => {
    const out = base.map((x) => ({ ...x }));
    for (const e of extra) {
      const at = e.id ? out.findIndex((x) => x.id === e.id) : -1;
      if (at < 0) out.push(e);
      else {
        const own = out[at];
        out[at] = { ...own, ...e };
        // the added cases first; the place's own (its `cases`, or its single `run`) after them
        if (e.cases) out[at] = { ...out[at], run: undefined, cases: [...e.cases, ...(own.cases || (own.run ? [{ run: own.run }] : []))] };
      }
    }
    return out;
  };
  return patches.reduce(
    (s, p) => ({
      ...s,
      actors: merge(s.actors, p.actors),
      interact: merge(s.interact, p.interact),
      dynamic: [...(s.dynamic || []), ...(p.dynamic || [])],
      triggers: [...(s.triggers || []), ...(p.triggers || [])],
      exits: [...(s.exits || []), ...(p.exits || [])],
    }),
    scene,
  );
}
