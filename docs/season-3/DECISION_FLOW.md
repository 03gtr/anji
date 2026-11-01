# Season 3 — decision flow (character memory)

Seven decisions, each with a visible downstream effect. Stored in Season 3's document as `s3:dec:<key>` (the flag's
value is the choice). Every value must be made somewhere and read somewhere — `tests/game/s3-decisions.test.js`
(the Season 2 audit extended) fails otherwise. Status per row: **[built]** only when implemented and tested.

| Key | Made in | Values | Read in (what changes) |
|---|---|---|---|
| `sabri-reply` | 01, Sabri's question | `deny` (the scripted «ريان مجرد صديق أخوية ماريوس…») · `laugh` (laughs it off) · `confront` («منو گلك تعد زيارات الناس؟») | **01** Sabri's next line and his "zip my lips" beat [slice] · **04** the version of her sentence that travels (P-03): `deny` → «أنجي گالت ريان مو أكثر من صديق أخوها»; `laugh` → «أنجي ضحكت… يعني صدگ، مخطوبين بالسر»; `confront` → «أنجي زعلت… لعد أكو شي» · **08** what Ryan says he heard |
| `marius-honest` | 01, «شنو صاير؟» | `honest` · `deflect` | **01** Marius's reply [slice] · **03** how Marius brings the clip (to her first, worried / already teased by the group) · **07** whether Marius volunteers the dashcam road unasked |
| `v8-answer` | 02, after the blip | `wave` · `go` · `text` | **02** the next beat (Ryan's smile from the car / he gets out / her phone lights his face) · **08** the finale's staging mirrors it |
| `ryan-trust` | 03, «لا تصدّكين كلشي ينقال» | `trust` · `see-first` | **04** Ryan joins the garage visit (trust) or she goes with Lama (see-first) · **08** Ryan's first line |
| `lama-secret` | 04, after the receipt | `share` · `keep` | **06** Lama's key to the archive comes with her help (share) or only the key (keep) · **07** whether the Lama road is offered by Lama or must be asked |
| `jalal-way` | 06, when the proof holds | `ryan` (let Ryan speak to him) · `face` (she faces him) · `group` (put the proof in the group chat) | **08** how Jalal admits it, and who he apologises to |
| `road` | 07, the road taken first | `marius` · `lama` · `sabri` | **07** which piece she holds first · **08** who stands with her at the end |

## Fairness of the branches (Mission 07)

No decision can lock essential evidence. Every road yields `e-original`; what changes is who offers it and in what
order:

| Road | Offered unasked when | Otherwise |
|---|---|---|
| Marius (dashcam) | `marius-honest = honest` | she asks him (one extra conversation) |
| Lama (camera log) | `lama-secret = share` | she asks Lama (Lama challenges her first) |
| Sabri (who sent it to him) | `sabri-reply ≠ confront` (he wants to make up) | she confronts him again; he admits it sulkily |

All three roads are always reachable; `tests/game/s3-roads.test.js` will enumerate every combination of the earlier
decisions (3 × 2 × 3 × 2 × 2 × 3 = 216) and play each road to `e-original`.
