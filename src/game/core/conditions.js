/**
 * Data-friendly conditions used by story, quests, world objects and unlocks.
 *
 *   undefined / null        → true
 *   'flag:id'               → story flag set (truthy)
 *   '!flag:id'              → negation (works with every form)
 *   'item:id'               → item in inventory
 *   'got:id'                → collectible / note already collected
 *   'seen:id'               → cinematic or dialogue already seen
 *   'record:gameId'         → minigame completed at least once
 *   'medal:gameId:silver'   → at least that medal in a minigame
 *   'count:stars>=5'        → collected count of a group (see game.countGroup)
 *   [a, b, …]               → all of them
 *   { any: [a, b] }         → at least one
 *   { not: c }              → negation
 *   (game) => boolean       → escape hatch for code-defined content
 */
const MEDALS = { bronze: 1, silver: 2, gold: 3 };

export function check(cond, game) {
  if (cond == null) return true;
  if (typeof cond === 'function') return Boolean(cond(game));
  if (Array.isArray(cond)) return cond.every((c) => check(c, game));
  if (typeof cond === 'object') {
    if ('any' in cond) return cond.any.some((c) => check(c, game));
    if ('not' in cond) return !check(cond.not, game);
    if ('all' in cond) return check(cond.all, game);
    throw new Error(`Unknown condition object: ${JSON.stringify(cond)}`);
  }
  if (typeof cond !== 'string') throw new Error(`Unknown condition: ${String(cond)}`);
  if (cond.startsWith('!')) return !check(cond.slice(1), game);

  const [kind, ...rest] = cond.split(':');
  const arg = rest.join(':');
  switch (kind) {
    case 'flag':
      return Boolean(game.flag(arg));
    case 'item':
      return game.hasItem(arg);
    case 'got':
      return game.has(arg);
    case 'seen':
      return game.seen(arg);
    case 'record':
      return Boolean(game.record(arg)?.completed);
    case 'medal': {
      const cut = arg.lastIndexOf(':');
      const id = arg.slice(0, cut);
      const medal = arg.slice(cut + 1);
      return (MEDALS[game.record(id)?.medal] || 0) >= (MEDALS[medal] || 1);
    }
    case 'count': {
      const m = arg.match(/^([\w-]+)\s*(>=|<=|==|>|<)\s*(\d+)$/);
      if (!m) throw new Error(`Bad count condition: ${cond}`);
      const n = game.countGroup(m[1]);
      const k = Number(m[3]);
      return { '>=': n >= k, '<=': n <= k, '==': n === k, '>': n > k, '<': n < k }[m[2]];
    }
    // Season 2 (stored in its own document by core/game.js):
    case 'ev': // 'ev:e-wax' — a piece of evidence she has (data/evidence-s2.js)
      return game.has(`s2.ev.${arg}`);
    case 'dec': {
      // 'dec:lead=anji' — a decision she made (registry: data/evidence-s2.js DECISIONS)
      const cut = arg.indexOf('=');
      return game.flag(`s2:dec:${arg.slice(0, cut)}`) === arg.slice(cut + 1);
    }
    case 'num': {
      // 'num:s2:quiz>=2' — a number kept in a Season 2 flag (absent = 0)
      const m = arg.match(/^(s2:[\w:-]+?)\s*(>=|<=|==|>|<)\s*(-?\d+)$/);
      if (!m) throw new Error(`Bad num condition: ${cond}`);
      const n = Number(game.flag(m[1]) ?? 0);
      const k = Number(m[3]);
      return { '>=': n >= k, '<=': n <= k, '==': n === k, '>': n > k, '<': n < k }[m[2]];
    }
    default:
      throw new Error(`Unknown condition kind: ${cond}`);
  }
}

/** Collect every string atom used in a condition (for content validation). */
export function atoms(cond, out = []) {
  if (cond == null || typeof cond === 'function') return out;
  if (Array.isArray(cond)) cond.forEach((c) => atoms(c, out));
  else if (typeof cond === 'object') atoms(cond.any ?? cond.not ?? cond.all, out);
  else out.push(cond.replace(/^!/, ''));
  return out;
}
