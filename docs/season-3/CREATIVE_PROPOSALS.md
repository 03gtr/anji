# Season 3 — creative proposals

Each idea: narrative purpose · gameplay purpose · how it is built · what the player feels · risks · **status**
(`proposed` → `accepted` → `implemented` with its commit, or `rejected` with the reason). Nothing is marked implemented
until it is in the code and tested.

### C-01 · The «ر.» initial and the printer queue (Mission 01's office incident)
- **Narrative:** Sabri's "five visits" are built from two true things: Rabi' also signs «ر.», and a jammed printer
  printed Ryan's Wednesday report on Thursday with today's footer.
- **Gameplay:** a fair deduction with a trap (Tuesday's «تقرير» line is Rabi''s lab run, not Ryan) — P-01.
- **Build:** the existing strict `sort` rule; the records are evidence cards.
- **Feel:** "Sabri, you counted Rabi''s coffee." Laughing at the logic, not at a person.
- **Alternatives weighed:** two appointments with near timestamps (weaker: arithmetic, not people); a message
  delivered to the wrong desk (good, saved for Mission 04's chain); a false timeline from a wall clock (too abstract).
- **Risks:** none to canon (Rabi' is Anji's canon coworker; the habits are fiction).
- **Status:** accepted · Phase B.

### C-02 · One engine, heard and seen (the V8 model)
- **Narrative:** Zefiro "speaks" (Mission 02) and its voice is later evidence (Mission 03).
- **Gameplay:** the waveform puzzle is drawn from the same rpm curves that make the sound, so the puzzle is honest and
  fully solvable without hearing.
- **Build:** `core/engine-voice.js` (rpm curves → firing frequency and burble) feeding both `audio.voice` and the
  waveform view.
- **Feel:** "I can *see* the burble." Recognising a car by its rhythm.
- **Risks:** Web Audio differences across browsers; muted players must lose nothing (every clue is drawn).
- **Status:** accepted · Phase C.

### C-03 · Her own words, echoed back changed
- **Narrative:** the sentence she chose in Mission 01 is the one that travels and gets twisted; the player hears the
  consequence of her own line.
- **Gameplay:** P-03 — find the link where meaning changed, in *her* version.
- **Build:** three version chains in data, chosen by `sabri-reply`.
- **Feel:** "I said that — but not like that."
- **Risks:** must stay gentle; no version may be cruel.
- **Status:** accepted · Phase E.

### C-04 · Zefiro is the Camaro, in her colour
- **Narrative:** continuity with Season 1 (the garage, the night road, «حادثة الإطار»).
- **Gameplay:** the plate (never the colour) is the clue; Snooky's history with tyres pays off in Mission 05.
- **Build:** `world/zefiro.js` — layered procedural drawing (body, glass, wheels, headlights, tail lights, reflections),
  colour from `cosmetics.carColor`.
- **Feel:** "Zefiro, at last, properly."
- **Risks:** original art only — no manufacturer artwork or logo.
- **Status:** accepted · Phase C.

### C-05 · Reliability is a state; her wrong theories live on the board
- **Narrative:** the season's theme as an interface.
- **Gameplay:** she can pin a hypothesis that is wrong; it stays until evidence disproves it, and then shows it.
- **Build:** card state = f(base kind, conditions); hypotheses as her own cards.
- **Feel:** being wrong is part of investigating, and it is visible.
- **Risks:** clutter on phones — cards collapse into a list view at 320 px.
- **Status:** accepted · Phase D.

### C-06 · "When silence speaks" — the engine turned off
- **Narrative:** Ryan said everything with the engine in Mission 02; in the finale he turns it **off**.
- **Gameplay:** a listening moment (P-09) that cannot be failed: the street's sound layers fade as she names them.
- **Build:** the voice handle's fade; layered ambience beds.
- **Feel:** quiet as a payoff.
- **Risks:** players with sound off — each layer also has a visible cue.
- **Status:** accepted · Phase E.

### C-07 · Non-punishing observation on the street
- **Gameplay:** she notices details herself (P-07); none is flagged as important; skipped details can be found later.
- **Status:** accepted · Phase C.

### C-08 · What the player saw is evidence
- **Gameplay:** in P-01, «لمى ضحكت…» is a claim Sabri *witnessed* — the player saw Lama hide her smile in the
  opening, so the player's own observation is part of the deduction.
- **Status:** accepted · Phase B.

### C-09 · Marius makes the excuse true — and worse
- **Narrative:** he confirms the medical-report story (he drove Ryan there) and then asks the one question that
  sinks her: why did Ryan go back? (The honest answer — the missing signature — is in the records, so the puzzle
  answers Marius too.)
- **Status:** accepted · Phase B.

### C-10 · Sabri's "zip my lips"
- **Narrative:** a running gag: each time he promises silence (a zip gesture), the next scene shows where it leaked.
- **Status:** accepted · Phases B–E.

### C-11 · The spare key (optional secret)
- **Narrative:** Season 1 gave Anji Zefiro's spare key («للطريق للبيت»). If she still has it, Mission 08 has one extra
  quiet beat: she can give it back, or keep it.
- **Risks:** must never imply a promise; it is a callback, not a vow.
- **Status:** **deferred** — owner decision `later` (2026-11-01). Not implemented; kept here to review when the ending
  is designed. It is not a condition of any puzzle, mission or decision.

### C-12 · Canon reconciliation: Sabri at the clinic as a visitor
- **Narrative:** the canon says Sabri is Ryan's coworker; the brief places him at Anji's workplace. He is there for his
  own medical report — idle in the waiting area, reading the visitor log.
- **Status:** accepted · Phase B.

### Rejected
- **A racing minigame for the V8.** It would glorify street racing, which the season is *about* refuting.
- **A lie-detector meter.** A gimmick that replaces reasoning with a gauge.
- **Jalal as a villain with a monologue.** He is frightened, not evil; melodrama would cheapen the deduction.
