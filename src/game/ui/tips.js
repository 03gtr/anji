/**
 * Contextual tips: short, one-at-a-time cards that explain a control the
 * first time it matters (moving, inspecting, the map, hints…). Each tip is
 * shown once per device, can be dismissed, and all tips can be turned off
 * (here or in Settings). The permanent reference is the help screen.
 */
import { h, esc } from './dom.js';

export const TIPS = {
  move: { icon: '👣', text: 'امشي بالأسهم ◀ ▶ تحت، أو المسي الأرض بالمشهد حتى تمشين لهناك. زر ⬆ للقفز.' },
  interact: { icon: '✋', text: 'لمن تطلع علامة فوق شي قريب، المسي زر «فحص» (أو المسي الشي نفسه).' },
  glow: { icon: '✨', text: 'الأشياء اللي تلمع بنجمة صغيرة ما فحصتيها بعد. بعضها بيها أسرار ومهمات جانبية.' },
  map: { icon: '🗺️', text: 'انفتحت الخريطة! المسي زر الخريطة فوق حتى تسافرين بين الأماكن اللي انفتحت.' },
  journal: { icon: '📖', text: 'الدفتر يحفظ الأدلة والرسائل والمهمات. إذا نسيتي شنو الخطوة الجاية، افتحيه.' },
  missions: { icon: '🧭', text: 'انفتحت مهمة جانبية! تلگينها بالدفتر ← «المهمات»، ويّا الخطوة الجاية وتلميح.' },
  hint: { icon: '💡', place: 'top', text: 'إذا علگتي، زر «تلميح» يساعدچ خطوة بخطوة. وبعد التلميحات تگدرين تشوفين الحل أو تتخطين اللغز — والقصة تكمل.' },
  minigame: { icon: '⏸', place: 'top', text: 'بأي لعبة تگدرين توقفين ⏸ وتعيدين من البداية أو ترجعين للمغامرة. ماكو خسارة.' },
};

/**
 * @param {{ settings, audio, blocked?: (tip) => boolean }} deps — `blocked`
 *   says when a tip must wait (e.g. exploration tips while a menu, puzzle or
 *   minigame covers the screen); call refresh() when that may have changed.
 */
export function createTips(root, { settings, audio, blocked = () => false }) {
  const layer = h('<div class="tips" aria-live="polite"></div>');
  root.append(layer);
  const queue = [];
  let showing = null;

  const seen = (id) => settings.get().tipsSeen.includes(id);
  const markSeen = (id) => {
    if (!seen(id)) settings.set({ tipsSeen: [...settings.get().tipsSeen, id] });
  };

  function next() {
    if (showing || !queue.length || !settings.get().tips) return;
    const k = queue.findIndex((x) => !blocked(TIPS[x]));
    if (k === -1) return;
    const [id] = queue.splice(k, 1);
    if (seen(id)) return next();
    const tip = TIPS[id];
    showing = id;
    layer.dataset.place = tip.place || 'bottom';
    const card = h(`<div class="tip" role="status" data-tip="${id}">
        <span class="tip-icon" aria-hidden="true">${tip.icon}</span>
        <p>${esc(tip.text)}</p>
        <div class="tip-actions">
          <button type="button" class="btn btn-small btn-primary" data-ok>فهمت</button>
          <button type="button" class="btn btn-small btn-ghost" data-off>إيقاف النصائح</button>
        </div></div>`);
    const done = () => {
      markSeen(id);
      card.classList.add('out');
      setTimeout(() => {
        card.remove();
        showing = null;
        next();
      }, 220);
    };
    card.querySelector('[data-ok]').addEventListener('click', done);
    card.querySelector('[data-off]').addEventListener('click', () => {
      queue.length = 0;
      settings.set({ tips: false });
      done();
    });
    layer.replaceChildren(card);
    audio?.play('page');
  }

  return {
    /** Queue a tip (ignored when tips are off or it was already seen). */
    show(id) {
      if (!TIPS[id] || !settings.get().tips || seen(id) || showing === id || queue.includes(id)) return false;
      queue.push(id);
      next();
      return true;
    },
    /** Try again to show a waiting tip (after an overlay closed). */
    refresh() {
      // a tip that may not stay (an overlay just opened) waits for later
      if (showing && blocked(TIPS[showing])) {
        queue.unshift(showing);
        showing = null;
        layer.replaceChildren();
      }
      next();
    },
    get current() {
      return showing;
    },
    dismissAll() {
      queue.length = 0;
      layer.replaceChildren();
      showing = null;
    },
    /** Show every tip again (from Settings). */
    reset() {
      settings.set({ tipsSeen: [], tips: true });
    },
    el: layer,
  };
}
