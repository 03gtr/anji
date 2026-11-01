/**
 * Season 3's investigation board, as a journal tab (data/s3/board.js has the rules). Touch first: tap a card, tap a
 * relation, tap a second card — the thread is checked against the season's relation table. A thread that holds
 * stays on the board (Season 3's own save); one that does not gets a neutral line, and nothing is drawn for her.
 * Every card shows its reliability as it stands now.
 */
import { esc } from './dom.js';
import { symbol } from './symbols.js';
import { EVIDENCE_S3, LINKS_S3 } from '../data/evidence-s3.js';
import { RELATIONS, STATES, linkFlag, linkHolds, reliability, LINK_WRONG } from '../data/s3/board.js';

const held = (game) => Object.keys(EVIDENCE_S3).filter((id) => game.has(`s3.ev.${id}`));
/** The threads she has drawn (from her flags), as [a, rel, b]. */
export function drawnThreads(game) {
  const out = [];
  for (const [a, rel, b] of LINKS_S3) if (game.flag(linkFlag(a, rel, b).slice(5))) out.push([a, rel, b]);
  return out;
}

export function renderBoard(body, game) {
  let pick = { a: null, rel: null };
  let say = '';
  let wrong = 0;
  const has = (id) => game.has(`s3.ev.${id}`);
  function draw() {
    const ids = held(game);
    const threads = drawnThreads(game);
    const rel = (id) => RELATIONS.find((r) => r.id === id).label;
    body.innerHTML = `
      <p class="muted small">المسي دليل، بعدين نوع الخيط، بعدين الدليل الثاني. الخيط يبقى بس إذا الأدلة تثبته.</p>
      <div class="s3-board-cards">${ids
        .map((id) => {
          const e = EVIDENCE_S3[id];
          const st = reliability(e, has);
          return `<button type="button" class="s3-card is-${st} ${pick.a === id ? 'is-sel' : ''}" data-card="${esc(id)}" aria-pressed="${pick.a === id}">
            <span class="s3-card-head">${symbol(e.icon)}<b>${esc(e.label)}</b></span>
            <span class="s3-state">${esc(STATES[st])}</span>
            <small>${esc(e.note)}</small></button>`;
        })
        .join('')}</div>
      <div class="s3-rels" role="group" aria-label="نوع الخيط">${RELATIONS.map((r) => `<button type="button" class="btn btn-small ${pick.rel === r.id ? 'btn-primary' : 'btn-ghost'}" data-rel="${r.id}" ${pick.a ? '' : 'disabled'}>${esc(r.label)}</button>`).join('')}</div>
      <p class="s3-board-say" role="status" aria-live="polite">${esc(say)}</p>
      <h3>خيوطچ</h3>
      ${threads.length ? `<ul class="s3-threads">${threads.map(([a, r, b]) => `<li>🧵 <b>${esc(EVIDENCE_S3[a].label)}</b> — ${esc(rel(r))} — <b>${esc(EVIDENCE_S3[b].label)}</b></li>`).join('')}</ul>` : '<p class="muted small">بعد ما ربطتي شي.</p>'}`;
    body.querySelectorAll('[data-card]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.dataset.card;
        if (!pick.a || !pick.rel) {
          pick = { a: pick.a === id ? null : id, rel: null };
          say = pick.a ? `«${EVIDENCE_S3[id].label}»… شنو يربطه؟` : '';
        } else if (id !== pick.a) {
          if (linkHolds(LINKS_S3, pick.a, pick.rel, id)) {
            game.setFlag(linkFlag(pick.a, pick.rel, id).slice(5));
            say = `🧵 «${EVIDENCE_S3[pick.a].label}» ${rel(pick.rel)} «${EVIDENCE_S3[id].label}».`;
          } else {
            say = LINK_WRONG[wrong++ % LINK_WRONG.length];
          }
          pick = { a: null, rel: null };
        }
        draw();
        body.querySelector(pick.a ? '[data-rel]' : '.s3-board-say')?.focus?.({ preventScroll: true });
      }),
    );
    body.querySelectorAll('[data-rel]').forEach((b) =>
      b.addEventListener('click', () => {
        pick = { ...pick, rel: b.dataset.rel };
        say = `«${EVIDENCE_S3[pick.a].label}» ${rel(pick.rel)}… أي دليل؟`;
        draw();
      }),
    );
  }
  draw();
}
