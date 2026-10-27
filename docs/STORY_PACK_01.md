# Story Pack 01 — «الطرق اللي تتذكر» (The Roads That Remember)

The first post-game expansion. Two new places, five story chapters, two optional
activities, three puzzles, two cinematics, a named companion and a one-time
"new places" notice — built on the systems the game already has. Nothing in the
main story changes, and no existing save field changes.

## 1. Audit (what the pack builds on)

| Need | Existing system reused | Files |
| --- | --- | --- |
| Locations | scene objects (props, platforms, actors, dynamic draws, interactables, triggers, exits) + map nodes | `data/scenes/*.js`, `data/worlds.js` |
| Story beats | action runner: `say`, `move`, `spawn`, `camera`, `cine`, `puzzle`, `fx`… | `world/engine.js` |
| Chapters with ids, prerequisites, rewards | missions: steps are conditions over flags; completion `flag:mission:<id>`, reward applied once | `data/missions.js`, `progression/missions.js` |
| Cinematics | shot player with skip, tap-to-advance, reduced motion | `ui/cinematic.js`, `data/cinematics.js` |
| Puzzles with hints/solution/skip | `cipher`, `program`, `arrange` rule types + solver | `puzzles/rules.js`, `puzzles/views.js`, `puzzles/host.js` |
| Persistence | `localStorage` key `snooki-game:save` (+ `:backup`, `:broken`), `SAVE_VERSION` 3, `MIGRATIONS`, `normalize()`; flags may be boolean, number **or string** | `core/save.js`, `core/game.js` |
| Offline | build-time precache list with a content-hash cache name; the player accepts updates (no forced reload) | `build/offline-plugin.js`, `core/sw-client.js` |
| Privacy | `@private-sources` alias, `scripts/audit-private.mjs` fails the build on private bytes/names/text | `vite.config.js`, `scripts/` |

**Save facts that shaped the design.** Progress is a flat set of flags, items,
collectibles, journal ids, records, unlocks, cosmetics, location, garden, hub.
Unknown flags survive `normalize()`; string flags are kept. So the whole pack is
additive flags + ids: **no schema change, no migration, `SAVE_VERSION` stays 3**,
and an older build that loads a newer save simply ignores the extra flags.

**Why after the ending.** Ryan is "the missing creator" until Act VIII. Meeting
him on a road or at a clinic earlier would contradict the main story, so the pack
opens with `flag:game-complete` (`SP1_UNLOCK` in `data/missions-sp1.js`). A
player who has not finished sees nothing new until she does.

## 2. Scope

**Built (Story Pack 01)**

| # | Mission id | What happens | Where |
| --- | --- | --- | --- |
| 01 | `sp1-two-roads` | the silent embrace (cinematic `sp1-embrace`) | `roads` |
| 02 | `sp1-sweets-roses` | flowers and sweets on a bench; Ryan walks in a moment later; three playful answers | `roseclinic` |
| 03 | `sp1-husky-name` | Ryan brings a white Siberian husky with icy-blue eyes; Anji names her (validated, saved once) | `roseclinic` |
| 04 | `sp1-unsigned-gift` | an unsigned box with a 3-symbol lock; three clues (one has a shortcut: the husky fetches it); Garden Cipher | `roads` + `roseclinic` |
| 05 | `sp1-garden-remembers` | the road has a new path; Ryan waits at the closed «بوابة الغد»; approach, explore first, or later | `roads` |
| side | `sp1-lost-ball` | The Lost Path (program puzzle) with the husky | `roseclinic` |
| side | `sp1-little-lines` | «من سطر صغير»: 3-second code montage + the Sequence Machine | `roseclinic` |

Also: the AI-disclaimer notice board (`roseclinic`, far from the embrace), one
surprise (Snooki steals the ball, once), the "new places" notice, HUD objective
for the active story chapter after the ending, a dev review sheet
(`/dev/art.html?only=pack`).

**Mini-games chosen** (3 of 8, each on an existing rule type, all optional
except the cipher, which can be skipped like every puzzle): A — Garden Cipher
(`sp1-cipher`), B — The Lost Path (`sp1-lost-ball`), C — The Sequence Machine
(`sp1-build-steps`).

**Documented for later, not built:** the Story House (the journal already
revisits memories), Snooky's Wildwood, the Garden Builder (the existing garden
designer covers it), Memory Trail, Missing Pieces, a two-dog co-op puzzle, the
Little Inventor, the wedding finale.

