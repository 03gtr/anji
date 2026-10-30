# Season 2 — Story Bible

**«الحديقة السرية 2 — ملف الدائرة المغلقة: قضية الحديقة التي لا تنام»**
**Secret Garden Season 2 — The Closed Circle Case: The Garden That Never Sleeps**

Status: **design for review (Gate C)**. Nothing here is implemented.
Branch: `feature/season-2`, cut from `main` at `ca13094`.

## 1. Canon vs. fiction

Every Season 2 event is **fiction written for the game**, unless it is listed under "Canon" below.

**Canon** (owner-established; preserved exactly):

| Fact | How Season 2 treats it |
|---|---|
| The first meeting by the village entrance with two tree-covered roads, two cars. She asked him to stop with his back to her because she wanted a hug and felt shy. | Never re-staged or retold. Act VI only *visits the place* (Story Pack 01's «طريق الذكريات»): camera behind them, no faces, no dialogue. The published embrace shot is not replayed or altered. |
| Ryan visited her clinic unannounced with sweets and flowers. | Callback only. Anji says the surprise "reminds her of that day at the clinic". Every new detail (a receipt, a shop) is fiction and labelled so in the memory archive. |
| They hope to marry someday. | Hope only. No wedding, date, vows, proposal finale or marriage flag. This is tested (§7). |
| Snooky is Ryan's dog. Her white Siberian husky (female, icy-blue eyes) is Anji's; the player names her. | `dogsIn()` ownership rules unchanged (§6). The name always comes from `{husky}`. |
| Rabi' and Lama are Anji's coworkers. Sabri is Ryan's friend and coworker, who once told Anji about Ryan's secret workplace visits. Uncle Jojo, white-haired, declined to vouch for Ryan when her father asked. Anji's sister. | Only these facts are canon. Everything they do in Season 2 is fiction (§3). |

**Fiction** includes:
- «ليلة الفوانيس» (the Lantern Night);
- the Garden Register;
- every witness statement, motive and object;
- Ryan's surprise;
- the sister's wish card and note;
- the husky's mischief.

In-game, invented memories are marked «من خيال الحكاية». The few canon callbacks are marked «ذكرى حقيقية» (§8).

## 2. Premise

After the original ending, Anji has an idea: **«ليلة الفوانيس»**.
- She invites her circle to the garden for one evening.
- Each guest hangs a lantern on **شجرة الفوانيس** with a folded wish card inside.
- The garden's night register, kept by Uncle Jojo as the garden's volunteer night-keeper, records who came and when. This register is «السجل اللي ما ينام».

The next morning (Day 1):
- **The register is torn.** The page for that night has been torn out.
- **A copy disagrees.** Lama made a copy for the clinic noticeboard. It lists **eight** guests, but the tree has **seven** lanterns.
- **A wish is blank.** One wish card is empty.
- **Ryan's card is misplaced.** It is inside Rabi's lantern.
- **A note is unsigned.** It turns up under Ryan's coffee cup: «إذا أكو سر، أنجي تستاهل تعرفه».
- **A sentence is going round.** «ريان دا يخبي شي عن أنجي».

The guests are a **closed circle**: only these people (and two dogs) were in the garden that night.

## 3. What really happened (the solution; never shown before it is earned)

There is no villain. Every item has an ordinary cause, and two acts were deliberate and kind:

| Link | Who | What they did | Deliberate? | Proven by |
|---|---|---|---|---|
| 1 | Ryan | Planned a surprise. His riddle lantern leads to roses and sweets. He went to the clinic quarter to arrange it and asked Sabri to keep quiet. His own lantern stayed unlit in the loft, waiting. | **yes, kind** (a secret, not a lie) | receipt, wrapper, the eighth lantern |
| 2 | Sabri | Told Lama «ريان راح للعيادة بالسر». Every word was true. | no; accurate words in a misleading context | his exact wording; the three versions |
| 3 | Lama | Heard «ريان يخبي شي» and told Anji's sister, worried for Anji. Her copy counted Snooky as a guest («ضيف رسمي») and used the register's times. | no; sincere and incomplete | copy vs tree; her testimony |
| 4 | Anji's sister | Wrote a sincere wish for Anji. Embarrassed, she took it back and left the card blank. After hearing the rumour she wrote the unsigned note to protect Anji, clumsily, and left it at Ryan's table. | **yes, protective**: a real choice with real consequences | imprint on the blank card; handwriting elimination |
| 5 | Rabi' | Saw Ryan's card fallen by an unlit lantern and put it in the nearest lit one, his own, "so it would not get lost". He also complimented Anji's lantern. | no; helpful, wrong lantern | wax; his testimony |
| 6 | Uncle Jojo | Logged times on the garden clock, which was an hour behind after the lamp change. He was away fetching lamp oil at "nine". He would not sign the witness line for that hour: «ما أشهد على شي ما شفته بعيني». | his choice, stated, not explained further | clock drift; oil route; his statement |
| 7 | The husky | The torn page had Ryan's sweets wrapper tucked into it. She tore it out and hid it in her stash, with tooth marks. | mischief | the page, the wrapper, her trail |
| 8 | Snooky | Knew where Ryan's surprise was all along. He would not lead anyone there until Ryan agreed. | loyalty | his trail in Act IV |

**One thing stays open by Anji's choice: what the sister's wish said.** Anji decides whether to read it (§5, Act V).

## 4. The four hypotheses (the case room)

| | Hypothesis | Looks right because | Breaks on | Ends as |
|---|---|---|---|---|
| A | «واحد خرّب الليلة عن قصد» | torn page, blank card, moved card, unsigned note | wax (moved to a *lit* lantern), oil route, corrected time, tooth marks | **broken** |
| B | «ريان يخبي شي يأذي أنجي» | the whisper, Lama, Sabri's true words | receipt, wrapper, the eighth lantern | **broken**: the secret is real, the conclusion was wrong |
| C | «الساعة غلطت الكل» | clock drift, copy times, corrected time | it cannot explain the note or the blank card | **partly true**, folded into D |
| D | «الدائرة المغلقة» | rumour chain, corrected timeline, page, imprint, eighth lantern | — | **kept**, with one item left unresolved by choice |

Teaching line, used sparingly:
- «عندي دليل» — I have evidence;
- «عندي نظرية» — I have a theory;
- «أعرف شنو صار» — I know what happened.

## 5. Structure (six acts, thirty narrative days)

A "day" is a chapter label (اليوم ٧ من ٣٠). It is **never** read from the device clock, and several days can be played in one sitting.

| Act | Days | Purpose | Key turn |
|---|---|---|---|
| I «السجل الناقص» | 1–4 | Return, the torn register, first comparison, Ryan's official notebook, first board visit | the note under the coffee cup |
| II «خمس زوايا» | 5–12 | Five witnesses in any order, each with a new clue type, plus a handwriting elimination and comparing notebooks | the note is not in three of the hands |
| III «الخيوط الكاذبة» (False Threads; owner-approved name, distinct from the Deep Garden’s «حديقة الآثار الكاذبة») | 13–17 | Three false trails (wax, time, words); the accusation choice; **midpoint reversal**; fact, claim or opinion | A and B both crack |
| IV «الكلاب تعرف الطريق» | 18–21 | Fog separates the group; the husky's route and Snooky's route; combine to reach the lantern loft | the eighth lantern |
| V «الدائرة المغلقة» | 22–28 | Reopen old evidence; rumour chain; true timeline; full board; conversations; the sister; Jojo's entry | D holds |
| VI «الحديقة اللي ما تنام» | 29–30 | Lantern Night again, shaped by her choices; Ryan's riddle; an open future | the register's new page, in Anji's hand |

## 6. Cast rules

### Anji
She is the protagonist and decision-maker.
- She starts the Lantern Night, the investigation, the pranks and the outings.
- She solves the decisive steps: the imprint, the rumour chain and the final board are hers.
- She can disagree with Ryan, tease him, refuse to reassure him, and change her mind.
- She is never a reward and never responsible for managing Ryan's moods.

### Ryan
He is a partner, investigator and occasional chaos.
- His comic set piece is a «دفتر تحقيق رسمي» with stamps. Its first exhibit was under his own coffee cup.
- He is competitive in duels, self-deprecating, loyal through actions, and sometimes stubborn.
- He keeps one real secret (the surprise) and handles it awkwardly.
- He is sometimes jealous, and contextually so (§ Character States).
- He admits mistakes, and his trust grows on story beats, not on how much Anji soothes him.

### Snooky (Ryan's dog)
- **When he appears:** he stays beside Ryan wherever Ryan is, and he is absent when Anji is alone.
- **Temperament:** loyal, patient, watchful and quietly stubborn.
- **What he notices:** things with a clear sensory cue, such as Ryan's hand cream, the sweets, and a familiar step.
- **What he refuses:** implausible requests, for example «لا. هذا ورد العم جوجو.»
- **Ryan's secret:** he guards it until Ryan nods.

### The husky (Anji's dog; the name is the player's)
- **Temperament:** curious, clever, playful and mischievous, and perceptive about routes, scents and sounds.
- **Her links in the case:** she stole the page, and her scouting opens the alternate route in Act IV.
- **Her lines:** she can interrupt a serious scene with a plausible, funny act, such as running off with an evidence card mid-speech, then returning it.
- **What she is not:** a reskinned Snooky. Her existing tap and ambient lines (`HUSKY_TAPS`, `HUSKY_AMBIENT`) are extended, not replaced.

### Rabi' (fictional development)
- **Who he is:** a warm, slightly formal colleague who is helpful to a fault.
- **In the case:** he offers one friendly compliment, and possibly a second, more playful one, which is the jealousy test. His role in the mystery comes only from the wax evidence.
- **Not used:** his private nickname (on the owner’s private list, never written in this repository), unless the owner asks. His height, looks and coat are never jokes.

### Lama (fictional development)
- **Who she is:** quick, sociable and loyal to Anji. She counts things and writes everything down, and is cheerful about her mistakes («سنوكي ضيف رسمي، شبيكم؟»).
- **What she knows:** what she heard, not what was meant.
- **Not invented:** no secret motives and no romance.

### Sabri (fictional development)
- **Who he is:** Ryan's friend: easy-going, literal, and the only one who quotes exactly.
- **In the case:** he passed on accurate words that someone else misunderstood. He is not a villain. He is a little embarrassed that he talks too much, a callback to the canon workplace-visits detail, told kindly.

### Uncle Jojo (fictional development; sensitive)
- **Who he is:** an older white-haired night-keeper who is precise, quiet and dryly funny.
- **The witness line:** his refusal to sign it is a principle he states and does not explain beyond «ما أشهد على شي ما شفته».
- **What the game avoids:** it does not claim why the real person declined to vouch. Owner decision (Gate C): he may decline to testify about what he did not see; the refusal never implies guilt, malice or proof, and the story offers no reason beyond his own words.
- **His character:** never cartoonish or malicious.

### Anji's sister (fictional development; sensitive)
- **No labels:** she has no nickname or label, and the private nickname is never used.
- **Her own life:** she has motives and agency, including a playful rivalry with Anji (she proposes a quiz duel and plays to win). She has a perspective of her own: she worries about Anji and doesn't know how to say it.
- **Her choices:** she made one real choice, the unsigned note, and owns it when asked. She can decline a question without being guilty for it.
- **What the story doesn't do:** it never asks Anji to hate or to forgive her. Anji chooses the tone, and every choice is respected.
- **Owner safeguards (Gate C):**
  - Her card and note are **fiction** and never presented as real events or motives.
  - Anji may interpret the evidence her own way. She may cooperate, disagree, set a boundary, or leave things unresolved (decision `sister-stance`).
  - Forgiveness and hostility are never forced, scored or required.

## 7. Hard limits (each is a test, see the Test Plan)

- No wedding, proposal, vows, marriage flag or marriage date.
- No violence as a joke: no choking, threats or coercion. Jealousy is cartoon steam and notebooks, never control.
- A greeting or a professional conversation never triggers jealousy.
- Refusing a kiss or reassurance never blocks progress and is never punished.
- No real-world contact, messaging, tracking or network features. The CSP stays `connect-src 'none'`.
- Private art and the private finale drawing stay out of every public build (the existing audit).

## 8. Dialogue style

- Iraqi Arabic with گ and چ, as the published game does: short lines and natural pauses. A scene has room to breathe, and not every line is a joke.
- Sample, the jealousy callback, used at most once per act:
  - Ryan: «آني ما غرت.»
  - Anji: «زين، ليش فاتح دفتر تحقيق؟»
  - Ryan: «هذا دفتر شغل.»
  - Snooky barks.
  - Ryan: «حتى إنت لا تدخل بالموضوع!»
- Sample, Anji's agency:
  - Ryan: «ربيع گال فانوسچ حلو… وبعدين؟»
  - Anji: «وبعدين ولا شي. وإنت ليش ماسك الدفتر بالمقلوب؟»

## 9. Locations

| Place | New or reused | Used in |
|---|---|---|
| «الأرشيف» (Story Pack 02 archives) | reused, with new props | I, II, III, V |
| «شجرة الفوانيس» | **new** (garden region) | I, III, VI |
| «غرفة الدائرة» (Room of the Circle, owner-approved; distinct from the Deep Garden’s «غرفة الفرضيات الأربع») | **new**, off the archive | every act |
| «بيت الفانوس» (Jojo's lamp house, garden clock) | **new** | II, III, V |
| «عيادة الورد» (Story Pack 01 clinic) | reused | II (Rabi', Lama) |
| «صالة التمرين» (Team Us training hall) | reused | II (Sabri) |
| the house | reused | II, V (the sister) |
| «ممر الضباب», «مخبأ الهاسكي», «علّية الفوانيس» | **new** | IV |
| «طريق الذكريات» (Story Pack 01) | reused, visited not replayed | VI |

New places reuse painter themes and code-drawn props (as the Deep Garden did). No new image files are required. New cast portraits and sprites are code-drawn SVG: **original, clearly fictional designs** (owner decision), respectful, with no appearance-based jokes. The game never claims they depict the real people. Uncle Jojo’s white hair is the only real detail used.
