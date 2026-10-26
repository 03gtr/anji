/**
 * «خدعة سنوكي» — three short card puzzles (tabletop/cardtrick.js): follow
 * the swaps, fix the labels, guess the next card. Hints and the solution
 * are always available; the swaps can be replayed step by step.
 */
import { makeTrick, checkRound, roundSolution, LABELS, LABEL_NAMES } from '../tabletop/cardtrick.js';
import { h, esc } from '../ui/dom.js';
import { num } from '../ui/format.js';
import { symbol } from '../ui/symbols.js';
import { sayBar, sayScript, momentLines, linesText, playCount } from '../tabletop/ui.js';

const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const POS = ['يمين', 'نص', 'يسار'];

export function mount(area, { app, scope, options, hud, finish }) {
  const bar = sayBar();
  const wrap = h('<div class="tt cardtrick"></div>');
  wrap.append(bar.el);
  area.append(wrap);
  let paused = false;
  sayScript(bar, momentLines(app, 'cardtrick', playCount('cardtrick') ? 'rematch' : 'before'), scope, app.reduced());

  const rounds = makeTrick(options.seed ?? (Date.now() % 100000));
  let index = 0;
  let mistakes = 0;
  let helped = 0;
  const box = h('<div class="ctk"></div>');
  wrap.append(box);

  function next(ok) {
    if (ok) {
      app.audio.play('success');
      index += 1;
      if (index >= rounds.length) {
        const script = momentLines(app, 'cardtrick', 'win');
        finish({
          completed: true,
          medal: mistakes === 0 && !helped ? 'gold' : mistakes + helped <= 2 ? 'silver' : 'bronze',
          score: mistakes + helped,
          lowerIsBetter: true,
          title: 'كشفتي خدعة سنوكي! 🃏',
          summary: `أخطاء: ${num(mistakes)} · مساعدات: ${num(helped)}\n${linesText(script)}`,
        });
        return;
      }
    }
    render();
  }

  function wrong(text) {
    mistakes += 1;
    app.audio.play('fail');
    box.querySelector('.ctk-msg').textContent = text;
    if (mistakes === 2) bar.say({ s: 'snooki', e: 'guilty', t: 'تلميح مجاني لأن آني طيب: المسي «💡 تلميح».' });
  }

  function helpers(round, hintText) {
    return `<div class="ctk-help"><button type="button" class="btn btn-ghost btn-small" data-hint>💡 تلميح</button><button type="button" class="btn btn-ghost btn-small" data-sol>🔍 الحل</button></div>
      <p class="ctk-hint" hidden>${esc(hintText)}</p>`;
  }
  function wireHelpers(round) {
    box.querySelector('[data-hint]').addEventListener('click', () => {
      box.querySelector('.ctk-hint').hidden = false;
      helped += 1;
    });
    box.querySelector('[data-sol]').addEventListener('click', () => {
      const sol = roundSolution(round);
      helped += 2;
      const p = box.querySelector('.ctk-hint');
      p.hidden = false;
      p.textContent = round.kind === 'swap' ? `الوردة صارت بـ«${POS[sol]}».` : round.kind === 'labels' ? `الصح: ${sol.map((c, i) => `«${LABEL_NAMES[LABELS[i]]}» فيه ${LABEL_NAMES[c]}`).join('، ')}.` : `الجواب: ${ar(sol)}.`;
    });
  }

  function render() {
    const r = rounds[index];
    hud(`الجولة ${num(index + 1)}/${num(rounds.length)} · أخطاء ${num(mistakes)}`);
    if (r.kind === 'swap') {
      let step = 0;
      box.innerHTML = `<h3>١. وين الوردة؟</h3>
        <p>الوردة الزرقاء بالبداية بـ«${POS[r.start]}». سنوكي بدّل الأوراق ${ar(r.swaps.length)} مرات:</p>
        <ol class="ctk-swaps">${r.swaps.map(([a, b]) => `<li>بدّل «${POS[a]}» ويّا «${POS[b]}»</li>`).join('')}</ol>
        <div class="ctk-row" dir="rtl">${[0, 1, 2].map((i) => `<button type="button" class="pcard is-down ctk-card" data-pos="${i}" aria-label="الورقة ب${POS[i]}"><span class="pcard-back">?</span></button>`).join('')}</div>
        <p class="muted small">تگدرين تتبعين التبديل خطوة خطوة: <button type="button" class="btn btn-ghost btn-small" data-step>الخطوة الجاية ▶</button> <span class="ctk-step"></span></p>
        <p class="ctk-msg" role="status"></p>${helpers(r, 'تابعي الوردة بإصبعچ: كل تبديل، إذا الوردة بواحد من المكانين، تروح للثاني.')}`;
      box.querySelector('[data-step]').addEventListener('click', () => {
        if (step >= r.swaps.length) step = 0;
        let at = r.start;
        for (let k = 0; k <= step; k++) {
          const [a, b] = r.swaps[k];
          if (at === a) at = b;
          else if (at === b) at = a;
        }
        box.querySelector('.ctk-step').textContent = `بعد التبديل ${ar(step + 1)}: الوردة بـ«${POS[at]}»`;
        step += 1; // replaying is free: it is the same information as the list
      });
      box.querySelectorAll('[data-pos]').forEach((b) =>
        b.addEventListener('click', () => {
          if (paused) return;
          if (checkRound(r, Number(b.dataset.pos))) next(true);
          else wrong('لا… هاي ورقة سنوكي العادية. جرّبي مرة ثانية.');
        }),
      );
    } else if (r.kind === 'labels') {
      const pick = [null, null, null];
      box.innerHTML = `<h3>٢. الصناديق الملخبطة</h3>
        <p>ثلاث صناديق مكتوب عليها: «ورد»، «نجوم»، «خليط». سنوكي يحلف إن <b>كل</b> الكتابات غلط. طلّع ورقة من صندوق «خليط»… طلعت <b>${LABEL_NAMES[r.drawn]}</b>.</p>
        <p>شنو بكل صندوق بالحقيقة؟</p>
        <div class="ctk-boxes">${LABELS.map((l, i) => `<div class="ctk-box"><span>مكتوب: «${LABEL_NAMES[l]}»</span><select class="tt-select" data-box="${i}" aria-label="محتوى صندوق ${LABEL_NAMES[l]}"><option value="">؟</option>${LABELS.map((c) => `<option value="${c}">${LABEL_NAMES[c]}</option>`).join('')}</select></div>`).join('')}</div>
        <button type="button" class="btn btn-primary" data-check>تأكيد</button>
        <p class="ctk-msg" role="status"></p>${helpers(r, 'صندوق «خليط» مو خليط (الكتابة غلط)، فهو كله من الورقة اللي طلعت. بعدين: الصندوق المكتوب عليه نفس اسم هاي الورقة ما يگدر يكون هي، ولا اسمه.')}`;
      box.querySelectorAll('[data-box]').forEach((sel) => sel.addEventListener('change', () => (pick[Number(sel.dataset.box)] = sel.value || null)));
      box.querySelector('[data-check]').addEventListener('click', () => {
        if (paused) return;
        if (pick.some((p) => !p)) return wrong('اختاري لكل صندوق.');
        if (checkRound(r, pick)) next(true);
        else wrong('مو صح. تذكّري: كل كتابة غلط.');
      });
    } else {
      box.innerHTML = `<h3>٣. الورقة الجاية</h3>
        <p>سنوكي رتّب أوراق بقاعدة سرية. شنو الرقم الجاي؟</p>
        <div class="ctk-row ctk-seq" dir="ltr">${r.ranks.map((n) => `<span class="pcard suit-star"><span class="pcard-rank">${ar(n)}</span><span class="pcard-suit">${symbol('star')}</span></span>`).join('')}<span class="pcard is-down"><span class="pcard-back">?</span></span></div>
        <div class="ctk-options">${r.options.map((o) => `<button type="button" class="btn btn-ghost" data-opt="${o}">${ar(o)}</button>`).join('')}</div>
        <p class="ctk-msg" role="status"></p>${helpers(r, `القاعدة: ${r.rule}.`)}`;
      box.querySelectorAll('[data-opt]').forEach((b) =>
        b.addEventListener('click', () => {
          if (paused) return;
          if (checkRound(r, Number(b.dataset.opt))) next(true);
          else wrong('لا. باوعي شلون كل رقم يتغير عن اللي قبله.');
        }),
      );
    }
    wireHelpers(r);
  }
  render();

  return {
    start() {},
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    destroy() {},
  };
}
