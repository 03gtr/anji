/**
 * Garden designer: plant roses (with the seeds she collected) and place
 * decorations in the hidden garden. The saved layout appears in the world.
 */
import { COLS, ROWS, PIECES, place, clearCell, roseBudget, rosesUsed } from './garden-logic.js';
import { symbol } from '../ui/symbols.js';
import { check } from '../core/conditions.js';
import { h, esc, ICONS } from '../ui/dom.js';
import { num } from '../ui/format.js';

export function mount(area, { app, scope, hud, finish }) {
  const { game } = app;
  let layout = game.state.garden.map((p) => ({ ...p }));
  let tool = 'rose-blue';
  const seeds = game.countGroup('seed');
  const unlocked = (cond) => check(cond, game);

  area.append(
    h(`<div class="gdesign">
      <p class="gd-info"></p>
      <div class="gd-grid" style="--cols:${COLS}" role="grid" aria-label="حديقتچ"></div>
      <div class="gd-tools" role="radiogroup" aria-label="شنو تزرعين"></div>
      <div class="row gd-actions">
        <button type="button" class="btn btn-ghost" data-act="erase">🧹 <span>ممسحة</span></button>
        <button type="button" class="btn btn-primary" data-act="save">${ICONS.check}<span>احفظي الحديقة</span></button>
      </div>
    </div>`),
  );
  const grid = area.querySelector('.gd-grid');
  const tools = area.querySelector('.gd-tools');
  const info = area.querySelector('.gd-info');

  function render() {
    const used = rosesUsed(layout);
    const budget = roseBudget(seeds);
    info.textContent = `الورد: ${num(used)}/${num(budget)} (كل كيس بذور = ٣ ورود)`;
    hud(`🌱 ${num(budget - used)} ورود باقية`);
    grid.innerHTML = Array.from({ length: COLS * ROWS }, (_, cell) => {
      const p = layout.find((x) => x.cell === cell);
      return `<button type="button" class="gd-cell ${p ? 'is-full' : ''}" data-cell="${cell}" aria-label="${p ? esc(PIECES[p.id].name) : 'أرض فاضية'}">${p ? symbol(PIECES[p.id].icon) : ''}</button>`;
    }).join('');
    tools.innerHTML =
      Object.entries(PIECES)
        .map(([id, piece]) => {
          const open = !piece.unlock || unlocked(piece.unlock);
          return `<button type="button" role="radio" class="gd-tool ${tool === id ? 'is-on' : ''}" data-tool="${id}" aria-checked="${tool === id}" ${open ? '' : 'disabled'}>${open ? symbol(piece.icon) : ICONS.lock}<span>${esc(piece.name)}</span></button>`;
        })
        .join('') + `<button type="button" role="radio" class="gd-tool ${tool === 'erase' ? 'is-on' : ''}" data-tool="erase" aria-checked="${tool === 'erase'}">🧹<span>ممسحة</span></button>`;
    grid.querySelectorAll('[data-cell]').forEach((b) =>
      b.addEventListener('click', () => {
        const cell = Number(b.dataset.cell);
        if (tool === 'erase') layout = clearCell(layout, cell);
        else {
          const next = place(layout, cell, tool, { seeds, unlocked });
          if (!next) {
            app.audio.play('fail');
            info.textContent = PIECES[tool].rose ? 'خلصت البذور. اجمعي أكياس بذور أكثر بالحديقة.' : 'هاي القطعة بعدها مقفولة.';
            return;
          }
          layout = next;
        }
        app.audio.play('pickup');
        render();
      }),
    );
    tools.querySelectorAll('[data-tool]').forEach((b) =>
      b.addEventListener('click', () => {
        tool = b.dataset.tool;
        render();
      }),
    );
  }

  scope.on(area.querySelector('[data-act="erase"]'), 'click', () => {
    tool = 'erase';
    render();
  });
  scope.on(area.querySelector('[data-act="save"]'), 'click', () => {
    game.setGarden(layout);
    finish({ completed: true, title: 'حديقتچ انحفظت 🌹', summary: `${num(layout.length)} قطعة مزروعة. شوفيها بالحديقة المخفية.` });
  });

  return {
    start: render,
    pause() {},
    resume() {},
    destroy() {},
  };
}
