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
      default:
        throw new Error(`Unknown effect: ${fx}`);
    }
  }
  return changes;
}

const KINDS = new Set(['flag', 'item', 'got', 'journal', 'unlock', 'seen']);
export function isValidEffect(fx) {
  return typeof fx === 'string' && KINDS.has(fx.replace(/^[!-]/, '').split(':')[0]) && fx.includes(':');
}
