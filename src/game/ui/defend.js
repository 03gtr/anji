/**
 * Season 2, Mission 06: defending a theory — the bar (rule: puzzles/defend.js). Built like the testimony bar
 * (ui/testimony.js, same look and classes): a bar at the bottom while the case room stays live above it, where
 * every challenge is acted out by the person who raises it.
 *
 *  1. the board: she pins one of the theories (none is ever disabled; a broken one only says it broke before);
 *  2. the challenges, one person at a time: she answers with a piece of evidence she HOLDS (📎), or says she has
 *     no answer (🤷). A wrong piece costs nothing but the challenger's shrug, and a wrong try is answered with the
 *     shared neutral lines (puzzles/host.js STRICT_WRONG) — never how close she was;
 *  3. "no answer" to a challenge nothing can answer breaks the theory: the person it would have blamed reacts, and
 *     she is back at the board to choose again. To a challenge that has an answer, it only steps her back.
 *
 * There is no hint, no "show the answer" and no skip. What she reached is kept in Season 2's own save
 * (`<save>-broke-<h>`, `<save>-held-<h>`), so she can leave and come back. A challenge's words and staging may
 * depend on what she decided earlier (`variants`, the first whose `if` holds).
 */
// Only modules outside the M2 registries' import cycle are imported here: a mission module imports this file,
// and the registries import the mission modules. What lives inside the cycle (the M2 case file, the shared wrong
// lines) is loaded when the bar opens — by then every module has been evaluated (the same bundle, no new chunk).
import { defend as rule } from '../puzzles/defend.js';
import { check } from '../core/conditions.js';
import { fillNames } from '../core/names.js';
import { EVIDENCE_S2 as EVIDENCE_M1, REL_LABEL } from '../data/evidence-s2.js';
import { h, esc, tx } from './dom.js';

/** The registries the bar needs from inside the cycle (see above). */
export async function defenceRegistries() {
  const [{ EVIDENCE_S2_M2 }, { STRICT_WRONG }] = await Promise.all([import('../data/evidence-s2-m2.js'), import('../puzzles/host.js')]);
  return { evidence: { ...EVIDENCE_M1, ...EVIDENCE_S2_M2 }, wrongLines: STRICT_WRONG };
}

/** The evidence she can answer with: every Season 2 piece she holds, in the case notebook's order. */
export function heldEvidence(game, evidence) {
  return Object.keys(evidence)
    .filter((id) => game.has(`s2.ev.${id}`))
    .map((id) => ({ id, ...evidence[id] }));
}

/** The words and staging of a challenge for this player (the first variant whose condition holds). */
export const variantOf = (challenge, game) => challenge.variants.find((v) => check(v.if, game)) ?? challenge.variants[challenge.variants.length - 1];

const key = (def, kind, hyp) => `${def.save}-${kind}-${hyp.toLowerCase()}`;

/** What she reached before (Season 2's save), as the rule's state. */
export function loadDefence(def, game) {
  const state = rule.init(def.config);
  for (const hyp of def.config.hypotheses) {
    if (game.flag(key(def, 'broke', hyp))) state.broken.push(hyp);
    const n = Number(game.flag(key(def, 'held', hyp))) || 0;
    if (n > 0) state.done[hyp] = Math.min(n, def.config.challenges[hyp].length - 1);
  }
  return state;
}

