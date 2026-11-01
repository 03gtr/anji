/**
 * Season 3 «أصداء الـV8» — the mission modules (docs/season-3/TECHNICAL_ARCHITECTURE.md §4), the same contract as
 * Season 2's (data/m2/index.js, docs/season-2/MISSION_MODULES.md): each module is one mission's whole content; the
 * Season 3 registries (missions-s3.js, evidence-s3.js, puzzles-s3.js, dialogue/s3.js, scenes/s3.js) read them from
 * here, so a mission is added by writing its module and listing it below. Every id belongs to one module
 * (tests/game/s3-modules.test.js).
 */
import M01 from './m01-sabri.js';
import M02 from './m02-v8.js';
import M03 from './m03-echo.js';
import M04 from './m04-source.js';
import M05 from './m05-snooki.js';
import M06 from './m06-seven.js';
import M07 from './m07-roads.js';
import M08 from './m08-silence.js';

export const S3_MODULES = [M01, M02, M03, M04, M05, M06, M07, M08];

/** One registry part gathered from every module (lists are concatenated, maps merged — ids are checked by tests). */
export const gather = (key) => {
  const parts = S3_MODULES.map((m) => m[key]).filter(Boolean);
  return parts.every(Array.isArray) ? parts.flat() : Object.assign({}, ...parts);
};

/**
 * A module may extend a place that already exists: `patches[sceneId]` adds actors, drawings, interactables,
 * triggers and exits. An actor or interactable with an id the place already has is merged into it: its fields are
 * added, and its `cases` go BEFORE the place's own — so each added case must be gated on its own mission, and the
 * place behaves exactly as before until then.
 */
export function withS3(scene) {
  const patches = S3_MODULES.map((m) => m.patches?.[scene.id]).filter(Boolean);
  if (!patches.length) return scene;
  const merge = (base = [], extra = []) => {
    const out = base.map((x) => ({ ...x }));
    for (const e of extra) {
      const at = e.id ? out.findIndex((x) => x.id === e.id) : -1;
      if (at < 0) out.push(e);
      else {
        const own = out[at];
        out[at] = { ...own, ...e };
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
