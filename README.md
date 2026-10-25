# حديقة أنجي السرّية — Anji's Secret Garden 🌹🐇

A small, mobile-first interactive gift: a white rabbit guides Anji through a
moonlit garden of little memories, a tiny delivery mini-game and a few hidden
secrets. It is open for one 24-hour window.

- Static site (Vite + plain JavaScript). No backend, database, Firebase, accounts,
  analytics, external APIs or tracking.
- Everything (art, font, sounds) is bundled. The published page carries a
  Content-Security-Policy with `connect-src 'none'`, so it cannot send data anywhere.
- Her progress is kept only in her own browser (`localStorage`) so a reload doesn't
  lose it. That is not a backup and is never sent anywhere.

---

## 1. Set the launch time ⏰ (required)

Open **`src/config.js`** and edit `DEFAULT_LAUNCH_AT`:

```js
export const DEFAULT_LAUNCH_AT = '2026-10-26T09:00:00+03:00';
```

- Use ISO format **with a time-zone offset**. Baghdad is `+03:00`.
  A value without an offset is rejected on purpose, because it would shift with
  the visitor's own time zone.
- The garden closes **exactly 24 hours later**. That is `WINDOW_MS` in the same file.
- Before the launch time she sees a "the garden is still asleep" screen with a countdown.
  After the window she sees the closed, expired garden.
- If the value is malformed, the site shows a gentle "not ready yet" screen
  (and logs the reason to the console) instead of opening.

Optional: you can override the time without editing code. Set a repository variable
named `LAUNCH_AT` (Settings → Secrets and variables → Actions → Variables) and the
deploy workflow passes it to the build. Locally the same works with
`VITE_LAUNCH_AT='…' npm run build`.

## 2. Run locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open http://localhost:5173/. To preview another moment during development, add
`?now=`, for example
`http://localhost:5173/?now=2026-10-26T12:00:00%2B03:00` (active),
`…?now=2026-10-27T10:00:00%2B03:00` (expired).
This override exists **only in the dev server**. It is stripped from production builds.

To start the garden over in your browser, use "نعيدها من البداية" on the ending
screen, or clear the site data.

## 3. Test and build

```bash
npm test          # unit and flow tests (Vitest + happy-dom)
npm run build     # production site in dist/
npm run preview   # serve dist/ locally
```

The build uses a relative base (`./`), so it works at
`https://<user>.github.io/anji/`, under a renamed repository, or on a custom domain.

## 4. Deploy to GitHub Pages

The workflow `.github/workflows/deploy.yml` tests, builds and publishes `dist/` on
every push to `main`.

1. Push this project to `main` on GitHub.
2. In the repository, go to **Settings → Pages → Build and deployment → Source** and
   choose **GitHub Actions**. This is a one-time setting.
3. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to finish (green).
   You can re-run it any time with **Run workflow**.

> Note: on GitHub's free plan, Pages only works for **public** repositories, so the
> source (including all the text) is readable by anyone who finds the repository.
> The page itself is not indexed (`noindex`), but it is not private either.

## 5. Verify the published URL

The URL is shown on the workflow run and under Settings → Pages. For this repository it
is normally **https://03gtr.github.io/anji/**.

Check, on a phone if possible:

- [ ] Before the launch time: the sleeping-garden screen with a countdown.
- [ ] During the window: the rabbit, the rose button, and the garden after tapping it.
- [ ] No broken images or fonts. The browser console shows no errors.

To check the "open" state before launch day, build locally with a past launch time
and run `npm run preview`. Don't deploy that build.

## 6. After the 24 hours: switching it off

There are **two different things**:

1. **The expired screen (automatic).** When the window ends, the page shows the closed
   garden and stops all interaction. This happens in her browser and checks her
   device's clock on load, on focus, every 15 seconds, and before every tap.
   **It is a courtesy, not security.** Anyone can change their clock, edit the code,
   or keep a saved copy. Nothing is deleted.
2. **Taking the site down (manual, by you).** The URL keeps serving the files until you
   remove them. Pick one:
   - **Unpublish Pages:** Settings → Pages → *Unpublish site*. You can also set
     Source to "None" or disable the workflow.
   - **Delete the repository:** Settings → General → Danger Zone → *Delete this
     repository*. This removes the code and the Pages site.

   After unpublishing, the URL usually returns 404 within minutes. Browsers or proxies
   may keep cached copies for a while, and copies people already saved are out of
   anyone's control.

Nothing in this project deletes itself or changes GitHub settings automatically.

---

## Project map

| Path | What it is |
| --- | --- |
| `src/config.js` | **Launch time**, window length, storage key |
| `src/content.js` | Every visitor-facing line (Iraqi Arabic), easy to edit |
| `src/expiry.js` | Pure time-window logic (`before` / `active` / `expired`) |
| `src/app.js` | Scene router, time gate, header and progress |
| `src/guide.js` | The rabbit guide: speech bubble, paw pointer, minimise/replay |
| `src/scenes/*` | Welcome, garden, the four memories, mini-game, ending, gate screens |
| `src/game-logic.js` | Deterministic mini-game rules (no losing, generous catch zone) |
| `src/art.js` | All illustrations as hand-written inline SVG |
| `src/sound.js` | Optional soft tones (Web Audio). Off by default, never autoplays |
| `tests/` | Expiry, storage, game logic and full-flow tests |

Accessibility: RTL Arabic layout, 44px+ touch targets, safe-area insets, keyboard
support (arrow keys in the game), screen-reader labels, and a `prefers-reduced-motion`
mode where everything works without drifting animation.
