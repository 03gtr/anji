/**
 * Puzzle views: render the current state and wire controls to api.act().
 * Re-rendered after every action; keyboard focus is restored by data-k keys,
 * so playing with Tab/Enter keeps working.
 *
 * When the player asks for the solution (api.showSolution), views that
 * support it (`solution: true`) highlight the next moves from rules.solve().
 */
import { symbol } from '../ui/symbols.js';
import { esc, tx } from '../ui/dom.js';
import { solve, flipCandles, programSolution } from './rules.js';

function rerender(body, html, wire) {
  const focused = document.activeElement?.closest?.('[data-k]')?.dataset.k;
  body.innerHTML = html;
  wire();
  if (focused) body.querySelector(`[data-k="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
}

const glyph = (g) => (g.startsWith('sym:') ? symbol(g.slice(4)) : `<span class="glyph-char">${esc(g)}</span>`);
/** Next moves from the current state, only when the solution was requested. */
const shown = (api) => (api.showSolution ? solve(api.def.type, api.def.config, api.state) || [] : []);

export const VIEWS = {
  sequence: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const next = shown(api)[0]?.[1];
      rerender(
        body,
        `<div class="seq-progress" aria-label="التقدم">${config.answer.map((_, i) => `<span class="${i < s.pressed.length ? 'on' : ''}"></span>`).join('')}</div>
         <div class="seq-grid" style="--n:${config.items.length}">
          ${config.items
            .map(
              (it) => `<button type="button" class="seq-item ${s.pressed.includes(it.id) ? 'is-lit' : ''} ${next === it.id ? 'is-solution' : ''}" data-k="${it.id}" data-id="${it.id}" aria-label="${esc(tx(it.label))}" aria-pressed="${s.pressed.includes(it.id)}">
                ${it.icon ? symbol(it.icon) : ''}<span>${esc(tx(it.label))}</span></button>`,
            )
            .join('')}
         </div>`,
        () => body.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => api.act('press', b.dataset.id))),
      );
    },
  },

  choice: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const right = api.showSolution ? config.answer : null;
      rerender(
        body,
        `${config.question ? `<p class="choice-q">${esc(tx(config.question))}</p>` : ''}
         <div class="choice-grid">
          ${config.options
            .map(
              (o) => `<button type="button" class="choice-item ${s.tried.includes(o.id) ? 'is-wrong' : ''} ${s.picked === o.id ? 'is-right' : ''} ${right === o.id ? 'is-solution' : ''}" data-k="${o.id}" data-id="${o.id}" ${s.tried.includes(o.id) ? 'disabled' : ''}>
                ${o.icon ? symbol(o.icon) : ''}<span>${esc(tx(o.label))}</span></button>`,
            )
            .join('')}
         </div>`,
        () => body.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => api.act('pick', b.dataset.id))),
      );
    },
  },

  lock: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const show = (idx) => {
        const sym = config.symbols[idx];
        return sym.startsWith('sym:') ? symbol(sym.slice(4)) : `<span class="dial-char">${esc(sym)}</span>`;
      };
      rerender(
        body,
        `<div class="lock-dials">
          ${s.dials
            .map(
              (d, i) => `<div class="dial ${api.showSolution && d === config.answer[i] ? 'is-right' : ''}">
                <button type="button" class="dial-btn" data-k="u${i}" data-i="${i}" data-d="1" aria-label="الخانة ${i + 1}: التالي">▲</button>
                <div class="dial-face" aria-live="polite">${show(d)}</div>
                <button type="button" class="dial-btn" data-k="d${i}" data-i="${i}" data-d="-1" aria-label="الخانة ${i + 1}: السابق">▼</button>
                ${config.dialLabels ? `<span class="dial-label">${esc(tx(config.dialLabels[i]))}</span>` : ''}
                ${api.showSolution ? `<span class="dial-answer" aria-label="الجواب">${show(config.answer[i])}</span>` : ''}
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
    solution: true,
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
                <span class="cipher-glyph">${glyph(g)}</span><span class="cipher-letter">${esc(s.guesses[i] ?? '؟')}</span>
                ${api.showSolution && config.given?.[i] == null ? `<small class="cipher-answer">${esc(config.word[i])}</small>` : ''}</button>`,
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
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const marks = new Set(shown(api).map((m) => m[1]));
      rerender(
        body,
        `<div class="switch-grid" style="--n:${config.size}">
          ${s.on
            .map(
              (on, i) => `<button type="button" class="switch ${on ? 'is-on' : ''} ${marks.has(i) ? 'is-solution' : ''}" data-k="s${i}" data-i="${i}" aria-pressed="${on}" aria-label="فانوس ${i + 1} ${on ? 'شاعل' : 'طافي'}${marks.has(i) ? '، المسيه' : ''}">
                <span class="lantern"></span></button>`,
            )
            .join('')}
         </div>
         <p class="switch-moves">شاعلة: ${s.on.filter(Boolean).length} من ${s.on.length} · حركات: ${s.moves}</p>`,
        () => body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => api.act('press', Number(b.dataset.i)))),
      );
    },
  },

  /* candles: big, obvious lit/unlit states, a stage counter, and (on the
   * third hint or the solution) highlights; one tap = one press, no holds */
  candles: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const stage = config.stages[s.stage];
      // only the current stage's presses are highlighted
      const stageMarks = new Set(api.showSolution ? stageSolution(stage, s.on) : []);
      const cols = stage.layout === 'grid' ? stage.size : s.on.length;
      rerender(
        body,
        `<div class="candle-stage" aria-live="polite">المرحلة ${s.stage + 1} من ${config.stages.length} · شاعلة ${s.on.filter(Boolean).length} من ${s.on.length}</div>
         <div class="candle-grid ${stage.layout}" style="--n:${cols}">
          ${s.on
            .map(
              (on, i) => `<button type="button" class="candle ${on ? 'is-on' : ''} ${stageMarks.has(i) ? 'is-solution' : ''}" data-k="c${i}" data-i="${i}" aria-pressed="${on}" aria-label="شمعة ${i + 1}: ${on ? 'شاعلة' : 'طافية'}${stageMarks.has(i) ? '، المسيها' : ''}">
                <span class="candle-flame" aria-hidden="true"></span><span class="candle-body" aria-hidden="true"></span></button>`,
            )
            .join('')}
         </div>
         <p class="candle-rule">${stage.layout === 'grid' ? 'كل لمسة تقلب الشمعة + اللي فوقها وتحتها ويمينها ويسارها.' : 'كل لمسة تقلب الشمعة + اللي يمينها ويسارها.'}</p>`,
        () => body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => api.act('press', Number(b.dataset.i)))),
      );
    },
  },

  code: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const line = (text, n) =>
        `<li class="code-line"><span class="code-n">${n + 1}</span><code>${esc(text).replace(/\{(\d+)\}/g, (_, k) => {
          const i = Number(k);
          const slot = config.slots[i];
          const ok = api.showSolution && s.pick[i] === slot.answer;
          return `<button type="button" class="code-slot ${ok ? 'is-right' : ''} ${api.showSolution && !ok ? 'is-solution' : ''}" data-k="t${i}" data-i="${i}" aria-label="بدّلي: ${esc(slot.options[s.pick[i]])}${api.showSolution ? `، الصح: ${esc(slot.options[slot.answer])}` : ''}">${esc(slot.options[s.pick[i]])}</button>`;
        })}</code></li>`;
      rerender(
        body,
        `<div class="code-window" dir="ltr">
           <div class="code-bar"><i></i><i></i><i></i><span>${esc(config.file || 'main.js')}</span></div>
           <ol class="code-lines">${config.lines.map(line).join('')}</ol>
         </div>
         <p class="code-help">المسي أي كلمة ملوّنة حتى تتبدّل. بعدين «شغّلي».</p>
         <button type="button" class="btn btn-primary" data-k="run" data-run>▶ شغّلي الكود</button>`,
        () => {
          body.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => api.act('cycle', Number(b.dataset.i), 1)));
          body.querySelector('[data-run]').addEventListener('click', () => api.act('run'));
        },
      );
    },
  },

  connect: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const P = config.points;
      const line = (a, b, cls) => `<line x1="${P[a].x}" y1="${P[a].y}" x2="${P[b].x}" y2="${P[b].y}" class="${cls}"/>`;
      const target = api.showSolution || api.hintsUsed >= (api.def.hints?.length || 9) ? config.edges.map(([a, b]) => line(a, b, 'cn-target')).join('') : '';
      const drawn = s.edges.map((e) => e.split('-').map(Number)).map(([a, b]) => line(a, b, 'cn-edge')).join('');
      rerender(
        body,
        `<div class="cn-wrap">
          <svg class="cn-svg" viewBox="0 0 100 100" role="group" aria-label="خريطة النجوم">
            <rect width="100" height="100" rx="6" class="cn-sky"/>
            ${target}${drawn}
            ${P.map((p, i) => `<g class="cn-star ${s.sel === i ? 'is-sel' : ''}" data-k="p${i}" data-i="${i}" tabindex="0" role="button" aria-label="نجمة ${i + 1}${s.sel === i ? ' (مختارة)' : ''}">
                <circle cx="${p.x}" cy="${p.y}" r="7" class="cn-hit"/><circle cx="${p.x}" cy="${p.y}" r="${s.sel === i ? 3.4 : 2.4}" class="cn-dot"/></g>`).join('')}
          </svg>
          <p class="cn-count">خطوط: ${s.edges.length} من ${config.edges.length}</p>
          <button type="button" class="btn btn-ghost btn-small" data-k="clear" data-clear>امسحي الخطوط</button>
        </div>`,
        () => {
          body.querySelectorAll('[data-i]').forEach((g) => {
            g.addEventListener('click', () => api.act('tap', Number(g.dataset.i)));
            g.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                api.act('tap', Number(g.dataset.i));
              }
            });
          });
          body.querySelector('[data-clear]').addEventListener('click', () => api.act('clear'));
        },
      );
    },
  },

  program: {
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const stage = config.stages[s.stage];
      const rows = stage.grid;
      const cmdLabel = { F: '⬆ قدّام', L: '↶ يسار', R: '↷ يمين' };
      const hint = api.showSolution ? programSolution(stage) : null;
      const trace = s.trace?.length ? s.trace : [stage.start];
      const animate = trace.length > 1 && !api.reduced?.();
      const first = animate ? trace[0] : trace[trace.length - 1];
      const cells = rows
        .flatMap((row) => [...row].map((ch) => `<span class="pg-cell ${ch === '#' ? 'is-wall' : ''} ${ch === 'B' ? 'is-bone' : ''}">${ch === 'B' ? '🦴' : ch === '#' ? '📦' : ''}</span>`))
        .join('');
      const robotEl = `<i class="pg-robot" aria-hidden="true" style="--x:${first.x};--y:${first.y};--r:${first.dir * 90}deg"><b>🤖</b></i>`;
      rerender(
        body,
        `<div class="pg-stage">المستوى ${s.stage + 1} من ${config.stages.length} · أقصى عدد أوامر: ${stage.max}</div>
         <div class="pg-grid" style="--w:${rows[0].length};--h:${rows.length}" dir="ltr" aria-label="الشبكة: الروبوت 🤖 والعظمة 🦴">${cells}${robotEl}</div>
         <ol class="pg-prog" dir="rtl" aria-label="البرنامج">${s.prog.length ? s.prog.map((c, i) => `<li><button type="button" class="pg-cmd" data-k="x${i}" data-del="${i}" aria-label="شيلي ${cmdLabel[c]}">${cmdLabel[c]}</button></li>`).join('') : '<li class="muted small">البرنامج فارغ</li>'}</ol>
         ${hint ? `<p class="pg-solution">الحل: ${hint.map((c) => cmdLabel[c]).join(' ، ')}</p>` : ''}
         <div class="pg-pad">${['F', 'L', 'R'].map((c) => `<button type="button" class="btn btn-ghost" data-k="a${c}" data-add="${c}" ${s.prog.length >= stage.max ? 'disabled' : ''}>${cmdLabel[c]}</button>`).join('')}</div>
         <div class="pg-run"><button type="button" class="btn btn-ghost btn-small" data-k="clr" data-clear>امسحي</button>
           <button type="button" class="btn btn-primary" data-k="run" data-run ${s.prog.length ? '' : 'disabled'}>▶ شغّلي</button></div>`,
        () => {
          body.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => api.act('add', b.dataset.add)));
          body.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => api.act('remove', Number(b.dataset.del))));
          body.querySelector('[data-clear]').addEventListener('click', () => api.act('clear'));
          body.querySelector('[data-run]').addEventListener('click', () => api.act('run'));
          if (animate) {
            const el = body.querySelector('.pg-robot');
            trace.slice(1).forEach((p, k) =>
              setTimeout(() => {
                el.style.setProperty('--x', p.x);
                el.style.setProperty('--y', p.y);
                el.style.setProperty('--r', `${p.dir * 90}deg`);
                el.classList.toggle('is-bump', Boolean(p.bump));
              }, 260 * (k + 1)),
            );
          }
        },
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
    solution: true,
    render(body, api) {
      const { config } = api.def;
      const s = api.state;
      const sol = api.showSolution ? config.answer : null;
      const solEv = sol ? new Set(sol.evidence.slice(0, config.need || 2)) : new Set();
      rerender(
        body,
        `<h3 class="ded-h">مَن؟</h3>
         <div class="ded-grid">
          ${config.suspects
            .map(
              (p) => `<button type="button" class="ded-card ${s.suspect === p.id ? 'is-sel' : ''} ${sol?.suspect === p.id ? 'is-solution' : ''}" data-k="p${p.id}" data-suspect="${p.id}" aria-pressed="${s.suspect === p.id}">
                ${p.icon ? symbol(p.icon) : ''}<b>${esc(tx(p.label))}</b><small>${esc(tx(p.note || ''))}</small></button>`,
            )
            .join('')}
         </div>
         <h3 class="ded-h">الدليل (${config.need || 2})</h3>
         <div class="ded-grid">
          ${config.evidence
            .map(
              (e) => `<button type="button" class="ded-card ${s.evidence.includes(e.id) ? 'is-sel' : ''} ${solEv.has(e.id) ? 'is-solution' : ''}" data-k="e${e.id}" data-evidence="${e.id}" aria-pressed="${s.evidence.includes(e.id)}">
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

/** Candles to press to finish the current stage (fewest presses). */
function stageSolution(stage, on) {
  const n = on.length;
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    let cur = on;
    const picks = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        cur = flipCandles(cur, stage, i);
        picks.push(i);
      }
    }
    if (cur.every(Boolean) && (!best || picks.length < best.length)) best = picks;
  }
  return best || [];
}
