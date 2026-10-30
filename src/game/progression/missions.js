/**
 * Mission progress, derived from story flags (see data/missions.js).
 * A mission is: locked (unlock condition false) → active (some step open) →
 * complete (every step done; recorded once as `flag:mission:<id>` with its
 * reward applied). Completion is permanent even if a later step condition
 * would change (e.g. an item is used up).
 */
import { check } from '../core/conditions.js';
import { applyEffects } from '../core/effects.js';
import { MISSIONS } from '../data/missions.js';

const safe = (cond, game) => {
  try {
    return check(cond, game);
  } catch {
    return false;
  }
};

/** @returns {{ status: 'locked'|'active'|'complete', step: number, next: object|null }} */
export function missionState(m, game) {
  if (game.flag(`mission:${m.id}`)) return { status: 'complete', step: m.steps.length, next: null };
  if (!safe(m.unlock, game)) return { status: 'locked', step: 0, next: null };
  const i = m.steps.findIndex((s) => !safe(s.done, game));
  if (i === -1) return { status: 'complete', step: m.steps.length, next: null };
  return { status: 'active', step: i, next: m.steps[i] };
}

/**
 * Record newly completed missions (apply rewards once) and report newly
 * unlocked ones, so the UI can announce both.
 * `{ season2 }`: only Season 2's missions (after a change to Season 2's own save, so that
 * nothing of the original campaign is written because of Season 2).
 */
export function syncMissions(game, { season2 = false } = {}) {
  const completed = [];
  const unlocked = [];
  for (const m of season2 ? MISSIONS.filter((x) => x.pack === 's2') : MISSIONS) {
    const done = `mission:${m.id}`;
    if (game.flag(done)) continue;
    const st = missionState(m, game);
    if (st.status === 'locked') continue;
    if (!game.flag(`mission-seen:${m.id}`)) {
      game.setFlag(`mission-seen:${m.id}`);
      unlocked.push(m);
    }
    if (st.status === 'complete') {
      game.setFlag(done);
      completed.push({ ...m, changes: applyEffects(m.reward, game) });
    }
  }
  return { completed, unlocked };
}

export const activeMissions = (game) => MISSIONS.filter((m) => missionState(m, game).status === 'active');
export const completedMissions = (game) => MISSIONS.filter((m) => game.flag(`mission:${m.id}`));
