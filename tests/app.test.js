import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createApp, DISCOVERIES } from '../src/app.js';
import { T } from '../src/content.js';
import { memoryStorage } from './helpers.js';

const LAUNCH = '2026-10-26T09:00:00+03:00';
const START = Date.parse(LAUNCH);
const H = 3600_000;

let root;
let app;
let clock;

function mount({ at = START + H, storage = memoryStorage(), launchAt = LAUNCH } = {}) {
  clock = at;
  app = createApp(root, {
    now: () => clock,
    launchAt,
    storage,
    reducedMotion: true,
    checkEveryMs: 1000,
  });
  return app;
}

const $ = (sel) => root.querySelector(sel);
const click = (sel) => {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el) throw new Error(`nothing matches ${sel}`);
  el.click();
};
const guideText = () => $('.guide-text').textContent;
const guided = () => root.querySelector('.is-guided');

beforeEach(() => {
  vi.useFakeTimers();
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  app?.destroy();
  app = null;
  root.remove();
  vi.useRealTimers();
});

function enterGarden() {
  mount();
  click('[data-action="take-rose"]');
  vi.advanceTimersByTime(400);
  expect(app.sceneName).toBe('garden');
}

describe('time window', () => {
  it('shows the sleeping garden before launch, with no interactive controls', () => {
    mount({ at: START - 3 * H - 20 * 60_000 });
    expect(app.sceneName).toBe('gate-before');
    expect(root.textContent).toContain(T.before.title);
    expect(root.textContent).toContain('٣ ساعات و ٢٠ دقيقة');
    expect(root.querySelectorAll('main button')).toHaveLength(0);
    expect($('.guide').hidden).toBe(true);
  });

  it('opens by itself once the launch time arrives (checked against timestamps)', () => {
    mount({ at: START - 1000 });
    expect(app.sceneName).toBe('gate-before');
    clock = START + 5;
    vi.advanceTimersByTime(1000);
    expect(app.sceneName).toBe('welcome');
    expect($('.guide').hidden).toBe(false);
  });

  it('allows the full experience inside the window', () => {
    mount({ at: START });
    expect(app.sceneName).toBe('welcome');
    app.destroy();
    mount({ at: START + 24 * H - 1 });
    expect(app.sceneName).toBe('welcome');
  });

  it('shows the expired garden exactly 24h after launch', () => {
    mount({ at: START + 24 * H });
    expect(app.sceneName).toBe('gate-expired');
    expect(root.textContent).toContain(T.expired.title);
    expect(root.textContent).toContain(T.expired.line);
    expect(root.querySelectorAll('main button')).toHaveLength(0);
  });

  it('blocks the very next interaction once the window has passed', () => {
    enterGarden();
    clock = START + 25 * H;
    click('[data-spot="clinic"]');
    expect(app.sceneName).toBe('gate-expired');
    // ordinary navigation is refused while expired
    app.go('garden');
    expect(app.sceneName).toBe('gate-expired');
  });

  it('re-checks when the page regains focus', () => {
    enterGarden();
    clock = START + 30 * H;
    window.dispatchEvent(new Event('focus'));
    expect(app.sceneName).toBe('gate-expired');
  });

  it('stops the mini-game when the window ends mid-game', () => {
    enterGarden();
    click('[data-spot="delivery"]');
    click('[data-action="start"]');
    expect(app.sceneName).toBe('game');
    clock = START + 24 * H;
    click('.lane[data-lane="0"]');
    expect(app.sceneName).toBe('gate-expired');
  });

  it('fails closed with a gentle screen when the launch time is misconfigured', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount({ launchAt: '2026-10-26 09:00' });
    expect(app.sceneName).toBe('gate-invalid');
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe('welcome scene', () => {
  it('greets Anji and the guide points at the rose button', () => {
    mount();
    expect($('.welcome-hello').textContent).toBe('هلو أنجي! 🐰🌷');
    expect($('.welcome-line').textContent).toBe('جبتلچ وردة صغيرة، وعندي حديقة بيها شوية مفاجآت إلك.');
    const btn = $('[data-action="take-rose"]');
    expect(btn.textContent).toBe('آخذ الوردة 🌹');
    expect(guided()).toBe(btn);
    expect(guideText()).toBe(T.welcome.guide);
    expect(document.documentElement.getAttribute('dir') ?? 'rtl').toBe('rtl');
  });

  it('taking the rose leads straight into the garden', () => {
    mount();
    click('[data-action="take-rose"]');
    expect(guideText()).toBe(T.welcome.taken);
    vi.advanceTimersByTime(400);
    expect(app.sceneName).toBe('garden');
    expect(guideText()).toBe(T.garden.intro);
    expect(guided()?.dataset.spot).toBe('clinic');
  });

  it('a returning visitor lands in the garden with her progress', () => {
    const storage = memoryStorage();
    mount({ storage });
    click('[data-action="take-rose"]');
    vi.advanceTimersByTime(400);
    click('[data-secret="star-2"]');
    app.destroy();
    mount({ storage });
    expect(app.sceneName).toBe('garden');
    expect($('[data-secret="star-2"]').classList.contains('is-found')).toBe(true);
  });
});

describe('garden & memories', () => {
  it('every memory card opens and closes back to the garden', () => {
    enterGarden();
    for (const id of ['clinic', 'delivery', 'night', 'star']) {
      click(`[data-spot="${id}"]`);
      expect(app.sceneName).toBe(id);
      click('.memory-top [data-action="back"]');
      expect(app.sceneName).toBe('garden');
    }
  });

  it('clinic: reveal shows the appointment card and records the discovery', () => {
    enterGarden();
    click('[data-spot="clinic"]');
    expect(root.textContent).toContain(T.clinic.story);
    expect(guided()).toBe($('[data-action="reveal"]'));
    expect($('.memory-reveal').hidden).toBe(true);
    click('[data-action="reveal"]');
    expect($('.memory-reveal').hidden).toBe(false);
    expect(root.textContent).toContain('قسم الورد');
    expect(root.textContent).toContain(T.clinic.note);
    expect(app.store.has('memory-clinic')).toBe(true);
    click('.memory-footer [data-action="back"]');
    expect(app.sceneName).toBe('garden');
    const spot = $('[data-spot="clinic"]');
    expect(spot.classList.contains('is-found')).toBe(true);
    expect(spot.classList.contains('is-available')).toBe(false);
    // the guide moves on to the next memory
    expect(guided()?.dataset.spot).toBe('delivery');
  });

  it('night arch and secret star reveal their messages', () => {
    enterGarden();
    click('[data-spot="night"]');
    expect(guided()).toBe($('[data-action="arch"]'));
    click('[data-action="arch"]');
    expect($('.scene').classList.contains('is-revealed')).toBe(true);
    expect(root.textContent).toContain(T.night.line);
    click('.memory-footer [data-action="back"]');

    click('[data-spot="star"]');
    click('[data-action="star"]');
    expect(root.textContent).toContain(T.star.line);
    expect(app.store.has('memory-night')).toBe(true);
    expect(app.store.has('memory-star')).toBe(true);
  });

  it('hidden stars, roses and the peeking bunny are celebrated without leaving the garden', () => {
    enterGarden();
    click('[data-secret="star-1"]');
    expect(guideText()).toBe(T.secrets.star(2));
    expect(app.sceneName).toBe('garden');
    root.querySelectorAll('[data-rose]').forEach((b) => b.click());
    expect(app.store.has('roses')).toBe(true);
    expect(guideText()).toBe(T.secrets.roses);
    click('[data-secret="bunny"]');
    expect(guideText()).toBe(T.secrets.bunny);
    // celebration fades back to the current instruction
    vi.advanceTimersByTime(5000);
    expect(guideText()).toBe(T.garden.intro);
  });

  it('the progress indicator counts discoveries', () => {
    enterGarden();
    expect($('.progress-text').textContent).toBe(T.common.progress(0, DISCOVERIES.length));
    click('[data-secret="star-3"]');
    expect($('.progress-text').textContent).toBe('استكشفتي ١ من ١٠');
    expect($('.progress').getAttribute('aria-valuenow')).toBe('1');
  });
});

describe('delivery mini-game', () => {
  it('explains the controls, moves the car by tapping lanes, and can be finished', () => {
    enterGarden();
    click('[data-spot="delivery"]');
    expect(guided()).toBe($('[data-action="start"]'));
    click('[data-action="start"]');
    expect(app.sceneName).toBe('game');
    expect(guideText()).toBe(T.game.guide);

    const game = app.scene;
    click('[data-action="start"]');
    click('.lane[data-lane="2"]');
    expect(game.state.lane).toBe(2);
    click('.lane[data-lane="0"]');
    expect(game.state.lane).toBe(0);

    // feed items straight into the car's lane: no precise input required
    for (let i = 0; i < 8; i++) {
      game.state.items.push({ id: 1000 + i, lane: game.state.lane, y: 0.8, kind: 'rose' });
      game.tick(0.01);
    }
    expect(game.state.done).toBe(true);
    expect($('.game-done').hidden).toBe(false);
    expect(app.store.has('game-delivery')).toBe(true);
    click('[data-action="back-done"]');
    expect(app.sceneName).toBe('garden');
  });

  it('can be skipped', () => {
    enterGarden();
    click('[data-spot="delivery"]');
    click('[data-action="start"]');
    click('[data-action="skip"]');
    expect($('.game-done').hidden).toBe(false);
    expect($('.game-done-line').textContent).toBe(T.game.skipped);
  });

  it('arrow keys move the car', () => {
    enterGarden();
    click('[data-spot="delivery"]');
    click('[data-action="start"]');
    const game = app.scene;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(game.state.lane).toBe(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(game.state.lane).toBe(2);
  });
});

describe('ending', () => {
  it('can be reached without finding everything, after a gentle check', () => {
    enterGarden();
    click('[data-spot="gate"]');
    expect(app.sceneName).toBe('garden');
    expect($('.gate-confirm').hidden).toBe(false);
    click('[data-action="gate-stay"]');
    expect($('.gate-confirm').hidden).toBe(true);
    click('[data-spot="gate"]');
    click('[data-action="gate-go"]');
    expect(app.sceneName).toBe('ending');
  });

  it('goes straight to the ending after a couple of memories', () => {
    enterGarden();
    app.store.discover('memory-clinic');
    app.store.discover('memory-star');
    click('[data-spot="gate"]');
    expect(app.sceneName).toBe('ending');
    for (const line of T.ending.lines) expect(root.textContent).toContain(line);
    expect(guideText()).toBe(T.ending.guide);
  });

  it('replay starts over from the welcome scene', () => {
    enterGarden();
    app.go('ending');
    click('[data-action="replay"]');
    expect(app.sceneName).toBe('welcome');
    expect(app.store.get().found).toEqual([]);
  });

  it('never asks for a reply, contact details or survey answers', () => {
    enterGarden();
    app.go('ending');
    expect(root.querySelectorAll('input, textarea, select, form')).toHaveLength(0);
  });
});

describe('rabbit guide controls', () => {
  it('minimises, restores and replays without trapping the visitor', () => {
    mount();
    click('[data-guide="min"]');
    expect($('.guide').classList.contains('is-min')).toBe(true);
    expect(app.store.get().guideMin).toBe(true);
    // the page is still fully usable while the guide is minimised
    click('[data-action="take-rose"]');
    vi.advanceTimersByTime(400);
    expect(app.sceneName).toBe('garden');
    click('[data-guide="avatar"]');
    expect($('.guide').classList.contains('is-min')).toBe(false);
    expect(guideText()).toBe(T.garden.intro);
    click('[data-secret="star-1"]');
    click('[data-guide="replay"]');
    expect(guideText()).toBe(T.garden.intro);
  });
});

describe('privacy', () => {
  it('makes no network requests during a full walk-through', () => {
    const fetchSpy = vi.fn();
    const beacon = vi.fn();
    const origFetch = globalThis.fetch;
    const origBeacon = navigator.sendBeacon;
    globalThis.fetch = fetchSpy;
    navigator.sendBeacon = beacon;
    try {
      enterGarden();
      for (const id of ['clinic', 'night', 'star']) {
        click(`[data-spot="${id}"]`);
        click('.memory-actions .btn-primary');
        click('.memory-footer [data-action="back"]');
      }
      click('[data-spot="delivery"]');
      click('[data-action="start"]');
      click('[data-action="skip"]');
      click('[data-action="back-done"]');
      click('[data-spot="gate"]');
      expect(app.sceneName).toBe('ending');
    } finally {
      globalThis.fetch = origFetch;
      navigator.sendBeacon = origBeacon;
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
  });
});
