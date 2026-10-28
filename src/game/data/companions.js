/**
 * Which dogs are in a scene, and with whom (the owner's rule): Snooki is Ryan's dog; Anji's
 * own dog is the white husky she names. The canonical turning point is the meeting under the
 * blue rose tree in the hidden garden (the `meet` trigger of the `final` scene).
 *
 *   Before the meeting  Snooki walks with Anji: Ryan sent him to bring her to him (his mission;
 *                       the original story, unchanged).
 *   At the meeting      Snooki's mission ends there: he goes to Ryan and stays (`stay` action in
 *                       the meeting itself, so even the rest of that scene agrees).
 *   After the meeting   Snooki is with Ryan: beside him wherever Ryan is in the scene, otherwise
 *                       away with him, never her companion when she is on her own. Anji walks
 *                       with her own husky once she has met her (before that, on her own). Where
 *                       a scene brings the two of them together and says so (`together: true`,
 *                       e.g. the walk with all four), both dogs come along.
 *   A scene that places the husky itself (an actor) keeps her there, never a second copy.
 *
 * Nothing here is saved: it is read from story flags each time a scene starts, so no save
 * changes, no mission or journal entry is touched, and no dog is renamed or replaced.
 */
import { check } from '../core/conditions.js';
import { HUSKY_MET } from './missions-sp2.js';

/**
 * The meeting has happened: its one-time trigger fired (set the moment it starts), or the
 * ending it leads to is complete (every finished save, whatever version it was made with).
 */
export const MET_RYAN = { any: ['flag:t.final.meet', 'flag:game-complete'] };

const present = (scene, kind, game) => (scene.actors || []).find((a) => a.kind === kind && check(a.if, game)) ?? null;

/**
 * @returns {{ snooki: 'follow'|'ryan'|'away', husky: 'follow'|'placed'|'away', ryanX: number|null }}
 */
export function dogsIn(scene, game) {
  const ryan = present(scene, 'ryan', game);
  const placed = present(scene, 'husky', game) ? 'placed' : 'away';
  if (!check(MET_RYAN, game)) return { snooki: 'follow', husky: placed, ryanX: ryan?.x ?? null };
  const husky = placed === 'placed' ? 'placed' : check(HUSKY_MET, game) ? 'follow' : 'away';
  // both owners together in this scene (and the scene says they walk as one): both dogs come along
  if (scene.together && ryan) return { snooki: 'follow', husky, ryanX: ryan.x };
  return { snooki: ryan ? 'ryan' : 'away', husky, ryanX: ryan?.x ?? null };
}
