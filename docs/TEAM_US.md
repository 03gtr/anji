# «إحنا فريق» — Team Us (Anji, Ryan, Snooki and her husky)

Branch `feature/team-us`, cut from `78be065`, the head of PR #5 (`feature/story-pack-02`). It
depends on that PR. It uses the husky meeting (`HUSKY_MET`, Story Pack 02 / 01), the two-page
map and the logic grid from Phase 04.

- **Not in PR #5. Not merged or deployed.**
- **The Phase 05 change to PR #5** (the deep garden moved after the ending) is not on this branch yet. Rebase this branch on PR #5 once that change is committed there.
- Team Us touches only its own files, plus a few appends to registries; no Deep Garden file is shared.

Everything here is fiction made for the game. These are invented outings and games, not real
memories. The confirmed story elements are untouched: the first meeting by the two tree-lined
roads, the silent embrace, the clinic visit, the hope of marriage, Snooki as Ryan's companion,
and her white husky with icy-blue eyes.

## 1. Goal

After the ending, the world should feel lived in. The two of them, and the two dogs, do things together. Anji is the one with ideas: she plans, sets the games, and plays small harmless tricks. Ryan joins in, jokes, and contributes. Every activity is optional and playable on its own. Some activities connect to others.

## 2. The system: Anji initiates

**Home base: Anji's plan notebook («دفتر خطط أنجي»).** It sits on a bench in the hidden garden, near Ryan, from the moment the ending is over (`game-complete`).
- There is no meter and no pop-up stream. One notice, shown once, points at the notebook.
- The notebook lists only activities that are available and actually built. Each one is her plan; the player, as Anji, picks one and makes its choices (route, recipe, rule).
- An activity's place appears on the map when she plans it, so the map never shows empty nodes.
- **Data:** a mission of kind `together` (pack `team`), its scene, its puzzles, its dialogue and journal entries.
  - Missions are appended to the registry, so no display number moves.
  - State is additive flags (`tu-*`, `pdraft:tu-*`), so `SAVE_VERSION` stays 3.
- **Map:** shared places carry `together: true`, drawn with a warm rose ring and labelled «(نشاط سوا)» for screen readers. This keeps them apart from the investigation places.
- **Dogs, a slow friendship:** each shared dog activity moves it one step (`tu-dogs-1`, `tu-dogs-2`, …). The dialogue changes with it: rivals first, then a team. There is nothing to farm, because each step is earned by finishing a different activity or route.

## 3. Built and tested: «مشية العصر» (the afternoon walk)

What the player does:
1. **Plan.** At the notebook Anji proposes the walk "with a game in it": a hidden basket and three trails.
   - She chooses the route, river or orchard. The choice sets two boolean flags, one clearing the other, so she can change her mind.
2. **Walk.** «ممشى العصر» opens on the map, between the garden and the sanctuary. Ryan and the husky walk with her, and Snooki follows.
3. **Observe.** At three stops on her route, each dog notices something different.
   - Snooki reads the ground with his nose and only follows food. Soap scares him.
   - The husky follows anything that moves or flies.
   - Anji's own rules are on a card; Ryan adds what he sees (a wet rock).
   - Each stop becomes a journal fact, given once.
4. **Deduce.** The fork waits until all three stops of that route are seen. Then a 3×2 logic grid: where each trail leads, and which dog follows it.
   - It uses a new additive clue rule, `pair` ("whoever has A has B"), for "Snooki only follows food".
   - A wrong check names the first broken rule, never a count of correct cells. Hints come only on request (3 levels). A half-set grid survives closing.
5. **Picnic, a quiet moment.** The basket plays once per route: Anji's planning revealed, a dogs beat, and a short scene on the blanket ("next time you plan" / "so you can beat me at my own game?" / "of course").
   - It gives a keepsake (a pebble from the stream, or an apple leaf) and the dogs' first step.
6. **Again, the other way.** The notebook offers the other route. Different stops, a harder grid (no starting rule), and the dogs move on to working as a team (`tu-dogs-2`) with a second keepsake.

