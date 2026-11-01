# Season 3 — decision flow (character memory)

Six decisions, each with a downstream effect the player sees. They are stored in Season 3's document as
`s3:dec:<key>`, where the flag's value is the choice. Every value must be made somewhere and read somewhere;
`tests/game/s3-season.test.js` ("every value of every decision is made somewhere and read somewhere") fails otherwise.
A condition on one value with an `else` branch counts as reading the decision's other values. Every row is
**[built]** and tested.

**Lifetime of a decision.** Decisions live in Season 3's document (`snooki-game:s3`) and last for the playthrough.
Starting over clears them together with every other season's progress. The restart policy is `all` (owner decision;
`TECHNICAL_ARCHITECTURE.md` §2.1). The old playthrough's document is kept aside and never read again. No decision
depends on Zefiro's spare key (deferred, `CREATIVE_PROPOSALS.md` C-11).

| Key | Made in | Values | Read in (what changes) |
|---|---|---|---|
| `sabri-reply` | 01, Sabri's question | `deny` («ريان مجرد صديق أخوية ماريوس…») · `laugh` · `confront` («منو گلك تعد زيارات الناس؟») | **01** Sabri's reply and his admission · **04** which chain of versions of her own sentence she untangles (`s3-whisper-<value>`) · **07** what Sabri asks in return for his copy · **08** what Ryan says about the sentence that reached him |
| `marius-honest` | 01, «شنو صاير؟» | `honest` · `deflect` | **01** Marius's reply · **03** how Marius brings the clip (to her first, worried / from the group, with an edge) · **07** what Marius asks in return · **08** his last line, from down the street |
| `v8-answer` | 02, after the blip | `wave` · `walk` · `text` | **02** the next beat (the headlights blink once / the window comes down, Snooky first / a reply that is only a cloud) · **08** she says it back to him |
| `ryan-trust` | 03, «لا تصدّكين كلشي ينقال» | `trust` · `see` | **03** Ryan's reply · **04** Ryan's line at the club · **08** Ryan's line |
| `lama-secret` | 04, Lama's call | `trust` · `keep` | **04** Lama's reply (both challenge her first theory) · **06** what Lama says at the wall · **07** how Lama offers her aunt's camera log |
| `road` | 07, the road she takes | `marius` · `lama` · `sabri` | **07** which place and puzzle yields `e-original` · **08** who makes sure the correction is posted |

**Not built in this release:** `jalal-way` (how Jalal is confronted). In the finale she answers his statements with
evidence, and Ryan names him only after that. The staging does not branch.

## Fairness of the branches (Mission 07)

No decision can lock essential evidence. All three roads are always offered. Earlier decisions change only what each
person says, and what they ask in return:

| Road | Place · puzzle | The offer reads |
|---|---|---|
| Marius (a friend's dashcam) | her room · `s3-dashcam` | `marius-honest` |
| Lama (her aunt's camera log) | the clinic · `s3-camlog` | `lama-secret` |
| Sabri (his first copy) | the car club · `s3-backup` | `sabri-reply` |

Every road yields the same `e-original`. `tests/game/s3-season.test.js` plays the whole season for every combination
of the five earlier decisions with every road (3 × 2 × 3 × 2 × 2 × 3 = 216), and each one completes all eight
missions.
