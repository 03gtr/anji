# Season 2: mission modules (the contract)

Missions 02–06 of the Living Story (M2, `s2-13` … `s2-17`) are each **one module file** in `src/game/data/m2/`. The M2 registries read the modules, so adding a mission means:
1. write its module;
2. list it in `src/game/data/m2/index.js`.

Mission 01 (`s2-12`) predates this and lives in the registries directly.

## What a module exports

```js
export default {
  id: 'm03',
  missions: [ … ],        // entries of MISSIONS_S2_M2 (pack PACK_S2, ids s2-1x)
  puzzles: { … },         // PUZZLES_S2_M2; every one is made strict by the registry (no hint/solution/skip)
  evidence: { … },        // EVIDENCE_S2_M2 (ids also in docs/season-2/graph.mjs)
  decisions: { … },       // DECISIONS_S2_M2: key → its values
  case: [ { mission, ids } ],
  journal: { … },         // JOURNAL_S2_M2 (shown through the mission's reward)
  dialogue: { … },        // keys 's2.<n>-…' (the s2 segment routes everything to Season 2's save)
  scenes: [ … ],          // new places (ids 's2-…'); a place on the map also needs its WORLDS entry
  patches: { [sceneId]: { actors, interact, dynamic, triggers, exits } },
};
```

## Rules (each is checked by tests)

### Isolation
- Every id has an `s2` segment: scene ids, flags (`s2:<n>-…`), evidence (`s2.ev.…`), decisions (`s2:dec:…`) and dialogue keys (`s2.…`).
- Nothing a module does may change the original campaign's save. The playthrough tests compare it byte for byte.

### Patches
- A patch extends a place that already exists, never replaces it.
- An actor or interactable whose id the place already has is merged into it. Its `cases` go before the place's own.
- So every added case, actor, drawing and interactable must be gated on its own mission (for example `flag:mission:s2-13`). Until then, the place behaves exactly as shipped (`tests/game/s2-m03.test.js`, "M1's lamphouse is exactly as shipped").

### No help with the story
- No `hints`, no `solutionText`, and nothing that shows or skips an answer.
- A wrong try gets the shared neutral lines (`STRICT_WRONG`).
- A puzzle needs at least 8 possible answers per stage and 20 per puzzle (`tests/game/s2-fairness.test.js`).
- A single pick never has only three options.

### No answer before it is earned
- The leak scanner reads the following, and the words that would give the answer away must not appear in any of them:
  - the puzzle's title, goal and intro;
  - the mission's summary and steps;
  - every line said before the puzzle opens.
- A mission step says what to do, never which statement or which piece of evidence.

### Decisions
- Every value of every decision must be read later by some condition (`dec:key=value`), in a scene or a dialogue (`tests/game/s2-m03.test.js`, "decisions are read again later").

### Acting, not telling
- Major character beats are staged with the engine's acting actions (`move`, `pose`, `jolt`, `puff`, `mood`, `face`, `camera`, `spawn`), not only dialogue.

### Physical interaction
- Use `hold:<thing>` (carry, drawn in her hand; a `lamp`/`lantern` id glows) and `dynamic` drawings.
- `front: true` draws over the people (for example darkness with light pools).

### Text
- Iraqi Arabic, in the voice of the existing dialogue.
- No private nicknames, and no wedding or real-world promises.

### Tests
- Each module gets `tests/game/s2-<nn>.test.js`, a playthrough from its own data covering every decision value.
- It also gets a real-browser test that plays the mission by touch at 320, 390 and WebKit 390.
