import '@fontsource/baloo-bhaijaan-2/arabic-500.css';
import '@fontsource/baloo-bhaijaan-2/arabic-700.css';
import '@fontsource/baloo-bhaijaan-2/latin-500.css';
import './styles/game.css';
import { createGameApp } from './app.js';

if (import.meta.env.DEV && new URLSearchParams(location.search).has('timer')) globalThis.__timerLoop = true;

const app = createGameApp(document.getElementById('app'), {
  // the offline worker only exists in production builds
  swEnabled: import.meta.env.PROD,
});

// Development shortcuts (stripped from production builds):
//   ?scene=conservatory&flags=met-snooki,maze-done   jump straight into a scene
if (import.meta.env.DEV) {
  const q = new URLSearchParams(location.search);
  for (const f of (q.get('flags') || '').split(',').filter(Boolean)) app.game.setFlag(f);
  window.__game = app;
  if (q.get('scene')) app.go(q.get('scene'));
  else app.toTitle();
} else {
  app.toTitle();
}

app.offline.start();
