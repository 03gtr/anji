# «إحنا فريق» — Team Us (Anji, Ryan, Snooki and her husky)

Branch `feature/team-us`, on top of `feature/story-pack-02` (PR #5, Release A, commit `bc33f19`:
the deep garden after the ending). It depends on that PR: the husky meeting (`HUSKY_MET`), the
two-page map, the logic grid and the post-ending gate.

**Not merged or deployed.** `main` is untouched.

Everything here is fiction made for the game: invented outings and games, not real memories.

The confirmed elements are kept as they were:
- the first meeting by the two tree-lined roads;
- the silent embrace (back-turned, unchanged);
- the clinic visit;
- the hope of marriage;
- Snooki as Ryan's companion;
- her white husky with icy-blue eyes.

## 1. Goal

After the ending the world should feel lived in: the two of them and the two dogs do things together.
- **Anji** is the one with ideas: she plans, sets the games, and changes the rules when she feels like it.
- **Ryan** joins in, jokes, and has his own surprises.

Every activity is optional and playable on its own.

## 2. Who is where: Snooki is Ryan's, the husky is hers (`data/companions.js`)

The owner's correction is applied as one pure rule, `dogsIn(scene, game)`. The engine reads it when a scene starts; nothing is saved.

| Story state | Snooki | Her husky |
| --- | --- | --- |
| Before the ending (every save that has not finished it) | walks with Anji (Ryan sent him: the original story, unchanged) | only where a scene places her |
| After the ending, Ryan in the scene | **beside Ryan** | follows Anji (once met) |
| After the ending, no Ryan, no story for Snooki | **away, with Ryan** (not drawn, no remarks, no taps) | follows Anji |
| After the ending, a story he is part of is open (`SNOOKI_JOINS`: Story Pack 01's roads, Story Pack 02's archive if played late, the deep garden's case until the second rose) | joins Anji | follows Anji |
| A scene that brings all four (`dogsAfter`: the walk) | follows | follows (Ryan walks too) |

The rule also guarantees:
- **She always has a dog:** a finished game that hasn't met the husky yet is never left without one; Snooki stays with her.
- **No duplicate husky:** a scene that places the husky itself keeps her there.
- **Deep Garden box beat:** Snooki is shown running in before he speaks.
- **Names and introductions:** no dog is renamed or reintroduced. The introduction stays guarded by `!flag:husky-name` / `!flag:sp1-husky-met`.

Tests (`tests/game/companions.test.js`, 11):
- every scene before the ending;
- the hidden garden, garden places, Story Pack 01, the deep garden, the archive and the walk;
- invariants across every scene and six story states (no save writes; name unchanged; Snooki beside Ryan only where Ryan is);
- no second introduction;
- two checks in the real engine (who is visible, who follows, where).

## 3. Ryan's look (from the owner's reference photo)

**Built:**
- **A face-to-face portrait (`ryanFace`, calm and smile)** for every line where he has turned to her (expression `turn`, from the reunion on). Drawn in the game's own style:
  - a close crop with a slight recession at the temples and a buzz texture;
  - a full dark beard joined to the moustache, rounded below the chin;
  - rectangular dark glasses, heavy straight brows, brown eyes, a calm look;
  - a thick neck and broad shoulders filling the frame.
- **The in-world side profile (`ryanSide`, what he walks in):** hair kept close to the head, a fuller beard, a broader chest and thicker arms.

**Unchanged on purpose:**
- the back view (`ryanSprite`): the embrace, waiting at the gate;
- the back portrait (`back`): his recordings in Acts III and V, the roads;
- the character-sheet views (`ryanView`).

**No photo in the build:** the reference photograph was used only to draw from. It is not stored in the repository or in any build (tested: the portrait contains no image reference).

**Limits:**
- This is a careful vector caricature, not a professional likeness. A dedicated illustrator pass would improve the resemblance most.
- There is no front-facing walking sprite. The side-scrolling world never walks him toward the camera, so a front walk would add nothing.
- The gym clothes from the photo are not used; he keeps his usual outfit.

## 4. The home base: Anji's plan notebook

The notebook sits on a bench in the hidden garden after the ending (one notice points at it, after the deep garden's).

**What she can pick:**
- Anji opens it and picks **one of today's possible plans**: «مشية العصر» (only once she has her husky, and while a route is left), «تمرين سوا», or «بعدين».
- Once everything possible is done, the notebook says so.

**Rules:**
- Each activity's place appears on the map only when she plans it, as a **shared place**: a warm rose ring, labelled «(نشاط سوا)». Investigation places are never confused with it.
- **Saves:** additive flags only (`tu-*`, `pdraft:tu-*`), so `SAVE_VERSION` stays 3.
- **Missions:** kind `together`, appended to the registry, so no older display number moves. They are optional everywhere (tested: no act, ending, story mission, other pack or map place needs a `tu-` flag).
- **No affection meter,** nothing to farm.

## 5. Built and tested

### «مشية العصر»: a walk, with a game in it

The steps:
1. **Plan:** in her notebook she proposes the walk and chooses the route, river or orchard (changing her mind clears the other).
2. **Walk:** all four walk together.
3. **Three stops per route:** Snooki reads the ground and follows only food (soap scares him); the husky follows what moves or flies. Anji's own card sets the rules, and Ryan notices a wet rock. Each stop becomes a journal fact, given once.
4. **The fork:** a 3×2 logic grid per route (where each trail leads, who follows it). It has exactly one solution, and every stop's rule is needed (tested).
   - A wrong check names the first broken rule.
   - Hints come only on request; a half-set grid survives closing.
5. **A picnic**, once per route: her planning revealed, a dogs beat, and a quiet scene. It gives a keepsake and moves the dogs' friendship on.
6. **The other route:** a harder grid. The dogs go from rivals to a team (`tu-dogs-1` → `tu-dogs-2`), with a second keepsake.

### «تمرين سوا»: training together, by her rules

The steps:
1. **Plan:** she chooses it in the notebook. No husky is needed; it opens with the ending.
2. **The training hall** («صالة التمرين»): Ryan trains at the stations with Snooki beside him, and her husky follows her.
3. **Warm-up:**
   - The chalkboard: «من الأخف للأثقل، وإذا تساوى وزنين: اللي ريان يكرهه أول».
   - Four station cards give weights in dumbbells.
   - At the plank Ryan lets slip: «أكرهه بصراحة».
   - The order (squats, plank, rope, push-ups) follows from those facts alone. A test derives it from the journal text.
4. **Rep ladder:** Anji's reps, then Ryan's. For the last round she blows the whistle: «قاعدة جديدة!». The rule change is shown on screen, and the old rule would give a wrong answer (tested). A wrong pick keeps her on the round.
5. **Cool-down:** Ryan's own surprise, two cold drinks, one labelled «للمدرّبة». She gets a keepsake (her whistle), once.

- No real exercise, timing, calories or health tracking (tested).

### Checks (actual results, this branch)

- `npm test`: **DOM 1118/1118 (29 files)**, **real browser 10/10** (map overlap at every viewport, with the new places).
- `npm run build`: OK, offline precache 36 files, `audit-private` clean. Service worker install plus update: **16/16**.
- **End-to-end in headless Edge with real taps** (phone, landscape, desktop): **87/87**, no page errors. Covered:
  - the walk: notice → notebook → route → stops → a wrong check → solving by tapping cells → picnic → no replay → reload;
  - the workout: notebook menu → hall → five cards → Ryan's face portrait in his live line → warm-up taps → ladder with the visible rule change and a wrong pick → cool-down → no replay → reload;
  - who stands where in the hidden garden and the hall.
- **Not tested:** a physical phone, Safari, Firefox, Anji's real save, and play time. **Not playtested.**

## 6. Planned (not built yet), each complete before the next

| Activity | Anji's role | Core interaction | Dogs |
| --- | --- | --- | --- |
| «عشا سوا» cook dinner | chooses the recipe or a surprise | gather from a fixed pantry (one ingredient found on the walk), order steps with real dependencies, one complication whose fix changes the dish | Snooki "tastes for safety" (with Ryan); the husky guards the pot |
| «مفاجأة أنجي» surprise outing | plans and reveals it in pieces | predict the destination from a note, an item and a route clue; a wrong guess still goes, with different lines | both sniff out the basket |
| «تحدي أنجي» the couple's challenge | sets a multi-step observation and memory challenge and changes one rule, with a fair visible sign | spot the changed object, rebuild a sequence, a small logic step | the husky "helps" by moving things |
| «مقلب لطيف» a harmless prank | plans it; Ryan joins the setup or answers it | choices lead to different small outcomes; affectionate, never humiliating | Snooki ruins the timing |
| quiet moments | earned after activities | no puzzle | they sleep side by side |

## 7. Future milestone, not in any release: the wedding

Deliberately not built: no scene, date, vows or marriage flag, and no line that says they are married. The tests check the dialogue, journal and missions.

When it is built, it should be a narrative payoff, not an achievement or a meter. It would come after several substantial shared adventures and the resolution of the open questions:
- time and presence;
- the «وعد» card;
- Anji choosing, freely.

Its tone and content need the owner's direction first. The existing hope (the «وعد» card, «نكمل لأن إحنا الاثنين نريد») stays exactly as it is.