## 3. Storyboards

### Mission 01 — «حيث يلتقي الطريقان» (cinematic `sp1-embrace`, ~19 s, tap advances, «تخطي» leaves)

| Shot | Frame | Camera | Light / motion | Duration |
| --- | --- | --- | --- | --- |
| 1 `roads-wide` | two roads converge into evening light under arching trees; her white car and his blue car, small, side by side | wide, low, behind | golden haze at the vanishing point, light shafts, drifting leaves | 3.8 s |
| 2 `roads-stop` | both cars closer; he stands by his car, his back to her; she a few steps behind | medium, slow push-in | same light, warmer | 3.6 s |
| 3 `roads-near` | she is one step behind him | medium-close | push-in; a held pause (the hesitation, without judgement) | 3.4 s |
| 4 `roads-embrace` | she holds him from behind, her head against his back, her arms around his waist | close, behind both | warm bloom swells, leaves fall, one soft chime | 5.2 s |
| 5 `roads-after` | wide again, two small figures together between the cars | pull-back | light settles | 3.2 s |

1. **Purpose / tone:** tenderness; nothing to read.
2. **Environment:** the village entrance, two tree-covered roads (`theme: 'roads'`).
3. **Positions:** camera behind both; he faces the road (back to her, as in the
   memory); she approaches from behind. No faces are shown.
4. **Camera:** the in-world camera eases to the cars (1.6 s), then the
   cinematic: push-ins on shots 1–4, a pull-back on 5.
5. **Light / palette:** golden hour, violet sky, deep greens.
6. **Animation:** CSS only (push/pull, leaves, bloom); off with reduced motion.
7. **Audio:** the scene's `warm` bed continues; one `sparkle` at the embrace.
8. **UI:** HUD and controls hidden (overlay); no caption, no tap prompt
   (`silent: true`); only «تخطي» stays, for accessibility.
9. **Input:** tap/Enter = next shot; «تخطي»/Esc = leave. Control returns as soon
   as the overlay closes (engine `run()` → `mode: 'play'`).
10. **Exit / save:** `flag:sp1-embrace`, journal `sp1-roads`, keepsake
    `keepsake.roads.1`, applied **quietly** (no toasts over the ending). The
    trigger is re-armable and guarded by `!flag:sp1-embrace`: if the game closes
    mid-scene, it replays next visit; once seen, never again.
11. **Mobile:** shots are 360×260 `slice`; the subject stays in the centre
    third so a portrait phone keeps it.
12. **Assets:** drawn in code from the existing back-view sprites
    (`anjiBack`, `ryanSprite`), no image files; works offline.

### Mission 02 — «ورد وحلويات» (in-world)
Bench with roses and a sweets box (dynamic draw) → she inspects it (choice:
smell / taste / look for who left it) → 1.2 s pause → Ryan fades in just
off-screen right and walks to her (~3.4 s) → playful exchange with three
answers (teasing / curious / open the card) → Snooki's complaint and biscuit
truce → `flag:sp1-visit-done`. Camera: follows Ryan in, returns to her. All
lines fictional; the clinic is a fictional "rose clinic".

### Mission 03 — «اسم محد يعرفه غيرها» (in-world + panel)
Talk to Ryan → "هاو!" off-screen → the husky runs in (`kind: 'husky'`: Snooki's
build, icy-blue eyes `#7fd0ff`, rose collar, a flower) → Snooki: "I'm the
manager here" → name panel (5 suggestions + her own name) → the name is used in
the next lines, the journal, prompts and Snooki's remarks.

### Mission 04 — the unsigned gift
Box beside her car → clue 1 carved in a trunk (🌹 = و) → clue 2 in the clinic's
flower pot (💙 = د) → clue 3 on a high branch («القمر بالنص… أول حرف من عيد»): climb
the platforms, **or** ask the husky (shortcut, teamwork) → Garden Cipher
(word: وعد) → Snooki confesses he was "guarding" it (asleep).

### Mission 05 — «الحديقة تتذكر»
Back at the road entrance the fallen branch is gone; the camera shows the new
path → lanterns, roses, Ryan's car, Ryan facing the closed gate → choice:
approach (the gate conversation → `flag:sp1-done`) / explore first / later.
Nothing is lost by postponing.

