/**
 * Season 2: a witness's testimony, acted out in the world (rules: puzzles/rules.js `testimony`).
 *
 * A bar at the bottom of the screen; the scene stays live behind it (explore.js treats
 * `overlay-testimony` like the dialogue box). Each statement is staged by the people in the scene
 * as she steps to it. She can:
 *   ‹ › step through the statements (each one is acted out again),
 *   🔍 press a statement — the witness says more (a dialogue),
 *   📎 present a piece of evidence she HOLDS against the statement she is on.
 * There is no help button and no way to be shown the answer: the testimony is solved by reasoning only.
 * A wrong pair costs nothing but the witness's smugness; it never says how close it was. The right
 * pair breaks the version: the witness reacts and tells his next one. The version she reached is kept
 * (`pstage:<id>`), so she can leave to find evidence and come back.
 */
import { RULES } from '../puzzles/rules.js';
import { applyEffects } from '../core/effects.js';
import { fillNames } from '../core/names.js';
import { EVIDENCE_S2 as EVIDENCE_M1, REL_LABEL } from '../data/evidence-s2.js';
import { EVIDENCE_S2_M2 } from '../data/evidence-s2-m2.js';
import { h, esc, tx } from './dom.js';

const rule = RULES.testimony;
const digits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
/** Every Season 2 piece of evidence (M1 and the Living Story missions), in the case notebook's order. */
const EVIDENCE_S2 = { ...EVIDENCE_M1, ...EVIDENCE_S2_M2 };

/** The evidence she can present: every Season 2 piece she holds, in the case notebook's order. */
export function presentable(game) {
  return Object.keys(EVIDENCE_S2).filter((id) => game.has(`s2.ev.${id}`));
}

export function openTestimony(app, def, { run }) {
  const { game, audio } = app;
  const stageFlag = `pstage:${def.id}`;
  let state = { ...rule.init(def.config), v: Math.min(Number(game.flag(stageFlag)) || 0, def.versions.length - 1) };
  let beat = 0;
  let busy = false;
  let deflects = 0;

  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `
        <section class="tm" dir="rtl">
          <header class="tm-head">
            <span class="tm-who"></span>
            <button type="button" class="btn btn-ghost btn-small" data-leave>أرجع بعدين</button>
          </header>
          <p class="tm-line" aria-live="polite"></p>
          <div class="tm-nav">
            <button type="button" class="dial-btn" data-prev aria-label="الجملة اللي قبلها">›</button>
            <span class="tm-dots" aria-hidden="true"></span>
            <button type="button" class="dial-btn" data-next aria-label="الجملة الجاية">‹</button>
          </div>
          <div class="tm-act">
            <button type="button" class="btn btn-ghost" data-press>🔍 اضغطي عليه</button>
            <button type="button" class="btn btn-primary" data-present>📎 قدّمي دليل</button>
          </div>
          <div class="tm-pick" hidden>
            <p class="tm-pick-q"></p>
            <div class="tm-chips"></div>
            <button type="button" class="btn btn-ghost btn-small" data-cancel>رجوع</button>
          </div>
          <p class="tm-feedback" aria-live="polite"></p>
        </section>`;
      const $ = (s) => el.querySelector(s);
      const ver = () => def.versions[state.v];
      const say = (text, kind = '') => {
        $('.tm-feedback').textContent = text ? tx(fillNames(text, game)) : '';
        $('.tm-feedback').dataset.kind = kind;
      };

      const paint = () => {
        const v = ver();
        $('.tm-who').textContent = `${v.title} · ${digits(state.v + 1)} من ${digits(def.versions.length)}`;
        $('.tm-line').textContent = `«${tx(fillNames(v.beats[beat].t, game))}»`;
        $('.tm-dots').textContent = v.beats.map((_, i) => (i === beat ? '●' : '○')).join(' ');
        $('[data-prev]').disabled = busy || beat === 0;
        $('[data-next]').disabled = busy || beat === v.beats.length - 1;
        $('[data-press]').disabled = busy || !v.beats[beat].press;
        $('[data-present]').disabled = busy;
      };

      /** Busy while something plays in the world; the buttons wait. */
      const play = async (actions) => {
        if (!actions?.length) return;
        busy = true;
        paint();
        try {
          await run(actions);
        } finally {
          busy = false;
          if (!scope.disposed) paint();
        }
      };
      const goBeat = async (i) => {
        beat = i;
        say('');
        paint();
        await play(ver().beats[beat].stage);
      };
      const startVersion = async () => {
        beat = 0;
        paint();
        await play(ver().intro);
        await goBeat(0);
      };

      scope.on($('[data-next]'), 'click', () => goBeat(Math.min(beat + 1, ver().beats.length - 1)));
      scope.on($('[data-prev]'), 'click', () => goBeat(Math.max(beat - 1, 0)));
      scope.on($('[data-press]'), 'click', () => play([{ say: ver().beats[beat].press }]));
      scope.on($('[data-leave]'), 'click', () => close({ solved: false }));

      // presenting: only what she holds; the question names the statement, never the answer
      const pick = $('.tm-pick');
      scope.on($('[data-present]'), 'click', () => {
        const ids = presentable(game);
        $('.tm-pick-q').textContent = ids.length ? `أي دليل يكذّب: «${tx(fillNames(ver().beats[beat].t, game))}»؟` : 'بعد ما عندچ أدلة تقدّمينها. دوّري.';
        $('.tm-chips').replaceChildren(
          ...ids.map((id) => {
            const e = EVIDENCE_S2[id];
            const b = h(`<button type="button" class="tm-chip" data-ev="${esc(id)}"><b>${esc(tx(e.label))}</b><small>${esc(REL_LABEL[e.rel] ?? '')}</small></button>`);
            b.addEventListener('click', () => presentEv(id));
            return b;
          }),
        );
        pick.hidden = false;
        pick.querySelector('button')?.focus({ preventScroll: true });
      });
      scope.on($('[data-cancel]'), 'click', () => {
        pick.hidden = true;
      });

      async function presentEv(evId) {
        pick.hidden = true;
        const v = ver();
        const res = rule.present(def.config, state, v.beats[beat].id, evId);
        if (res.outcome === 'wrong') {
          state = res.state;
          audio.play('fail');
          // he shrugs it off; the line rotates, and says nothing about how close she was
          const lines = v.deflect || [];
          const d = lines.length ? lines[deflects++ % lines.length] : null;
          await play([...(v.onWrong || []), ...(d ? [{ say: d }] : [])]);
          say('ما انكسرت القصة. جرّبي جملة ثانية، أو دليل ثاني.', 'bad');
          return;
        }
        if (res.outcome === 'noop') return;
        audio.play('success');
        // the version breaks: the witness reacts (acted out) while the bar still shows it; then the next one
        await play(v.broken);
        state = res.state;
        if (res.outcome === 'progress') {
          game.setFlag(stageFlag, state.v);
          await startVersion();
          return;
        }
        // solved: the record, the reward once, and on with the scene
        game.setFlag(stageFlag, false);
        const r = game.recordResult(`puzzle:${def.id}`, { completed: true, score: state.wrong, lowerIsBetter: true });
        const changes = r.firstClear ? applyEffects(def.reward, game) : [];
        app.ui.announce?.(changes);
        close({ solved: true });
      }

      paint();
      startVersion();
    },
    { className: 'overlay-testimony', label: def.title, modal: false },
  );
}
