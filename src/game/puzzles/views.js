/**
 * Puzzle views: render the current state and wire controls to api.act().
 * Re-rendered after every action; keyboard focus is restored by data-k keys,
 * so playing with Tab/Enter keeps working.
 */
import { symbol } from '../ui/symbols.js';
import { esc, tx } from '../ui/dom.js';

function rerender(body, html, wire) {
  const focused = document.activeElement?.closest?.('[data-k]')?.dataset.k;
  body.innerHTML = html;
  wire();
  if (focused) body.querySelector(`[data-k="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
}

const glyph = (g) => (g.startsWith('sym:') ? symbol(g.slice(4)) : `<span class="glyph-char">${esc(g)}</span>`);

export const VIEWS = {
  sequence: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      rerender(
        body,
        `<div class="seq-progress" aria-label="التقدم">${config.answer.map((_, i) => `<span class="${i < s.pressed.length ? 'on' : ''}"></span>`).join('')}</div>
         <div class="seq-grid" style="--n:${config.items.length}">
          ${config.items
            .map(
              (it) => `<button type="button" class="seq-item ${s.pressed.includes(it.id) ? 'is-lit' : ''}" data-k="${it.id}" data-id="${it.id}" aria-label="${esc(tx(it.label))}" aria-pressed="${s.pressed.includes(it.id)}">
                ${symbol(it.icon)}<span>${esc(tx(it.label))}</span></button>`,
            )
            .join('')}
         </div>`,
        () => body.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => api.act('press', b.dataset.id))),
      );
    },
  },

  choice: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      rerender(
        body,
        `${config.question ? `<p class="choice-q">${esc(tx(config.question))}</p>` : ''}
         <div class="choice-grid">
          ${config.options
            .map(
              (o) => `<button type="button" class="choice-item ${s.tried.includes(o.id) ? 'is-wrong' : ''} ${s.picked === o.id ? 'is-right' : ''}" data-k="${o.id}" data-id="${o.id}" ${s.tried.includes(o.id) ? 'disabled' : ''}>
                ${o.icon ? symbol(o.icon) : ''}<span>${esc(tx(o.label))}</span></button>`,
            )
            .join('')}
         </div>`,
        () => body.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => api.act('pick', b.dataset.id))),
      );
    },
  },

  lock: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const show = (i) => {
        const sym = config.symbols[s.dials[i]];
        return sym.startsWith('sym:') ? symbol(sym.slice(4)) : `<span class="dial-char">${esc(sym)}</span>`;
      };
      rerender(
        body,
        `<div class="lock-dials">
          ${s.dials
            .map(
              (_, i) => `<div class="dial">
                <button type="button" class="dial-btn" data-k="u${i}" data-i="${i}" data-d="1" aria-label="الخانة ${i + 1}: التالي">▲</button>
                <div class="dial-face" aria-live="polite">${show(i)}</div>
                <button type="button" class="dial-btn" data-k="d${i}" data-i="${i}" data-d="-1" aria-label="الخانة ${i + 1}: السابق">▼</button>
                ${config.dialLabels ? `<span class="dial-label">${esc(tx(config.dialLabels[i]))}</span>` : ''}
              </div>`,
            )
            .join('')}
         </div>
         <button type="button" class="btn btn-primary lock-submit" data-k="submit">جرّبي الفتح 🔓</button>`,
        () => {
          body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => api.act('turn', Number(b.dataset.i), Number(b.dataset.d))));
          body.querySelector('.lock-submit').addEventListener('click', () => api.act('submit'));
        },
      );
    },
  },

  cipher: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const sel = api.selected ?? s.guesses.findIndex((g, i) => g == null && config.given?.[i] == null);
      rerender(
        body,
        `<div class="cipher-row" dir="rtl">
          ${config.glyphs
            .map(
              (g, i) => `<button type="button" class="cipher-cell ${i === sel ? 'is-sel' : ''} ${config.given?.[i] != null ? 'is-given' : ''}" data-k="c${i}" data-cell="${i}" aria-label="الرمز ${i + 1}${s.guesses[i] ? `: ${s.guesses[i]}` : ''}">
                <span class="cipher-glyph">${glyph(g)}</span><span class="cipher-letter">${esc(s.guesses[i] ?? '؟')}</span></button>`,
            )
            .join('')}
         </div>
         ${config.key ? `<div class="cipher-key">${config.key.map(([g, l]) => `<span>${glyph(g)}<b>= ${esc(l)}</b></span>`).join('')}</div>` : ''}
         <div class="cipher-pad">${config.letters.map((l) => `<button type="button" class="pad-btn" data-k="l${l}" data-letter="${esc(l)}">${esc(l)}</button>`).join('')}</div>
         <button type="button" class="btn btn-primary" data-k="submit" data-submit>تأكيد</button>`,
        () => {
          body.querySelectorAll('[data-cell]').forEach((b) =>
            b.addEventListener('click', () => {
              api.selected = Number(b.dataset.cell);
              VIEWS.cipher.render(body, api);
            }),
          );
          body.querySelectorAll('[data-letter]').forEach((b) =>
            b.addEventListener('click', () => {
              if (sel < 0) return;
              api.act('set', sel, b.dataset.letter);
              const next = api.state.guesses.findIndex((g, i) => g == null && config.given?.[i] == null);
              api.selected = next >= 0 ? next : sel;
              VIEWS.cipher.render(body, api);
            }),
          );
          body.querySelector('[data-submit]').addEventListener('click', () => {
            const out = api.act('submit');
            if (out === 'noop') api.say('بعد أكو رموز فارغة.', 'bad');
          });
        },
      );
    },
  },

  switches: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      rerender(
        body,
        `<div class="switch-grid" style="--n:${config.size}">
          ${s.on
            .map(
              (on, i) => `<button type="button" class="switch ${on ? 'is-on' : ''}" data-k="s${i}" data-i="${i}" aria-pressed="${on}" aria-label="فانوس ${i + 1} ${on ? 'شاعل' : 'طافي'}">
                <span class="lantern"></span></button>`,
            )
            .join('')}
         </div>
         <p class="switch-moves">حركات: ${s.moves}</p>`,
        () => body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => api.act('press', Number(b.dataset.i)))),
      );
    },
  },

  rings: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const size = 240;
      const ringsSvg = s.pos
        .map((p, i) => {
          const r = 104 - i * 30;
          const rot = (p / config.steps) * 360;
          const sym = config.symbols[i];
          return `<g transform="rotate(${rot} 120 120)" class="ring-g">
            <circle cx="120" cy="120" r="${r}" fill="none" stroke="${['#3b3d7e', '#4a3f8e', '#5a4fa0'][i % 3]}" stroke-width="26"/>
            <circle cx="120" cy="120" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
            <svg x="${120 - 13}" y="${120 - r - 13}" width="26" height="26" viewBox="0 0 48 48">${symbol(sym).replace(/<\/?svg[^>]*>/g, '')}</svg>
          </g>`;
        })
        .join('');
      rerender(
        body,
        `<div class="rings-wrap">
          <svg class="rings-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="الحلقات">
            <circle cx="120" cy="120" r="120" fill="#121640"/>
            ${ringsSvg}
            <path d="M120 0 L112 14 H128Z" fill="#ffe28a"/>
            <circle cx="120" cy="120" r="14" fill="#ffe28a"/>
          </svg>
          <div class="rings-controls">
            ${s.pos
              .map(
                (_, i) => `<div class="ring-ctl"><span>${esc(tx(config.labels?.[i] ?? `حلقة ${i + 1}`))}</span>
                  <button type="button" class="dial-btn" data-k="l${i}" data-i="${i}" data-d="-1" aria-label="لف الحلقة ${i + 1} لليسار">⟲</button>
                  <button type="button" class="dial-btn" data-k="r${i}" data-i="${i}" data-d="1" aria-label="لف الحلقة ${i + 1} لليمين">⟳</button></div>`,
              )
              .join('')}
          </div>
         </div>`,
        () => body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => api.act('turn', Number(b.dataset.i), Number(b.dataset.d)))),
      );
    },
  },

  deduction: {
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      rerender(
        body,
        `<h3 class="ded-h">مَن؟</h3>
         <div class="ded-grid">
          ${config.suspects
            .map(
              (p) => `<button type="button" class="ded-card ${s.suspect === p.id ? 'is-sel' : ''}" data-k="p${p.id}" data-suspect="${p.id}" aria-pressed="${s.suspect === p.id}">
                ${p.icon ? symbol(p.icon) : ''}<b>${esc(tx(p.label))}</b><small>${esc(tx(p.note || ''))}</small></button>`,
            )
            .join('')}
         </div>
         <h3 class="ded-h">الدليل (${config.need || 2})</h3>
         <div class="ded-grid">
          ${config.evidence
            .map(
              (e) => `<button type="button" class="ded-card ${s.evidence.includes(e.id) ? 'is-sel' : ''}" data-k="e${e.id}" data-evidence="${e.id}" aria-pressed="${s.evidence.includes(e.id)}">
                ${e.icon ? symbol(e.icon) : ''}<b>${esc(tx(e.label))}</b><small>${esc(tx(e.note || ''))}</small></button>`,
            )
            .join('')}
         </div>
         <button type="button" class="btn btn-primary" data-k="submit" data-submit>أعلني الحل 🔎</button>`,
        () => {
          body.querySelectorAll('[data-suspect]').forEach((b) => b.addEventListener('click', () => api.act('pickSuspect', b.dataset.suspect)));
          body.querySelectorAll('[data-evidence]').forEach((b) => b.addEventListener('click', () => api.act('toggleEvidence', b.dataset.evidence)));
          body.querySelector('[data-submit]').addEventListener('click', () => {
            if (api.act('submit') === 'noop') api.say(`اختاري مشتبه بيه و${config.need || 2} أدلة.`, 'bad');
          });
        },
      );
    },
  },
};
