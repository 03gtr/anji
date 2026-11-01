/**
 * A playtest recorder (development only: loaded with `?playtest=1`, never in a production build, never saved,
 * never sent anywhere). It measures a real play session so playtime is reported, not guessed:
 * time in play / dialogue / cutscene / puzzle / testimony / menus, taps and keys, lines read, and when each
 * Season 2 mission completes. `window.__playtest.report()` returns the numbers; `.reset()` starts again.
 */
export function startPlaytest(app) {
  const SAMPLE = 200; // ms
  let t0 = performance.now();
  let time = {};
  let counts = { taps: 0, keys: 0, lines: 0 };
  let missions = [];
  const reset = () => {
    t0 = performance.now();
    time = { play: 0, dialogue: 0, cutscene: 0, puzzle: 0, testimony: 0, menu: 0, title: 0 };
    counts = { taps: 0, keys: 0, lines: 0 };
    missions = [];
  };
  reset();
  const now = () => performance.now() - t0;
  const category = () => {
    if (document.querySelector('.title-screen')) return 'title';
    if (document.querySelector('.overlay-testimony')) return document.querySelector('.overlay-dialogue') ? 'dialogue' : 'testimony';
    if (document.querySelector('.overlay-dialogue')) return 'dialogue';
    if (document.querySelector('.panel.puzzle')) return 'puzzle';
    if (document.querySelector('.overlay')) return 'menu';
    return app.screen?.world?.mode === 'cutscene' ? 'cutscene' : 'play';
  };
  const timer = setInterval(() => {
    time[category()] += SAMPLE / 1000;
  }, SAMPLE);
  addEventListener('pointerdown', () => counts.taps++, true);
  addEventListener('keydown', () => counts.keys++, true);
  app.bus.on('dialogue-line', () => counts.lines++);
  app.bus.on('change', (c) => {
    if (c.kind === 'flag' && /^mission:s2-/.test(String(c.id)) && !missions.some((m) => m.id === c.id)) missions.push({ id: c.id, at: Math.round(now() / 1000) });
  });
  const report = () => {
    const total = Object.values(time).reduce((a, b) => a + b, 0);
    const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));
    return { seconds: Math.round(total), activeGameplay: Math.round(time.play + time.puzzle + time.testimony), byKind: round(time), ...counts, missions };
  };
  window.__playtest = { report, reset, stop: () => clearInterval(timer) };
  console.info('[playtest] recording — window.__playtest.report()');
}
