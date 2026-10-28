/**
 * The map explains what is still locked and where to keep exploring — without unlocking anything.
 *
 * REGRESSION (seen on a real phone): after the ending a player saw a map with places still locked
 * and nothing telling her why. Locked places without their own text said «ينفتح بالفصل …» even when
 * that chapter was long finished (عيادة الورد: «الفصل الثامن» after the ending; المرج الخلفي:
 * «الفصل الرابع» — it needs the kitten's tracks). The deep garden page (14 places) does not exist on
 * the map until Ryan's box in the workshop is opened, and the map never said so. With no objective
 * left, the map said nothing at all.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { createGame } from '../../src/game/core/game.js';
import { SAVE_KEY, defaultState } from '../../src/game/core/save.js';
import { check, atoms } from '../../src/game/core/conditions.js';
import { ACTS } from '../../src/game/data/chapters.js';
import { WORLDS, regionOf } from '../../src/game/data/worlds.js';
import { journalEntries } from '../../src/game/progression/journal-index.js';
import { lockedText, exploreText, EXPLORE } from '../../src/game/progression/map-guide.js';
import { memoryStorage } from '../helpers.js';

const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];
/** A save through act `n` (its objectives' flags, records and items), plus `flags`. */
function through(n, flags = []) {
  const g = createGame({ saveManager: null, initial: { ...defaultState() } });
  for (const a of ACTS.filter((x) => x.act <= n)) {
    g.setFlag(`act${a.act}-done`);
    for (const o of a.objectives)
      for (const at of atoms(o.done)) {
        const [k, ...r] = at.split(':');
        const id = r.join(':');
        if (k === 'flag') g.setFlag(id);
        if (k === 'record') g.recordResult(id, { completed: true });
        if (k === 'item') g.addItem(id);
      }
  }
  g.setFlags(['intro-done', 'map-open', ...flags]);
  return g;
}
const ENDED = ['final-entered', 't.final.meet', 'rose-planted', 'game-complete', 'act8-done'];
const SAVES = {
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [`through act ${n}`, () => through(n)])),
  'after the ending': () => through(8, ENDED),
  'after the ending, box opened': () => through(8, [...ENDED, 'dg-box']),
};

describe('tapping a locked place: what it needs, never a chapter she has already finished', () => {
  for (const [name, make] of Object.entries(SAVES)) {
    it(name, () => {
      const g = make();
      for (const w of WORLDS.filter((x) => !check(x.unlock, g))) {
        const text = lockedText(w, g);
        expect(text).toMatch(/مقفول/);
        const ch = ORD.findIndex((o) => text.includes(`بالفصل ${o}`));
        if (ch >= 0) expect(g.flag(`act${ch + 1}-done`), `${w.id}: «${text}»`).toBeFalsy();
      }
    });
  }

  it('after the ending: the rose clinic, the back meadow and the roads say what they really need', () => {
    const g = through(8, ENDED);
    const by = (id) => lockedText(WORLDS.find((w) => w.id === id), g);
    expect(by('roseclinic')).toMatch(/طريق الذكريات لحد السيارتين/);
    expect(by('meadow')).toMatch(/الآثار الصغيرة جنب سياج محمية الحيوانات/);
    expect(lockedText(WORLDS.find((w) => w.id === 'roads'), through(7))).toMatch(/بعد نهاية الحكاية/);
  });

  it('the unlock rules themselves are unchanged (nothing is opened early)', () => {
    const g = through(8, ENDED);
    expect(check(WORLDS.find((w) => w.id === 'roseclinic').unlock, g)).toBe(false);
    expect(check(WORLDS.find((w) => w.id === 'meadow').unlock, g)).toBe(false);
    expect(WORLDS.filter((w) => regionOf(w) === 'deep').some((w) => check(w.unlock, g))).toBe(false);
    expect(WORLDS.filter((w) => regionOf(w) === 'deep' && check(w.unlock, through(8, [...ENDED, 'dg-box']))).map((w) => w.id)).toEqual(['clockgarden', 'letterhall', 'falsetrails', 'sealedroom']);
  });
});

describe('where to keep exploring (one line on the map)', () => {
  it('after the ending, before the box: the deep garden is still hidden — the map says so', () => {
    const g = through(8, ENDED);
    expect(exploreText(g, journalEntries(g), null)).toBe(EXPLORE.box);
  });

  it('with an objective on the map and the deep garden open: nothing extra', () => {
    const g = through(8, [...ENDED, 'dg-box']);
    expect(exploreText(g, journalEntries(g), { id: 'x' })).toBe('');
  });

  it('no objective, but open missions left: «المهمات» in the journal', () => {
    const g = through(8, [...ENDED, 'dg-box']);
    expect(exploreText(g, [{ status: 'complete' }, { status: 'available' }], null)).toBe(EXPLORE.open);
  });

  it('everything open is done, places still locked: tap them to learn what they need', () => {
    const g = through(8, [...ENDED, 'dg-box']);
    expect(exploreText(g, [{ status: 'complete' }], null)).toBe(EXPLORE.locked);
  });

  it('only when every mission and every place is done: «المغامرات الجاية توصل ويا تحديثات جاية» — no date, no invented mission', () => {
    // a save where every condition holds (every place open)
    const all = { flag: () => true, hasItem: () => true, has: () => true, seen: () => true, record: () => ({ completed: true, medal: 'gold' }), countGroup: () => 999 };
    expect(WORLDS.filter((w) => w.ready).every((w) => check(w.unlock, all))).toBe(true);
    expect(exploreText(all, [{ status: 'complete' }, { status: 'complete' }], null)).toBe(EXPLORE.done);
    expect(exploreText(all, [{ status: 'complete' }, { status: 'locked' }], null)).toBe(EXPLORE.locked);
    for (const t of Object.values(EXPLORE)) expect(t).not.toMatch(/\d|موعد|قريباً|عرس|زواج/);
  });
});

/* ── on the real map ─────────────────────────────────────────────── */
const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, p) => (p === 'createLinearGradient' || p === 'createRadialGradient' ? () => gradient : p === 'measureText' ? () => ({ width: 40 }) : p === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
let root;
let app;
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 5000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await wait(10);
  }
  throw new Error('timed out');
}
const $ = (sel) => root.querySelector(sel);

describe('on the map screen', () => {
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    app?.destroy();
    app = null;
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('after the ending: the map points at Ryan\'s box, and a locked place says what it needs; a reload changes nothing', async () => {
    const g = through(8, [...ENDED, 'notice:sp1', 'notice:sp2', 'notice:deep', 'notice:team']);
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify({ ...g.state, location: { scene: 'final', x: 300 } }) });
    app = createGameApp(root, { storage, reducedMotion: true });
    app.settings.set({ tips: false });
    await app.toTitle();
    app.ui.openMap();
    await until(() => $('.map-board .map-node'));
    expect($('.map-explore').textContent).toBe(EXPLORE.box);
    $('.map-node[data-world="roseclinic"]').click();
    expect($('.map-info').textContent).toMatch(/طريق الذكريات لحد السيارتين/);
    expect($('.map-info').textContent).not.toMatch(/بالفصل/);
    expect(app.game.flag('dg-box')).toBeFalsy(); // nothing was opened by looking
    const before = JSON.stringify(app.game.state.flags);
    app.destroy();
    app = createGameApp(root, { storage, reducedMotion: true });
    await app.toTitle();
    expect(JSON.stringify(app.game.state.flags)).toBe(before);
  });
});