Why it needs thinking: no stop gives the answer. Only the three stops together decide each grid.
- This is tested: exactly one solution, and removing any non-structural rule allows more.
- Every rule is quoted in a journal fact found on that route, so the grid is fair.

Tests and checks (actual results, this branch):
- `tests/game/team-us.test.js`: 13 tests covering:
  - unlock only after the ending and with the husky;
  - optional everywhere (no act, ending, story mission, other pack or map place needs a `tu-` flag);
  - plan and route choice; stops per route given once;
  - fork waiting; grid fairness; the pair rule and its feedback;
  - the picnic once per route, the dogs' steps and keepsakes once, nothing paid twice;
  - wiring: every dialogue key and puzzle exists; nothing asks for or writes the husky's name;
  - the map spot; a synthetic mid-walk save reloading exactly (route, stops, draft);
  - no wedding words; and an in-app test of the map class and the grid draft.
- Full suite: 1058/1058 DOM, and 10/10 real-browser tests (map overlap at every viewport, with the new place).
- Build: OK; offline precache 36 files; private audit clean. Service worker install plus update: 16/16.
- End-to-end in headless Edge, with real taps on phone, landscape and desktop: 39/39, no page errors.
  - Steps covered: notice → notebook → route choice → three stops → a wrong check → solving by tapping cells → picnic → no replay → reload keeps it.
- Not tested: a physical phone, Safari, Firefox, Anji's real save, and real play time. **Not playtested.**

## 4. Planned (not built yet): next batches, each one complete before the next

| Batch | Activity | Anji's role | Core interaction | Dogs | Connects to |
| --- | --- | --- | --- | --- | --- |
| 2 | «تمرين سوا» shared workout | picks the routine, then changes one rule halfway ("now in reverse") | memory or order of a short routine with a tempo; she announces the change and a sign shows it, so it can be noticed | Snooki counts reps (badly), the husky races ahead | unlocks a stretching spot on the walk |
| 3 | «عشا سوا» cook dinner | chooses the recipe or a surprise | gather from a fixed pantry (one ingredient found on the walk), order steps with real dependencies, one complication (a burnt pan, or a substitute) whose fix changes the dish | Snooki "tastes for safety"; the husky guards the pot | the recipe card from the main story (lunchbox) |
| 4 | «مفاجأة أنجي» surprise outing | plans and reveals it in pieces | predict the destination from a note, an item and a route clue; a wrong guess still goes, with different lines | both dogs sniff out the picnic basket | a keepsake from the walk |
| 5 | «تحدي أنجي» the couple's challenge | sets a multi-step observation and memory challenge and changes one rule midway, with a fair visible sign | spot the changed object, rebuild a sequence, a small logic step | the husky "helps" by moving things | uses something seen in batch 2 or 4 |
| 6 | «مقلب لطيف» a harmless prank | plans it, and Ryan joins the setup or answers it | choices lead to different small outcomes; affectionate, never humiliating | Snooki ruins the timing | none (stands alone) |
| — | quiet moments | earned after activities: resting while the dogs play, a callback to a keepsake | no puzzle | they sleep side by side | the journal |

Rules for every batch:
- real interaction, not longer dialogue;
- no punishment for failure;
- no health tracking or medical claims;
- no jealousy, control or pressure presented as romance;
- Ryan is never made to look incompetent;
- each activity has its own tests and a browser check before the next starts.

## 5. Future milestone, not in any release: the wedding

The wedding is deliberately not built. There is no scene, date, vows or marriage flag; the tests check this.

When it is built, it should be a narrative payoff, not an achievement or a meter. It would come only after several substantial shared adventures and the resolution of the open story questions:
- time and presence (Ryan's work);
- the «وعد» card;
- Anji choosing, freely.

It needs the owner's own direction for tone and content before any design. The existing hope (the «وعد» card, «نكمل لأن إحنا الاثنين نريد») stays exactly as it is until then.
