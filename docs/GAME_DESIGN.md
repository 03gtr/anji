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
| **Anji** | Playable hero | Long wavy auburn hair with golden highlights, burgundy bow, warm brown eyes, red lips; black jacket over red-black-white plaid (default). 10 expressions, 6 outfits, 5 bows. Smart, sarcastic, kind. Loves blue roses, cars, animals, the gym and healthy food. |
| **Snooki** | Companion & comic engine | Fluffy white Siberian husky, amber eyes with dark rims, pink inner ears, navy collar with a blue paw tag. 9 portrait expressions, 10 poses, 6 hats, 4 collars. "Security consultant with fur." Terrible at keeping secrets; secretly following Ryan's instructions. |
| **Ryan** | The missing creator | Seen from behind or as a shadow: dark hair, charcoal hoodie, black backpack, jeans. Present through notes, recordings, warm tea and the Creator's Mark. Fully revealed only in Act VIII. |
| Nurse Needle | Running gag | A cheerful cartoon syringe with a rubber safety ball, determined to give Snooki his overdue vaccine. Harmless. |
| The Gate | Guardian | Speaks in formal Arabic, very dramatic. |
| Doctor Hoot | Astronomer owl | Pedantic, sleepy, secretly soft. |
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
8. **Act VIII** — Ryan under the blue rose tree. Choices shape the
   conversation; collected stars and letters add lines. A promise, credits, and
   then the garden is hers to plant.

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
- Hints go from gentle to explicit; a puzzle can always be closed and retried.
- Minigames cannot be "lost": mistakes cost time or medals, never progress.
- Gold medals are proven achievable by test bots (chase, races, lantern lake).
- Every collectible is proven reachable with the real jump physics.

## Expansion

All content is data: add an act by adding a dialogue file, a scene file, puzzle
definitions, minigame entries, items, objectives and map nodes — see
`docs/ARCHITECTURE.md`.
