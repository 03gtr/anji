import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { offlinePlugin } from './build/offline-plugin.js';

const ROOT = dirname(fileURLToPath(import.meta.url));

// Strict CSP for the published site: everything is local, and connect-src
// 'none' guarantees the page cannot send anything anywhere. Added only to the
// production build so the dev server's live-reload socket keeps working.
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "script-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const cspPlugin = {
  name: 'secret-garden-csp',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
};

// Private owner content (private-art/, private/memories.json) is bundled only
// by the dev server and `npm run build:private` (--mode private). Tests and the
// normal build get an empty module, so a public build cannot leak it.
const privateSources = (command, mode) =>
  resolve(ROOT, 'src/game/art', (command === 'serve' && mode !== 'test') || mode === 'private' ? 'private-sources.js' : 'private-none.js');

export default defineConfig(({ command, mode }) => ({
  // Relative base: the built site works from any sub-path, e.g.
  // https://<user>.github.io/anji/ or a renamed repository, without rebuilding.
  base: './',
  resolve: { alias: { '@private-sources': privateSources(command, mode) } },
  plugins: [cspPlugin, offlinePlugin()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    sourcemap: false,
    rollupOptions: {
      input: {
        // The game is the main page; the original 24-hour gift stays available.
        main: resolve(ROOT, 'index.html'),
        gift: resolve(ROOT, 'gift.html'),
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
    // the multi-step DOM flow tests pass in ~2–4 s alone but can exceed the
    // 5 s default when every file runs in parallel on a slow machine
    testTimeout: 20000,
  },
}));
