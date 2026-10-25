import { defineConfig } from 'vite';

// Strict CSP for the published site: everything is local, and connect-src
// 'none' guarantees the page cannot send anything anywhere. Added only to the
// production build so the dev server's live-reload socket keeps working.
const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "script-src 'self'",
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

export default defineConfig({
  // Relative base: the built site works from any sub-path, e.g.
  // https://<user>.github.io/anji/ or a renamed repository, without rebuilding.
  base: './',
  plugins: [cspPlugin],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js'],
  },
});
