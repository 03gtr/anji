# Season 2 — decision audit

Generated from the game data by `tests/game/s2-decisions.test.js` (run it with `S2_DECISIONS_DOC=1` to rewrite
this file); the same test fails if any value cannot be chosen or is never read. "Made at": where an effect sets
the value (a dialogue choice, a scene action). "Read at": every condition that tests it. Each read is a change
the player meets later (a line, a person who comes or not, a route, a puzzle's start); the per-mission tests
play both values through (tests/game/s2-m0*.test.js, tests/game/s2-living.test.js) and
tests/game/s2-campaign.test.js plays Missions 01–06 in one save, each decision both ways.

| Decision | Value | Made at | Read at |
|---|---|---|---|
| **lead** | `ryan` | dialogue s2.ryan-whisper | dialogue s2.17-stamp |
|  | `anji` | dialogue s2.ryan-whisper | dialogue s2.17-stamp |
| **tree-tease** | `yes` | dialogue s2.lantern-6 | dialogue s2.16-surprise |
|  | `no` | dialogue s2.lantern-6 | dialogue s2.16-surprise |
| **rabi-reply** | `polite` | dialogue s2.rabi-1 | progression/social.js (Ryan's reaction) |
|  | `subject` | dialogue s2.rabi-1 | progression/social.js (Ryan's reaction) |
|  | `tease-ryan` | dialogue s2.rabi-1 | progression/social.js (Ryan's reaction) |
| **sabri** | `press` | dialogue s2.receipt | dialogue s2.12-sabri-guard |
|  | `let-be` | dialogue s2.receipt | dialogue s2.12-sabri-guard |
| **jojo-why** | `ask` | dialogue s2.jojo-1 | dialogue s2.14-jojo-open |
|  | `accept` | dialogue s2.jojo-1 | dialogue s2.14-jojo-open |
| **sister-refusal** | `respect` | dialogue s2.sister-talk | dialogue s2.15-shed-faced<br>dialogue s2.15-sister-open |
|  | `push` | dialogue s2.sister-talk | dialogue s2.15-shed-faced<br>dialogue s2.15-sister-open<br>scene s2-home |
| **jealous-talk** | `reassure` | dialogue s2.11-talk | dialogue s2.17-rabi |
|  | `tease` | dialogue s2.11-talk | dialogue s2.17-rabi |
|  | `challenge` | dialogue s2.11-talk | dialogue s2.17-rabi |
|  | `boundary` | dialogue s2.11-talk | dialogue s2.17-rabi |
|  | `subject` | dialogue s2.11-talk | dialogue s2.17-rabi |
| **office-cover** | `cover` | dialogue s2.12-cover-choice | dialogue s2.12-lama-chat<br>dialogue s2.12-ryan-arrives<br>dialogue s2.12-sabri-chat<br>dialogue s2.13-archive-enter<br>dialogue s2.15-lama-sorry<br>dialogue s2.16-lama-photo<br>dialogue s2.16-sabri<br>dialogue s2.17-sabri<br>dialogue s2.17-talk-sabri |
|  | `truth` | dialogue s2.12-cover-choice | dialogue s2.12-ryan-arrives<br>dialogue s2.12-sabri-chat<br>dialogue s2.13-archive-enter<br>dialogue s2.15-lama-sorry<br>dialogue s2.16-lama-photo<br>dialogue s2.16-sabri<br>dialogue s2.17-sabri<br>puzzle s2-shadows |
| **stash** | `return` | dialogue s2.13-stash-choice | dialogue s2.13-ryan<br>dialogue s2.13-stash-again<br>dialogue s2.17-husky<br>scene s2-shed |
|  | `keep` | dialogue s2.13-stash-choice | dialogue s2.13-ryan<br>dialogue s2.13-stash-again<br>dialogue s2.17-husky<br>scene s2-shed |
| **jojo-confront** | `gentle` | dialogue s2.14-truth | dialogue s2.14-jojo-again<br>dialogue s2.17-match |
|  | `blunt` | dialogue s2.14-truth | dialogue s2.14-jojo-again<br>dialogue s2.16-enter<br>dialogue s2.17-match |
| **sister-wish** | `read` | dialogue s2.15-dusk-card | dialogue s2.15-sister-again<br>dialogue s2.17-sister<br>scene s2-dusk |
|  | `leave` | dialogue s2.15-dusk-card | dialogue s2.15-sister-again<br>dialogue s2.17-sister<br>scene s2-dusk |
