/**
 * Synchronous state effects written as data in story and world content:
 *
 *   'flag:id'      set a story flag          '!flag:id'   clear it
 *   'item:id'      give one item             '-item:id'   take one
 *   'got:id'       collect a collectible     'journal:id' add a journal entry
 *   'unlock:id'    unlock a cosmetic / reward
 *   'seen:id'      mark a scene as seen
 *
 * A single string or an array of strings. Returns a list of what actually
 * changed, so the UI can announce new items and rewards.
 */
export function applyEffects(effects, game) {
  const list = effects == null ? [] : Array.isArray(effects) ? effects : [effects];
  const changes = [];
  for (const fx of list) {
    if (typeof fx !== 'string') throw new Error(`Bad effect: ${JSON.stringify(fx)}`);
    const neg = fx.startsWith('!') || fx.startsWith('-');
    const [kind, ...rest] = fx.replace(/^[!-]/, '').split(':');
    const id = rest.join(':');
    switch (kind) {
      case 'flag':
        if (neg) game.setFlag(id, false);
        else game.setFlag(id, true);
        break;
      case 'item':
        if (neg) {
          if (game.removeItem(id)) changes.push({ kind: 'lost', id });
        } else {
          game.addItem(id);
          changes.push({ kind: 'item', id });
        }
        break;
      case 'got':
        if (game.collect(id)) changes.push({ kind: 'collect', id });
        break;
      case 'journal':
        if (game.addJournal(id)) changes.push({ kind: 'journal', id });
        break;
      case 'unlock':
        if (game.unlock(id)) changes.push({ kind: 'unlock', id });
        break;
      case 'seen':
        game.markSeen(id);
        break;
      // Season 2 (its own document, core/game.js):
      case 'ev': // 'ev:e-wax' — evidence found (once)
        if (game.collect(`s2.ev.${id}`)) changes.push({ kind: 'evidence', id });
        break;
      case 'dec': {
        // 'dec:lead=anji' — a decision, stored once as a named value
        const cut = id.indexOf('=');
        game.setFlag(`s2:dec:${id.slice(0, cut)}`, id.slice(cut + 1));
        break;
      }
      case 'num': {
        // 'num:s2:quiz+1' — add to a number kept in a Season 2 flag
        const m = id.match(/^(s2:[\w:-]+?)([+-]\d+)$/);
        if (!m) throw new Error(`Bad num effect: ${fx}`);
        game.setFlag(m[1], Number(game.flag(m[1]) ?? 0) + Number(m[2]));
        break;
      }
      default:
        throw new Error(`Unknown effect: ${fx}`);
    }
  }
  return changes;
}

const KINDS = new Set(['flag', 'item', 'got', 'journal', 'unlock', 'seen', 'ev', 'dec', 'num']);
export function isValidEffect(fx) {
  if (typeof fx !== 'string' || !fx.includes(':')) return false;
  const kind = fx.replace(/^[!-]/, '').split(':')[0];
  if (!KINDS.has(kind)) return false;
  if (kind === 'dec') return /^dec:[\w-]+=[\w-]+$/.test(fx);
  if (kind === 'num') return /^num:s2:[\w:-]+?[+-]\d+$/.test(fx);
  return true;
}
