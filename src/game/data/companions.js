/**
 * Which dogs are in a scene, and with whom (the owner's correction): Snooki is Ryan's dog;
 * Anji's own dog is the white husky she names.
 *
 *   Before the ending  Snooki walks with Anji: Ryan sent him to guide her (the original
 *                      story, unchanged for every save that has not finished it).
 *   After the ending   Snooki stays with Ryan: next to him wherever Ryan is in the scene,
 *                      otherwise away with him. Anji walks with her husky once she has met her.
 *                      Snooki joins Anji again only when a story brings him along
 *                      (SNOOKI_JOINS: an unfinished story he is part of, or a scene that says
 *                      so with `dogsAfter: { snooki: 'follow' }`, like a walk with all four).
 *                      Where Ryan is in the scene, Snooki is beside him.
 *   A scene that places the husky itself (an actor) keeps her there, never a second copy.
 *
 * Nothing here is saved: it is read from story flags each time a scene starts, so no save
 * changes and no dog is ever renamed, replaced or handed to the other person.
 */
import { check } from '../core/conditions.js';
import { HUSKY_MET } from './missions-sp2.js';

/**
 * After the ending, Snooki tags along while a story he is in is still open: Story Pack 01's
 * roads (he was there when she met the husky), Story Pack 02's archive if she plays it late
 * (he is her co-detective), and the deep garden's case until the second rose is planted
 * (he is, after all, the suspect).
 */
export const SNOOKI_JOINS = {
  any: [
    '!flag:sp1-done',
    ['flag:sp2-entered', '!flag:sp2-done'],
    ['flag:dg-box', '!flag:dg-planted'],
  ],
};

const present = (scene, kind, game) => (scene.actors || []).find((a) => a.kind === kind && check(a.if, game)) ?? null;

/**
 * @returns {{ snooki: 'follow'|'ryan'|'away', husky: 'follow'|'placed'|'away', ryanX: number|null }}
 */
export function dogsIn(scene, game) {
  const ryan = present(scene, 'ryan', game);
  const husky = present(scene, 'husky', game) ? 'placed' : 'away';
  if (!game.flag('game-complete')) return { snooki: 'follow', husky, ryanX: ryan?.x ?? null };
  const herDog = husky === 'placed' ? 'placed' : check(HUSKY_MET, game) ? 'follow' : 'away';
  // where Ryan is, Snooki is beside him; elsewhere he joins her only when a story brings him
  let snooki = scene.dogsAfter?.snooki ?? (ryan ? 'ryan' : check(SNOOKI_JOINS, game) ? 'follow' : 'away');
  if (snooki === 'ryan' && !ryan) snooki = 'away';
  // she is never left with no dog at all before she has met her own
  if (snooki === 'away' && herDog === 'away') snooki = 'follow';
  return { snooki, husky: herDog, ryanX: ryan?.x ?? null };
}
