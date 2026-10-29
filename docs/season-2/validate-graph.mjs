// Validate the Season 2 design graph: node docs/season-2/validate-graph.mjs
import { EVIDENCE, HYPOTHESES, MISSIONS, OPTIONAL, MILESTONES, milestoneOf } from './graph.mjs';

const problems = [];
const all = [...MISSIONS, ...OPTIONAL];
const byId = new Map(all.map((m) => [m.id, m]));
const reqIds = (m) => m.requires.flatMap((r) => (typeof r === 'string' ? [r] : r.any));

// 1. references
for (const m of all) {
  for (const r of reqIds(m)) if (!byId.has(r)) problems.push(`${m.id} requires unknown mission ${r}`);
  for (const e of [...(m.needs || []), ...(m.needsAny?.of || []), ...m.yields]) if (!EVIDENCE[e]) problems.push(`${m.id} uses unknown evidence ${e}`);
  if (byId.get(m.id) !== m) problems.push(`duplicate mission id ${m.id}`);
}
for (const [h, def] of Object.entries(HYPOTHESES)) for (const e of [...def.supports, ...def.contradicts]) if (!EVIDENCE[e]) problems.push(`hypothesis ${h} uses unknown evidence ${e}`);

// 2. each evidence item is produced by exactly one mission, and only by a main mission
const producer = {};
for (const m of all) for (const e of m.yields) {
  if (producer[e]) problems.push(`evidence ${e} produced twice (${producer[e]}, ${m.id})`);
  producer[e] = m.id;
}
for (const e of Object.keys(EVIDENCE)) if (!producer[e]) problems.push(`evidence ${e} is never produced`);
for (const m of OPTIONAL) if (m.yields.length) problems.push(`optional ${m.id} yields evidence`);

// 3. reachability: simulate completing missions from a finished original game.
//    A mission can complete once its requirements are complete; "any n of" counts.
const done = new Set();
const order = [];
let progress = true;
const satisfied = (m) =>
  m.requires.every((r) => (typeof r === 'string' ? done.has(r) : r.any.filter((x) => done.has(x)).length >= r.n));
while (progress) {
  progress = false;
  for (const m of all) if (!done.has(m.id) && satisfied(m)) { done.add(m.id); order.push(m.id); progress = true; }
}
for (const m of all) if (!done.has(m.id)) problems.push(`${m.id} is unreachable (cycle or impossible prerequisite)`);

// 4. every evidence a mission needs is guaranteed produced by its prerequisites (transitively),
//    not merely by something that happened to be played first.
const ancestors = (id, seen = new Set()) => {
  const m = byId.get(id);
  for (const r of m.requires) {
    const list = typeof r === 'string' ? [r] : r.n >= r.any.length ? r.any : []; // "any n of" guarantees none in particular
    for (const x of list) if (!seen.has(x)) { seen.add(x); ancestors(x, seen); }
  }
  return seen;
};
for (const m of all) {
  const anc = ancestors(m.id);
  for (const e of m.needs || []) if (!anc.has(producer[e])) problems.push(`${m.id} needs ${e} from ${producer[e]}, which is not a guaranteed prerequisite`);
  if (m.needsAny) {
    // with "any n of the witnesses" the player has done n of them: n samples are guaranteed
    const groups = m.requires.filter((r) => typeof r !== 'string');
    const ok = groups.some((g) => g.n >= m.needsAny.n && m.needsAny.of.every((e) => g.any.includes(producer[e])));
    if (!ok) problems.push(`${m.id}: needsAny is not guaranteed by its prerequisites`);
  }
}

// 5. orphans: produced evidence that nothing uses
const used = new Set([
  ...all.flatMap((m) => [...(m.needs || []), ...(m.needsAny?.of || [])]),
  ...Object.values(HYPOTHESES).flatMap((h) => [...h.supports, ...h.contradicts]),
]);
for (const e of Object.keys(EVIDENCE)) if (!used.has(e) && e !== 'd-case') problems.push(`orphaned evidence ${e}`);

