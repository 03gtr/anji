/**
 * The investigation board («لوحة التحقيق», Season 3's journal tab) was removed by the owner's hotfix brief:
 *  - no tab, no screen, no controls: even a save that opened it (and drew threads) gets the journal without it, and a
 *    stale request for the tab opens the notes;
 *  - nothing waits for it: no mission step, unlock, scene condition or trigger reads a board-only flag — except
 *    Mission 03's old ending, kept as an alternative so an older save stays done;
 *  - Mission 03 ends in a talk with Marius (the evidence she already holds), for a save that solved the recordings
 *    before the update, and for a new one; a save that drew the thread before stays complete with nothing to redo;
 *  - the evidence, the dialogue and the journal pages are all still there.
 * (Every season and both endings, played without it: tests/game/s3-season.test.js, final-arc.test.js.)
 */
import fs from 'node:fs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameApp } from '../../src/game/app.js';
import { check } from '../../src/game/core/conditions.js';
import { applyEffects } from '../../src/game/core/effects.js';
import { MISSIONS } from '../../src/game/data/missions.js';
import { SCENES } from '../../src/game/data/scenes/index.js';
import { EVIDENCE_S3, JOURNAL_S3 } from '../../src/game/data/evidence-s3.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { missionState, syncMissions } from '../../src/game/progression/missions.js';
import { setup, player, done } from './s3-play.js';

const OLD_LINK = 's3:link:d-two-engines~contradicts~e-clip';
const BOARD_ONLY = /s3:link:|s3:board-open/;
const m03 = () => MISSIONS.find((m) => m.id === 's3-03');

/** Every condition in the game's data: mission steps and unlocks, scene actors, interactables, cases, triggers. */
function conditions() {
  const out = [];
  for (const m of MISSIONS) {
    out.push([`${m.id} unlock`, m.unlock]);
    m.steps.forEach((s, i) => out.push([`${m.id} step ${i + 1}`, s.done]));
  }
  for (const [id, sc] of Object.entries(SCENES)) for (const part of [sc.actors, sc.interact, sc.triggers, sc.exits]) (function walk(o, where) {
    if (Array.isArray(o)) return o.forEach((x) => walk(x, where));
    if (!o || typeof o !== 'object') return;
    const here = where === id && o.id ? `${id} ${o.id}` : where;
    for (const k of ['if', 'unless', 'glowIf', 'done', 'unlock']) if (k in o && typeof o[k] !== 'function') out.push([here, o[k]]);
    for (const v of Object.values(o)) walk(v, here);
  })(part, id);
  return out;
}

