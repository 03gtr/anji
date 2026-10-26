# Game design — Secret Garden: Snooki & the Missing Creator

## Pitch

A garden built in secret, a creator who vanished, and a husky who knows more
than he admits. The player is Anji: the active hero who explores, reasons,
races and chooses. It is a story for an adult — the humour is dry and
character-driven, the romance is quiet and earned, and the mystery pays off.

## Tone

- **Funny** through timing and character: Snooki's confidence never matches his
  competence; objects talk back (the gate is melodramatic, the peacock is vain).
- **Mysterious**: every act answers one question and raises a better one.
- **Warm, never saccharine**: emotional beats land after gameplay, not instead
  of it. Ryan is mostly absent; his presence is felt through notes, objects,
  voice recordings and contradictions.
- **Iraqi Arabic** throughout (چ / گ spelling, local idioms).

## Characters

| | Role | Design notes |
| --- | --- | --- |
| **Anji** | Playable hero | Long wavy auburn hair with golden highlights, burgundy bow, green eyes, red lips; black jacket over red-black-white plaid (default). 10 expressions, 6 outfits, 5 bows. Smart, sarcastic, kind. Loves blue roses, cars, animals, the gym and healthy food. |
| **Snooki** | Companion & comic engine | Fluffy white Siberian husky, amber eyes with dark rims, pink inner ears, navy collar with a blue paw tag. 9 portrait expressions, 10 poses, 6 hats, 4 collars. "Security consultant with fur." Terrible at keeping secrets; secretly following Ryan's instructions. |
| **Ryan** | The missing creator | Seen from behind or as a shadow: dark hair, charcoal hoodie, black backpack, jeans. Present through notes, recordings, warm tea and the Creator's Mark. Fully revealed only in Act VIII. |
| Nurse Needle | Running gag | A cheerful cartoon syringe with a rubber safety ball, determined to give Snooki his overdue vaccine. Harmless. |
| The Gate | Guardian | Speaks in formal Arabic, very dramatic. |
| العم منذر (Uncle Munther) | Astronomer owl | Warm, clever, slightly eccentric, often more confident than correct (calls Snooki «ذيب», reads a dumbbell as a bone). |
| Sultan | Sanctuary peacock | Vain, alibi-ready. |

## The mystery (spoilers)

1. **Act I** — Why did Ryan disappear, why does the garden react to Anji, why
   does Snooki act strangely? A shadow vanishes behind the gate.
2. **Act II** — Contradiction: a letter dated *tomorrow*, and tea still warm on
   Ryan's desk. Ryan isn't gone; he is hiding *from her*.
3. **Act III** — Ryan's voice on the car radio: "look right on the bridge" — the
   observatory light is on.
4. **Act IV** — The map fragment is stolen. The culprit is Snooki, acting on
   Ryan's written instructions ("4) if she asks where I am, act natural").
5. **Act V** — The Creator's Mark is not an R: the leaf is an **A**. The stars
   spell **أنجي**. The garden was built *for her*.
6. **Act VI** — The memory corridor and the lanterns: what the garden means.
   "Thank you for coming." Snooki admits he misses Ryan.
7. **Act VII** — The workshop of unfinished things "for her", and the machine
   that stitches the map: "the last room only opens from the outside."
8. **Act VIII** — Ryan under the blue rose tree. He says plainly that work and
   responsibilities took more of his time than they should have — not as an
   excuse, and not dressed up as ambition — and that nothing is owed: the
   garden is a gift, and anything next is a choice two people make by talking
   and making time. Snooki interrupts at the worst moment. A folded paper: the
   owner's drawing, unfolded by her (kept in the journal to reopen). They
   plant a blue rose together (Snooki digs). Three hopeful endings:
   **حديقة الأمل** (the 2:30 clue chain found), **حديقة الذكريات** (most letters
   or side missions), **حديقة بعدها تكبر** (main story only). The last line
   leaves the rest to a real conversation: «الباقي… مو باللعبة».

