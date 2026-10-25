import '@fontsource/baloo-bhaijaan-2/arabic-500.css';
import '@fontsource/baloo-bhaijaan-2/arabic-700.css';
import '@fontsource/baloo-bhaijaan-2/latin-500.css';
import './styles.css';
import { createApp } from './app.js';

const opts = {};

// Development only: simulate another moment with ?now=2026-10-26T10:00:00+03:00
// (stripped from production builds, so visitors cannot use it).
if (import.meta.env.DEV) {
  const fake = new URLSearchParams(location.search).get('now');
  const fakeMs = fake ? Date.parse(fake) : NaN;
  if (!Number.isNaN(fakeMs)) {
    const offset = fakeMs - Date.now();
    opts.now = () => Date.now() + offset;
  }
}

createApp(document.getElementById('app'), opts);
