# Deployed client: frozen copy

`save.js` and `game.js` are byte-for-byte copies of `src/game/core/save.js` and `src/game/core/game.js` at `main` `ca13094`.

These two files have not changed since `506780f` (V3). Every game build ever deployed, from the first release `e771143` to `3ceacb5` (PR #13, 2026-10-29), runs this exact save code. So they stand in for "an older deployed tab" in `tests/game/s2-compat-baseline.test.js`.

Never edit them. The test checks their SHA-256, with line endings normalised to LF.