### Finale tone rules (owner's)

- Never mention family opposition or rejection, not even indirectly.
- No pressure to forgive, wait, stay or accept; no guilt; she owes nothing.
- No invented dates, conversations, songs or real events. The only real-life
  details used are the ones the owner supplied (the ~2:30 wait after her shift,
  home-cooked food, racing home, animals, the gym, speed, blue, the drawing).
- A test (`tests/game/v2-content.test.js`) guards the first two rules.

## The 2:30 clue chain (V2)

clock in the hall (2:30) → Ryan's laptop: the unfinished `BlueRoseEngine` build
(the time in 24 h: 14:30, "after the shift") → «إطفي الضوء» → lamp off: four
glowing symbols (read right → left) → the desk drawer → Ryan's note about the
clock and a small key → the moving bookshelf → the hidden passage → the
waiting room (a window on the road, a clock at 2:30, a spare car key «للطريق
للبيت») → the night run home.

## V2 missions

| Mission | Kind | Where | Gameplay | Leads to / reward |
| --- | --- | --- | --- | --- |
| البناء الناقص | side | study | code fix, lamp, symbol lock | key → الممر المخفي |
| الممر المخفي | side | behind the shelf | platforming, lever, waiting room | spare key → الطريق للبيت |
| الطريق للبيت | arcade | garage | night race with a friendly rival ahead | emerald car colour |
| الوصفة الناقصة | side | kitchen + 3 places | find 3 recipe scraps, cook «أكل البيت» | lunchbox (a finale line), garden table |
| فيروز الضايعة | side | sanctuary → new meadow | track choice, climbing, calm-approach choice | sky collar, cat house piece |
| السما الثانية | side | observatory | three connect-the-stars constellations | star, telescope piece |
| روبو-سنوكي | side | workshop | circuit + programming a robot (3 levels) | Robo-Snooki piece |
| امتحان المحقق | challenge | academy | 6-question quiz on story clues | diploma |
| تحدي الإطلالة | challenge | wardrobe | three stylist briefs | emerald bow, gym outfit |
| أرشيف الرسائل | collection | memory corridor | collect 8 letters, open the archive | the ninth letter |
| حديقة على ذوقچ | collection | hidden garden | unlock and plant special pieces | journal page |

Missions are data (`src/game/data/missions.js`); their progress is derived from
story flags like the act objectives, and completion is recorded once
(`flag:mission:<id>`). A test proves every flag a mission waits for is set
somewhere.

## Progression

- Each act's objectives are derived from story flags (`src/game/data/chapters.js`)
  and shown in the HUD; the world map (`data/worlds.js`) opens new places as
  acts complete.
- **Collectibles** per location: hidden stars (need platforming), Ryan's letters,
  seed pouches (currency for the garden designer), maze petals.
- **Medals** (bronze/silver/gold) for every minigame and puzzle, replayable from
  the journal's challenges tab. Two harder variants unlock mid-story
  (Midnight Maze, Nurse Needle's Revenge).
- **Cosmetics** unlock through story, medals and achievements — never by waiting.
- **No** timers, streaks, energy, paywalls or punishment for taking a break.

## Fairness rules (enforced by tests)

- Every puzzle's answer is discoverable in-game (clues noted in `data/puzzles.js`).
- Every puzzle shows a one-line goal; hints go gentle → which thing matters →
  the exact action; then «شوفي الحل» highlights the moves; after the hints (or
  three mistakes) «تخطّي» continues the story with the same reward. A puzzle
  can always be closed and retried (and replayed from the journal).
- Minigames cannot be "lost": mistakes cost time or medals, never progress.
- Gold medals are proven achievable by test bots (chase, races, lantern lake).
- Every collectible is proven reachable with the real jump physics.

## Expansion

All content is data: add an act by adding a dialogue file, a scene file, puzzle
definitions, minigame entries, items, objectives and map nodes — see
`docs/ARCHITECTURE.md`.
