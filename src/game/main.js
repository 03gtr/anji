import '@fontsource/baloo-bhaijaan-2/arabic-500.css';
import '@fontsource/baloo-bhaijaan-2/arabic-700.css';
import '@fontsource/baloo-bhaijaan-2/latin-500.css';
import './styles/game.css';
import './styles/v2.css';
import './styles/race3d.css';
import './styles/v3.css';
import './styles/sp1.css';
import './styles/sp2.css';
import { createGameApp } from './app.js';

if (import.meta.env.DEV && new URLSearchParams(location.search).has('timer')) globalThis.__timerLoop = true;

const app = createGameApp(document.getElementById('app'), {
  // the offline worker only exists in production builds
  swEnabled: import.meta.env.PROD,
});

// Development shortcuts (stripped from production builds):
//   ?scene=conservatory&flags=met-snooki,maze-done   jump straight into a scene
//   &game=race-night / &puzzle=library-candles        then open a minigame / puzzle
if (import.meta.env.DEV) {
  const q = new URLSearchParams(location.search);
  for (const f of (q.get('flags') || '').split(',').filter(Boolean)) app.game.setFlag(f);
  window.__game = app;
  const open = () => {
    if (q.get('game')) app.ui.minigame(q.get('game'));
    if (q.get('puzzle')) app.ui.puzzle(q.get('puzzle'));
  };
  if (q.get('scene')) app.go(q.get('scene')).then(open);
  else app.toTitle().then(open);
} else {
  app.toTitle();
}

app.offline.start();