// 6. hypotheses are testable: support, and (except the kept one) a contradiction
for (const [h, def] of Object.entries(HYPOTHESES)) {
  if (!def.supports.length) problems.push(`hypothesis ${h} has no support`);
  if (h !== 'D' && !def.contradicts.length) problems.push(`hypothesis ${h} cannot be broken`);
}

// 7. milestones are closed and end coherently:
//    - nothing in a milestone needs a later milestone (missions or evidence);
//    - every main mission of a milestone leads to its terminal mission (no thread left hanging);
//    - after a milestone's terminal, every mission of that milestone and earlier is completable.
const rank = Object.fromEntries(MILESTONES.map((m, i) => [m.id, i]));
for (const m of all) {
  const r = rank[milestoneOf(m)];
  if (r == null) problems.push(`${m.id} has no milestone`);
  for (const q of reqIds(m)) if (rank[milestoneOf(byId.get(q))] > r) problems.push(`${m.id} (${milestoneOf(m)}) requires ${q} from a later milestone`);
  for (const e of [...(m.needs || []), ...(m.needsAny?.of || [])]) {
    const p = byId.get(producer[e]);
    if (p && rank[milestoneOf(p)] > r) problems.push(`${m.id} (${milestoneOf(m)}) needs ${e}, produced in a later milestone`);
  }
}
for (const ms of MILESTONES) {
  const into = ancestors(ms.terminal);
  for (const m of MISSIONS) if (milestoneOf(m) === ms.id && m.id !== ms.terminal && !into.has(m.id)) problems.push(`${ms.id}: ${m.id} does not lead to the terminal ${ms.terminal}`);
  const doneHere = new Set();
  let more = true;
  const inScope = all.filter((m) => rank[milestoneOf(m)] <= rank[ms.id]);
  while (more) {
    more = false;
    for (const m of inScope) if (!doneHere.has(m.id) && m.requires.every((q) => (typeof q === 'string' ? doneHere.has(q) : q.any.filter((x) => doneHere.has(x)).length >= q.n))) { doneHere.add(m.id); more = true; }
  }
  for (const m of inScope) if (!doneHere.has(m.id)) problems.push(`${ms.id} released alone: ${m.id} cannot be completed`);
}
const perMs = MILESTONES.map((ms) => {
  const main = MISSIONS.filter((m) => milestoneOf(m) === ms.id);
  const opt = OPTIONAL.filter((m) => milestoneOf(m) === ms.id);
  const sum = (l) => l.reduce((s, m) => [s[0] + m.min[0], s[1] + m.min[1]], [0, 0]).map((x) => (x / 60).toFixed(1)).join('–');
  return `${ms.id}: ${main.length} main (${sum(main)} h) + ${opt.length} optional (${sum(opt)} h), ends at ${ms.terminal}`;
});

// 8. order freedom report
const freeGroups = MISSIONS.filter((m) => MISSIONS.filter((o) => o.id !== m.id && JSON.stringify(o.requires) === JSON.stringify(m.requires)).length);
const mins = MISSIONS.reduce((s, m) => [s[0] + m.min[0], s[1] + m.min[1]], [0, 0]);
const omins = OPTIONAL.reduce((s, m) => [s[0] + m.min[0], s[1] + m.min[1]], [0, 0]);

console.log(`missions ${MISSIONS.length} main + ${OPTIONAL.length} optional; evidence ${Object.keys(EVIDENCE).length}; hypotheses ${Object.keys(HYPOTHESES).length}`);
console.log(`completion order found: ${order.length}/${all.length}`);
console.log(`missions sharing prerequisites (playable in any order): ${freeGroups.map((m) => m.id).join(' ')}`);
console.log(`designed active time: main ${(mins[0] / 60).toFixed(1)}–${(mins[1] / 60).toFixed(1)} h, optional ${(omins[0] / 60).toFixed(1)}–${(omins[1] / 60).toFixed(1)} h`);
console.log(`designed active time by milestone (ESTIMATES, not measured):\n  ${perMs.join('\n  ')}`);
console.log(problems.length ? `PROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}` : 'OK: no cycles, unreachable missions, impossible prerequisites, orphaned evidence, or milestone leaks');
process.exitCode = problems.length ? 1 : 0;