### «من سطر صغير» (cinematic `sp1-montage`, 3.0 s)
1 `code-lines` (1.0 s): an editor with `const idea = "something useful";` —
generic, no real code or values. 2 `code-shape` (0.9 s): the code dims, a small
form component rises out of it. 3 `code-product` (1.1 s): a generic finished app
window with `iq-group.app` in the address bar and the caption «رسم توضيحي». It
is not a screenshot and claims nothing about the real site. Letterboxed so no
code is cut on phones. Optional: only from Ryan's laptop.

### Puzzles
| Puzzle | Teaches | Rules shown first | Hints (3) | Explanation after |
| --- | --- | --- | --- | --- |
| `sp1-cipher` | pattern + deduction | key shows 🌹/💙; the moon comes from the clue | yes | "each symbol was a letter…" |
| `sp1-lost-ball` | planning, algorithms (3 levels, turns required, trees block) | ⬆/↶/↷ explained in the intro | yes | names the idea: "algorithm" |
| `sp1-build-steps` | sequencing, cause and effect | 5 steps, 5 slots, partial-credit feedback | yes | why the order matters; errors are part of it |

## 4. Saves and updates

New state (all additive): flags `sp1-*`, `surprise:sp1-zoomies`, `notice:sp1`,
`mission(-seen):sp1-*`, `t.roads.*`/`t.roseclinic.*` trigger flags, the string
flag **`husky-name`**; collectibles `star.roads.1`, `keepsake.*`; journal
`sp1-*`; unlock `collar-rose` (already an existing cosmetic).

- **Existing saves load unchanged** (tested with a representative finished V3
  save: every field equal after load, after load→save→load twice, and after
  playing the whole pack except the intended additions).
- **Husky name:** set once by the name panel (`ui/name-picker.js`); a later call
  returns the saved name and never opens the panel. `cleanName()` accepts
  letters of any script and single spaces, ≤ 14 characters; refuses digits,
  symbols, markup, control/direction characters; anything unusable in a save
  falls back to «ثلجة» without touching other state. Survives export → import.
- **One-time rewards:** mission rewards via `flag:mission:<id>`; puzzle rewards on
  first solve; `collect`/`unlock`/`addJournal` are idempotent. Tested across a
  reload.
- **Replays:** every beat that completes a step is a re-armable trigger guarded
  by its own result flag, so an interrupted scene replays and a finished one
  never does.
- **Notice:** `dueNotice()` shows the card only if the pack's scene is
  registered, its map node is built, and its unlock holds; both answers set
  `notice:sp1`; it waits for overlays and toasts; it never reloads anything.
- **Offline / caching:** no new files — the pack is code in the main bundle, so
  the precache list stays complete (36 files) and the existing update flow
  (player-accepted, cache-name by content hash) applies unchanged. A failed
  import of the pack would fail the whole bundle, which the existing service
  worker already guards (old cache kept until the new one is fully installed).

**Adding the next pack:** add `data/missions-spN.js` (missions + a `PACKS`
entry), `data/scenes/spN.js`, `data/dialogue/spN.js`, puzzles, map nodes. Use
fresh `spN-` ids; never rename an id that shipped. Add a migration only if the
*shape* of the save must change.

**Finale hook:** the closed gate in `roads` (`interact` id `gate`, map position
x ≈ 2300) and `flag:sp1-done` are the entry point. A future «حديقة الغد» scene
adds an exit/condition on that gate (e.g. `if: 'flag:sp1-done'` → `goto`) — no
existing state needs to change.

## 5. Privacy

No private art, memories, photos or names are used. All new visuals are SVG/canvas
drawn in code. `npm run build` → `audit-private: clean`; a test asserts the
pack's illustrations contain no images, links or raster data.

## 6. Known limitations

- The embrace is a sequence of composed still frames with CSS motion, not a
  skeletal animation; the arms around his waist are drawn over the back-view
  sprites (stylised).
- Right after the embrace the existing mission system still shows its
  "chapter complete / new chapter" toasts.
- The husky follows Ryan's story beats but is not a companion that follows
  Anji around (Snooki keeps that role).
- Verified in headless Edge (phone 390×844, desktop 1280×720, landscape
  844×390); not on a physical phone, Safari or Firefox.

## 7. Review captures

Headless Edge against the public-mode dev server (no private art can load),
script-driven: `docs/story-pack-01/*.jpg` — the notice (phone), the embrace
(shots 1, 3, 4 desktop; shot 4 phone), Ryan's visit, the name panel refusing
"Luna2", the named husky in the world, the Lost Path and cipher puzzles, the
code montage, the gate of tomorrow, and the roads in landscape.
