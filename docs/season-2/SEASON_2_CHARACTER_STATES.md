# Season 2 — Character States, Relationships and Branching

## 1. Principles

- State exists only when a later line or step reads it. There is no universal "love score".
- Decisions are **named and enumerated**: `s2:dec:<key>` = one of a fixed set of values, validated by a registry. They are never inferred from the last line shown.
- Choices change lines, the order of approaches, who helps, and the tone of the last talk. They never gate essential progress.
- Ryan's trust grows on **story beats**, never from Anji soothing or kissing him.

## 2. State dimensions (all small integers or enums, stored as flags)

| State | Values | Changed by | Read by |
|---|---|---|---|
| `s2:rel:trust` (Ryan's trust stage) | 0–3 | s2-11 (they compare notebooks openly), s2-16 (the reversal: he sees his theory break), s2-26 (the conversations) | jealousy reaction table (§3); final talk tone |
| `s2:rel:talk` (communication) | 0–3 | choices where Anji or Ryan *says* what they think instead of hiding it (s2-07, s2-11, s2-16, s2-20) | final conversation lines (s2-29); some banter |
| `s2:rel:rivalry` (playful rivalry) | 0–9 | duel wins, the notebook takeover, prank wins | banter variants; the rematch line |
| `s2:met:<who>` | true | first scene with each witness | greetings |

## 3. Social interactions and Ryan's reactions

**Input** (a dialogue action, `{ social: { from, cat } }`):

| Field | Values |
|---|---|
| `cat` | `greeting`, `professional`, `compliment`, `flirt`, `repeat` (`repeat` = a second flirt in the same scene) |
| Anji's reply (a choice) | `polite`, `subject` (change the subject), `accept`, `tease-ryan`, `challenge-ryan`, `boundary` |
| context | `trust` stage, `repeat count in this scene`, `scene tone` (`serious` or `light`) |

**Output:** one reaction from a fixed set: `none`, `focus` (back to work), `joke`, `pause` (a beat of awkward silence), `compete`, `cartoon` (steam puffs, the notebook), `apologize`.

**Reaction table.** It is deterministic. The pick inside a cell rotates through `game.nextLine`, and `none` is always allowed:

| cat \ trust | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| greeting | none | none | none | none |
| professional | focus | focus | focus | focus |
| compliment | none · joke · pause | none · joke | none · joke | none |
| flirt (light tone) | joke · compete · pause | joke · compete | joke | none · joke |
| flirt (serious tone) | pause | pause | none | none |
| repeat | cartoon · compete | cartoon · joke | joke · compete | joke |

**Then Anji's reply adjusts it:**
- `challenge-ryan` or `boundary` → Ryan may `apologize` next (at trust ≥ 1), and the callback «آني ما غرت» is unlocked once.
- `tease-ryan` → a `joke` from Ryan; it never escalates.
- `accept` or `polite` → no effect on trust. Accepting harmless attention is never punished.

**Invariants (unit tests):**
- greeting → `none`, in every context;
- professional → `focus`, in every context;
- no reaction is ever physical or threatening; the reaction set has no such entry;
- no reply option sets progress-blocking state;
- `kiss` or reassurance options exist only as optional extras, and choosing none has the same progress path.

**Callbacks.**
- The «آني ما غرت / ليش فاتح دفتر تحقيق؟ / هذا دفتر شغل / (Snooky barks) / حتى إنت لا تدخل بالموضوع!» set plays at most once per act.
- Each act has its own variant.
- The engine stores the last act it fired (`s2:cb:jealous`).

## 4. Decisions registry

| Key | Values | Where | Effect |
|---|---|---|---|
| `lead` | `ryan`, `anji` | s2-03 | who chairs the board in later scenes (lines only) |
| `rabi-reply` | `polite`, `subject`, `tease-ryan` | s2-05 | the jealousy beat; one later line |
| `sabri` | `press`, `let-be` | s2-07 | whether Sabri hints at the surprise; `talk` +1 if she lets Ryan tell it himself later |
| `jojo-why` | `ask`, `accept` | s2-08 | one extra line from Jojo; no judgement either way |
| `sister-refusal` | `respect`, `push` | s2-09 | `push` gets a polite no and a cooler line in s2-23; `respect` gets a warmer one |
| `jealous-talk` | `reassure`, `tease`, `challenge`, `boundary`, `change-subject` | s2-11 | trust and talk changes per the table; every option continues |
| `accuse` | `wait`, `rabi`, `lama`, `sabri`, `jojo`, `sister`, `ryan` | s2-15 | an early accusation → hurt reaction, `o-apology`, tone changes; `wait` → Ryan: «زين سويتي.» |
| `ryan-secret` | `respect`, `push` | s2-16 | `push`: Ryan stammers and still doesn't tell (no lie); `respect`: `talk` +1 |
| `husky-stash` | `scold`, `laugh`, `reward` | s2-19 | her mood lines for the rest of the season |
| `snooky-ask` | `ask-ryan`, `wait` | s2-20 | who starts the talk; `talk` +1 for either open path |
| `share` | `together`, `one-by-one`, `let-rest` | s2-26 | how s2-29 opens; who comes and what they say |
| `sister-stance` | `cooperate`, `disagree`, `boundary` («كان لازم تگوليلي بوجهي»), `unresolved` | s2-27 (before the card) | how the scene and the final evening read; **no value is "right"**, none is scored, and every value reaches s2-29 |
| `sister-card` | `read-together`, `return-unread`, `later` | s2-27 | **left open by design.** Each is a complete, respected outcome; `later` puts the card in the bag |
| `jojo-sign` | `ask`, `leave` | s2-28 | if asked he decides himself: he signs the corrected entry, the one he saw (fictional) |
| `wish` | three wish cards | s2-29 | the final page text |
| `affection` | `none`, `hand`, `kiss` (optional, never prompted twice) | s2-29 | one line; no progress effect |

## 5. Dialogue branch spec (format used for every important branch)

```
branch: s2-11 jealous-talk
entry:  s2:board ≥ 1 and mission s2-05 complete and not s2:dec:jealous-talk
options (Anji): reassure · tease · challenge «ليش فاتح دفتر؟» · boundary «هالشي ما يحتاج تحقيق.» · change-subject
state:  s2:dec:jealous-talk = <option>; trust/talk per table
result: 2–4 lines per option, then the shared board scene
re-entry: choice is never offered again; lines that reference it read the stored value
persists: yes (flag)
reconverges: yes, at the board
tests: every option leads to board stage 2; no option changes required evidence; reload after the choice and before the reply → reply plays once
```

## 6. Companion state

The pure rule `dogsIn(scene, game)` is unchanged. It is applied as follows:

| Scene | Snooky | Husky |
|---|---|---|
| Ryan present (tree, table, case room, training hall) | beside Ryan | follows Anji (if met) |
| Anji alone (clinic, lamp house, the house) | away with Ryan | follows Anji (if met) |
| Act IV `together: true` (fog path, stash, loft) | follows Ryan | follows Anji, and scouts |
| `duo` puzzle | controlled actor (Ryan's half) | controlled actor (Anji's half) |

**Invariants (tests):**
- Snooky never leads with Anji alone;
- each dog has exactly one leader per scene;
- the husky name always comes from `{husky}`;
- no Season 2 line names her literally.

**New companion lines** (`HUSKY_TAPS`, `HUSKY_AMBIENT` and Snooky's set are extended):
- each new pool keeps the existing rules: rotation, no repeat on consecutive taps, on screen while speaking, and bubbles that wrap;
- Season 2 adds case-aware lines gated by flags (for example, after the stash: «شنو؟ الورقة چانت ريحتها حلوة…»).
