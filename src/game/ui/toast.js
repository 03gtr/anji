/**
 * Short, non-blocking notices (new item, collectible, unlock, hints, save
 * problems). Screen readers hear them through a polite live region.
 */
import { h, esc, tx } from './dom.js';
import { itemName, COLLECTIBLES, GROUP_NAMES } from '../data/items.js';
import { groupOf } from '../core/game.js';

export function createToasts(root, audio) {
  const box = h('<div class="toasts" role="status" aria-live="polite"></div>');
  root.append(box);

  function toast(text, kind = '') {
    const el = h(`<div class="toast ${kind ? `toast-${kind}` : ''}">${esc(tx(text))}</div>`);
    box.append(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    const ms = kind === 'hint' ? 6500 : 3600;
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 400);
    }, ms);
  }

  /** Turn a list of state changes into friendly notices. */
  function announce(changes = []) {
    for (const c of changes) {
      if (c.kind === 'item') toast(`حصلتي على: ${itemName(c.id)} 🎒`, 'item');
      else if (c.kind === 'collect') {
        const g = groupOf(c.id);
        toast(`${g === 'star' ? '⭐' : g === 'note' ? '📜' : g === 'seed' ? '🌱' : '🌸'} ${COLLECTIBLES[c.id]?.name || itemName(c.id)} — ${GROUP_NAMES[g] || ''}`, 'item');
      } else if (c.kind === 'unlock') toast(`انفتح: ${itemName(c.id)} ✨`, 'unlock');
      else if (c.kind === 'journal') toast(`اندوّنت بالدفتر: ${itemName(c.id)} 📖`, '');
      if (c.kind !== 'lost') audio?.play('pickup');
    }
  }

  return { toast, announce, el: box };
}