describe('the investigation board is gone', () => {
  it('its screen and its rules are no longer in the game', () => {
    expect(fs.existsSync('src/game/ui/board-s3.js')).toBe(false);
    expect(fs.existsSync('src/game/data/s3/board.js')).toBe(false);
    const css = fs.readFileSync('src/game/styles/s3.css', 'utf8');
    expect(css).not.toMatch(/s3-board|s3-card|s3-rels/);
    for (const f of fs.readdirSync('src/game', { recursive: true })) {
      if (!/\.js$/.test(f)) continue;
      const src = fs.readFileSync(`src/game/${f}`, 'utf8');
      expect(src, f).not.toMatch(/board-s3|s3\/board\.js|renderBoard|LINKS_S3/);
    }
    // and no place offers it: the cork board in her room is only a drawing now
    expect(SCENES['s3-home'].interact.some((it) => /لوحة التحقيق/.test(it.label ?? '') || JSON.stringify(it).includes("journal\":\"board"))).toBe(false);
  });

  it('nothing waits for it: no condition anywhere reads a board-only flag, but Mission 03\'s old ending kept as an alternative', () => {
    const found = conditions().filter(([, c]) => BOARD_ONLY.test(JSON.stringify(c ?? null)));
    // the step (done by the talk, or by the old thread), and Marius's telling (not twice, for an older save)
    expect([...new Set(found.map(([w]) => w))].sort()).toEqual(['s3-03 step 4', 's3-home marius']);
    const [, last] = found.find(([w]) => w === 's3-03 step 4');
    expect(last.any).toEqual(['flag:s3:03-told', `flag:${OLD_LINK}`]);
  });

  it('a new save: Mission 03 ends in a talk with Marius', () => {
    const { game, others } = setup();
    const before = others();
    const p = player(game, {});
    for (const [scene, ids] of [['s3-clinic', ['sabri', 'log', 'lama', 'board', 'printer', 'appointments', 'counter', 'sabri']], ['s3-street', ['lamp', 'bakery', 'camera', 'plate']], ['s3-home', ['marius', 'phone', 'desk']]]) {
      p.visit(scene);
      for (const id of ids) p.tap(scene, id);
    }
    expect(game.flag('s3:03-solved')).toBe(true);
    expect(missionState(m03(), game)).toMatchObject({ status: 'active', step: 3 });
    expect(m03().steps[3].text).toMatch(/ماريوس/);
    p.tap('s3-home', 'marius');
    expect(p.said).toContain('s3.03-tell');
    expect(done(game, 's3-03')).toBe(true);
    expect(game.flag(OLD_LINK)).toBeFalsy();
    // the next talk is his usual line, not the telling again
    p.tap('s3-home', 'marius');
    expect(p.said.filter((d) => d === 's3.03-tell')).toHaveLength(1);
    expect(others()).toEqual(before);
  });

  it('an older save that drew the thread is complete, with nothing to redo; one that had only solved it, ends with Marius', () => {
    const a = setup();
    a.game.setFlags(['mission:s3-01', 'mission:s3-02', 's3:03-opened', 's3:03-solved', 's3:board-open', OLD_LINK]);
    for (const e of ['e-clip', 'e-rec-cam', 'e-rec-gate', 'e-rec-lama', 'd-two-engines']) applyEffects(`ev3:${e}`, a.game);
    syncMissions(a.game, { season: 's3' });
    expect(done(a.game, 's3-03')).toBe(true);
    const pa = player(a.game, {});
    pa.visit('s3-home');
    pa.tap('s3-home', 'marius');
    expect(pa.said).not.toContain('s3.03-tell');

    const b = setup();
    b.game.setFlags(['mission:s3-01', 'mission:s3-02', 's3:03-opened', 's3:03-solved', 's3:board-open']);
    for (const e of ['e-clip', 'e-rec-cam', 'e-rec-gate', 'e-rec-lama', 'd-two-engines']) applyEffects(`ev3:${e}`, b.game);
    syncMissions(b.game, { season: 's3' });
    expect(missionState(m03(), b.game)).toMatchObject({ status: 'active', step: 3 });
    const pb = player(b.game, {});
    pb.visit('s3-home');
    pb.tap('s3-home', 'marius');
    expect(done(b.game, 's3-03')).toBe(true);
    // what she had is all still there
    for (const e of ['e-clip', 'd-two-engines']) expect(check(`ev3:${e}`, b.game), e).toBe(true);
  });

  it('the evidence, the dialogue and the journal pages stay', () => {
    for (const id of ['e-clip', 'e-rec-cam', 'd-two-engines', 'd-seven', 'd-truth', 'e-keyring', 'd-second-car']) expect(EVIDENCE_S3[id], id).toBeTruthy();
    for (const id of ['s3-echo', 's3-snooki']) expect(JOURNAL_S3[id], id).toBeTruthy();
    for (const id of ['s3.03-tell', 's3.03-pinned', 's3.03-solved', 's3.03-marius-after']) expect(DIALOGUE[id], id).toBeTruthy();
    expect(DIALOGUE['s3.03-board-opens']).toBeUndefined();
    expect(check({ any: [`flag:${OLD_LINK}`, 'flag:s3:03-told'] }, { flag: (k) => k === 's3:03-told' })).toBe(true);
  });
});

const noop = () => {};
function fakeContext() {
  const gradient = { addColorStop: noop };
  return new Proxy({}, { get: (_t, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => gradient : k === 'measureText' ? () => ({ width: 40 }) : k === 'getImageData' ? () => ({ data: [] }) : noop), set: () => true });
}
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

describe('the journal, in the real game', () => {
  let root;
  let app;
  beforeEach(() => {
    globalThis.__timerLoop = true;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext());
    vi.stubGlobal('OffscreenCanvas', undefined);
    root = document.createElement('div');
    document.body.append(root);
  });
  afterEach(() => {
    app?.destroy();
    root.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete globalThis.__timerLoop;
  });

  it('a save that had the board open (threads drawn): every other tab, no board; asking for it opens the notes', async () => {
    const { game, storage } = setup();
    game.setFlags(['s3:board-open', OLD_LINK]);
    applyEffects(['ev3:e-clip', 'ev3:d-two-engines', 'journal:s3-echo'], game);
    game.save();
    const before = storage.dump();
    app = createGameApp(root, { storage, reducedMotion: true });
    await app.toTitle();
    app.ui.openJournal('board');
    const tabs = await until(() => root.querySelector('.journal .tabs'));
    expect([...tabs.querySelectorAll('[data-tab]')].map((b) => b.dataset.tab)).toEqual(['notes', 'missions', 'evidence', 'collection', 'bag', 'challenges', 'achievements']);
    expect(tabs.textContent).not.toMatch(/لوحة التحقيق/);
    expect(root.querySelector('.journal [data-tab="notes"]').getAttribute('aria-selected')).toBe('true');
    // what she found is still in her notebook (Season 3's pages), and every other tab opens
    expect(root.querySelector('.journal-body').textContent).toMatch(/محركين، مو واحد/);
    for (const tab of ['missions', 'evidence', 'collection', 'bag', 'challenges', 'achievements']) {
      root.querySelector(`.journal [data-tab="${tab}"]`).click();
      expect(root.querySelector('.journal-body').textContent.trim().length, tab).toBeGreaterThan(0);
    }
    // opening the journal wrote nothing
    expect(storage.dump()).toEqual(before);
  });
});