export async function openDefence(app, def, { run }) {
  const { game, audio } = app;
  const { evidence, wrongLines } = await defenceRegistries();
  let state = loadDefence(def, game);
  let busy = false;
  let wrongs = 0;
  const fill = (text) => tx(fillNames(text, game));

  return app.overlays.open(
    (el, { close, scope }) => {
      el.innerHTML = `
        <section class="tm tm-defend" dir="rtl">
          <header class="tm-head">
            <span class="tm-who"></span>
            <button type="button" class="btn btn-ghost btn-small" data-leave>أرجع بعدين</button>
          </header>
          <p class="tm-line" aria-live="polite"></p>
          <div class="tm-chips" data-hyps></div>
          <div class="tm-act" data-acts>
            <button type="button" class="btn btn-primary" data-present>📎 جاوبي بدليل</button>
            <button type="button" class="btn btn-ghost" data-concede>🤷 ما عندي جواب</button>
          </div>
          <div class="tm-pick" hidden>
            <p class="tm-pick-q"></p>
            <div class="tm-chips" data-chips></div>
            <button type="button" class="btn btn-ghost btn-small" data-cancel>رجوع</button>
          </div>
          <p class="tm-feedback" aria-live="polite"></p>
        </section>`;
      const $ = (s) => el.querySelector(s);
      const pick = $('.tm-pick');
      const say = (text, kind = '') => {
        $('.tm-feedback').textContent = text ? fill(text) : '';
        $('.tm-feedback').dataset.kind = kind;
      };
      const current = () => (state.pick ? def.challenges[state.pick][state.i] : null);
      const variant = () => variantOf(current(), game);

      const paint = () => {
        const ch = current();
        $('[data-hyps]').hidden = Boolean(ch);
        $('[data-acts]').hidden = !ch;
        if (!ch) {
          $('.tm-who').textContent = fill(def.labels.board);
          $('.tm-line').textContent = fill(def.labels.choose);
          $('[data-hyps]').replaceChildren(
            ...def.config.hypotheses.map((hyp) => {
              const b = h(`<button type="button" class="tm-chip" data-hyp="${esc(hyp)}"><b>${esc(hyp)} · ${esc(fill(def.hypotheses[hyp].title))}</b><small>${state.broken.includes(hyp) ? esc(fill(def.labels.brokenTag)) : '&nbsp;'}</small></button>`);
              b.disabled = busy;
              b.addEventListener('click', () => choose(hyp));
              return b;
            }),
          );
          return;
        }
        const v = variant();
        $('.tm-who').textContent = `${state.pick} · ${fill(v.name)}`;
        $('.tm-line').textContent = `«${fill(v.t)}»`;
        $('[data-present]').disabled = busy;
        $('[data-concede]').disabled = busy;
      };

      /** Busy while something plays in the world; the buttons wait. */
      const play = async (actions) => {
        if (!actions?.length) return;
        busy = true;
        pick.hidden = true;
        paint();
        try {
          await run(actions);
        } finally {
          busy = false;
          if (!scope.disposed) paint();
        }
      };
      const save = () => {
        for (const hyp of state.broken) game.setFlag(key(def, 'broke', hyp));
        for (const [hyp, n] of Object.entries(state.done)) game.setFlag(key(def, 'held', hyp), n);
      };
      const home = () => run([{ all: Object.entries(def.homes || {}).map(([id, x]) => ({ move: id, x, speed: 150 })) }]);

      async function choose(hyp) {
        if (busy) return;
        const res = rule.choose(def.config, state, hyp);
        if (res.outcome === 'noop') return;
        state = res.state;
        say('');
        audio.play('tap');
        await play(def.hypotheses[hyp].intro);
        await play(variant().intro);
      }

      scope.on($('[data-present]'), 'click', () => {
        if (busy) return;
        const held = heldEvidence(game, evidence);
        $('.tm-pick-q').textContent = held.length ? fill(def.labels.present) : 'بعد ما عندچ أدلة.';
        $('[data-chips]').replaceChildren(
          ...held.map((e) => {
            const b = h(`<button type="button" class="tm-chip" data-ev="${esc(e.id)}"><b>${esc(fill(e.label))}</b><small>${esc(REL_LABEL[e.rel] ?? '')}</small></button>`);
            b.addEventListener('click', () => present(e.id));
            return b;
          }),
        );
        pick.hidden = false;
        pick.querySelector('button')?.focus({ preventScroll: true });
      });
      scope.on($('[data-cancel]'), 'click', () => {
        pick.hidden = true;
      });

      async function present(evId) {
        pick.hidden = true;
        const v = variant();
        const res = rule.present(def.config, state, evId);
        if (res.outcome === 'noop') return;
        if (res.outcome === 'wrong') {
          state = res.state;
          audio.play('fail');
          await play([...(v.onWrong || []), ...(v.deflect ? [{ say: v.deflect }] : [])]);
          say(wrongLines[wrongs++ % wrongLines.length], 'bad');
          return;
        }
        audio.play('success');
        say('');
        // answered: the challenger reacts (acted out while the bar still shows the question), then the next one
        await play(v.answered);
        state = res.state;
        save();
        if (res.outcome === 'solved') {
          if (def.solved) game.setFlag(def.solved);
          close({ solved: true });
          return;
        }
        await play(variant().intro);
      }

      scope.on($('[data-concede]'), 'click', async () => {
        if (busy || !current()) return;
        const hyp = state.pick;
        const res = rule.concede(def.config, state);
        if (res.outcome === 'noop') return;
        say('');
        if (res.outcome === 'broken') {
          audio.play('fail');
          // the theory breaks: the person it would have blamed reacts, then everyone goes back to their place
          await play(def.hypotheses[hyp].broken);
          state = res.state;
          save();
          paint();
          await play([...(def.labels.afterBreak || [])]);
          home();
          say(def.labels.broken);
          return;
        }
        await play(def.labels.stepBack);
        state = res.state;
        paint();
        home();
      });

      scope.on($('[data-leave]'), 'click', () => {
        if (busy) return;
        save();
        home();
        close({ solved: false });
      });

      paint();
    },
    { className: 'overlay-testimony', label: def.title, modal: false },
  );
}

/**
 * The defence as a scene action: `{ defence }` is not one of the engine's actions, so a scene runs it as a
 * function (the engine passes its API: the app, and `run` to act things out). When the theory holds, the bar sets
 * `def.solved` (a Season 2 flag), so what follows can be plain data (`{ if: 'flag:…', then, else }`), which the
 * content checks can read. `then`/`else` here are optional.
 */
export function defenceAction(def, { then = [], else: otherwise = [] } = {}) {
  const act = async (world) => {
    const res = await openDefence(world.app, def, { run: world.run });
    await world.run(res?.solved ? then : otherwise);
  };
  return Object.assign(act, { defence: def, then, else: otherwise });
}
