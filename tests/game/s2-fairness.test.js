/**
 * Season 2 complete release: every story puzzle is fair and cannot be tapped through.
 *
 *  - guess space: for every stage of every Season 2 puzzle, the number of different answers she could
 *    submit (from what is on screen) is at least GUESS_MIN, and for the whole puzzle at least WHOLE_MIN (a blind
 *    guess succeeds less than 5% of the time) — and a wrong answer says nothing that narrows the rest (tests/game/s2-no-help.test.js);
 *    the numbers are printed, so the release report quotes measured values, not estimates;
 *  - no single-pick question with three options (the old "which of these three" guesses are gone);
 *  - no answer anywhere she can read BEFORE the puzzle: its title, goal and intro, the mission's
 *    summary and steps, and every line said before it in the scene that opens it.
 */
import { describe, it, expect } from 'vitest';
import { PUZZLES_S2 } from '../../src/game/data/puzzles-s2.js';
import { PUZZLES_S2_M2 } from '../../src/game/data/puzzles-s2-m2.js';
import { MISSIONS_S2 } from '../../src/game/data/missions-s2.js';
import { MISSIONS_S2_M2 } from '../../src/game/data/missions-s2-m2.js';
import { S2_SCENES } from '../../src/game/data/scenes/s2.js';
import { S2_M2_SCENES } from '../../src/game/data/scenes/s2-m2.js';
import { DIALOGUE } from '../../src/game/data/dialogue/index.js';
import { resolveConfig } from '../../src/game/puzzles/host.js';
import { shadowGuesses } from '../../src/game/puzzles/rules-shadows.js';

const ALL = { ...PUZZLES_S2, ...PUZZLES_S2_M2 };
const GUESS_MIN = 8; // per stage
const WHOLE_MIN = 20; // per puzzle: a blind guess succeeds less than 5% of the time (C1 design, §6)
const hasAll = { has: () => true, flag: () => true, hasItem: () => true, seen: () => true, record: () => null, countGroup: () => 99 };
const choose = (n, k) => (k > n ? 0 : k === 0 ? 1 : (choose(n - 1, k - 1) * n) / k);
const perms = (n, k) => (k === 0 ? 1 : n * perms(n - 1, k - 1));

/** Different answers a blind guesser could submit, per stage (the size of what is on screen ÷ the number of right ones). */
function guessSpace(def) {
  const c = resolveConfig(def.config, hasAll);
  switch (def.type) {
    case 'contradict':
      return c.stages.map((s) => (s.claims.length * c.evidence.length + 1) / [].concat(s.answer.evidence).length);
    case 'choice':
      return [c.options.length];
    case 'lock':
      return [c.symbols.length ** c.answer.length];
    case 'deduction': {
      const need = c.need || 2;
      return [(c.suspects.length * choose(c.evidence.length, need)) / choose(c.answer.evidence.length, need)];
    }
    case 'sort':
      return c.stages.map((s) =>
        s.kind === 'sort'
          ? s.bins.length ** s.cards.length / s.cards.reduce((n, card) => n * card.accepts.length, 1)
          : s.answers
            ? 2 ** s.options.length - 1
            : s.options.length,
      );
    case 'rubbing':
      return [c.answers ? 2 ** c.options.length - 1 : c.options.length];
    case 'arrange':
      return [perms(c.pieces.length, c.slots.length)];
    case 'clock':
      return [(12 * 60) / c.step / (2 * (c.tolerance || 0) / c.step + 1)];
    case 'logicgrid':
      return [c.cols.reduce((n, col) => n * col.options.length ** c.rows.length, 1)];
    case 'testimony':
      // per version: any statement × any piece of Season 2 evidence she may hold (at least the six she has by then)
      return def.versions.map((v) => v.beats.length * 6);
    case 'shadows':
      // lanterns on hooks (or left in the basket), with every help she can have (remembered lanterns, the hooks map)
      return [shadowGuesses(c)];
    default:
      throw new Error(`no guess space for ${def.type}`);
  }
}

describe('Season 2 puzzles cannot be tapped through', () => {
  const report = {};
  for (const [id, def] of Object.entries(ALL)) {
    it(`${id} (${def.type}): at least ${GUESS_MIN} possible answers per stage and ${WHOLE_MIN} for the puzzle`, () => {
      const space = guessSpace(def);
      report[id] = space.map((n) => Math.round(n));
      for (const n of space) expect(n, `${id}: ${space}`).toBeGreaterThanOrEqual(GUESS_MIN);
      expect(space.reduce((a, b) => a * b, 1), `${id}: whole`).toBeGreaterThanOrEqual(WHOLE_MIN);
    });
  }
  it('no single-pick question offers only three options', () => {
    for (const [id, def] of Object.entries(ALL)) {
      const c = resolveConfig(def.config, hasAll);
      if (def.type === 'choice') expect(c.options.length, id).toBeGreaterThan(3);
      if (def.type === 'rubbing' && !c.answers) expect(c.options.length, id).toBeGreaterThan(3);
      for (const s of c.stages || []) if (s.kind === 'pick' && !s.answers) expect(s.options.length, id).toBeGreaterThan(3);
    }
    console.info('[s2 guess space per stage]', JSON.stringify(report));
  });
});

/* ── what she reads before each puzzle ── */
const lines = (key) => {
  const out = [];
  const walk = (nodes) => {
    for (const n of [].concat(nodes || [])) {
      if (n.t) out.push(n.t);
      for (const o of n.choice || []) {
        out.push(o.t);
        walk(o.then);
      }
      walk(n.then);
      walk(n.else);
    }
  };
  walk(DIALOGUE[key]);
  return out;
};
/** Every dialogue key said in an action list before it opens `id` (recursing into earlier branches). */
function saidBefore(id) {
  const keys = [];
  const scan = (list) => {
    const seen = [];
    for (const a of [].concat(list || [])) {
      if (a.puzzle === id || a.testimony === id) {
        keys.push(...seen);
        return true;
      }
      const inner = [];
      const collect = (x) => {
        for (const b of [].concat(x || [])) {
          if (b.say) inner.push(b.say);
          collect(b.then);
          collect(b.else);
          collect(b.run);
        }
      };
      collect(a);
      seen.push(...inner);
      if (scan(a.then) || scan(a.else) || scan(a.run)) {
        keys.push(...seen.slice(0, seen.length - inner.length));
        return true;
      }
    }
    return false;
  };
  for (const s of [...S2_SCENES, ...S2_M2_SCENES]) for (const i of s.interact || []) for (const c of i.cases || [i]) scan(c.run);
  return keys;
}
/** The mission whose steps wait for what the puzzle gives (its reward). */
const missionOf = (id) => [...MISSIONS_S2, ...MISSIONS_S2_M2].find((m) => m.steps.some((st) => [].concat(st.done).some((d) => [].concat(ALL[id].reward).includes(d))));

// the answer of each puzzle, in the words a leak would use
const ANSWER = {
  's2-compare': ['السجل وگف على سبعة', 'غلط بواحد', 'النسخة غلط'],
  's2-count': ['عدّيت سبعة', 'سبع فوانيس', 'سبعة فوانيس', 'الشجرة بيها سبع'],
  's2-sort-1': ['دليلين، وكلامين', 'الورقة نفسها دليل'],
  's2-board-1': ['A تحتاج', 'ما عدنا سبب'],
  's2-wax': ['گعدت بفانوس مضوي', 'الشمع يقطر', 'يقطر بس', 'الشمع يگدر يگول'],
  's2-copy': ['ثلاث جمل ما تركب', 'النسخة غلط بثلاث'],
  's2-sentence': ['راح للعيادة'],
  's2-clock': ['١٠:٤٠', '10:40', 'عشرة وأربعين', 'ساعة لقدّام', 'ساعة كاملة'],
  's2-jojo-versions': ['مليانة', 'ختم سليم', 'ما انقدّمت', 'ما قدّمت', 'متأخر ساعة', 'چانت عشرة', 'دفترك', 'الدفتر بالعلّية', 'طلع للعلّية'],
  's2-rubbing': ['إلى أنجي', 'انكتبت لأنجي'],
  's2-hands': ['خط أختي يشبه', 'أختي كتبت', 'خط الورقة خط أختي'],
  's2-board-2': ['ولا نظرية ثابتة'],
  's2-shadows': ['على الحلگة', 'بالحلگة', 'سبع ظلال', 'سبعة ظلال', 'الثامن ما انعلّگ', 'ما چان بالشجرة', 'بقى بالعلّية'],
  's2-who-said': ['صبري گال للمى', 'گالها للمى', 'سمعتها من صبري', 'ريان گال لصبري', 'گال لصبري', 'يوم الثلاثاء'],
  's2-trail-1': ['راح من ممر الشجرة', 'ممر الشجرة هو', 'راح للشجرة', 'الشجرة. هناك', 'دخله ورجع', 'البركة تمويه', 'دخل، وما رجع'],
  's2-trail-2': ['راح للحطب', 'صعد للسطح', 'من الحطب للسطح', 'لأنه صعد', 'البوابة تمويه', 'مو درب سنوكي', 'فوگ السگف'],
  's2-night-order': ['الكلام أول', 'الجملة أول', 'الفوانيس قبل البطاقة', 'الورقة قبل الساعة', 'الصفحة آخر', 'آخر شي الصفحة', 'آخر شي انگطعت'],
  's2-chain': ['لمى لأختي', 'من لمى لأختي', 'ووصلتلچ إنتِ', 'وصلت لأختي', 'أختي كتبت', 'آني كتبتها', 'إنتِ كتبتي', 'آخر حلقة', 'أول حلقة', 'خيط أحمر'],
};

describe('no answer before she earns it (every Season 2 puzzle)', () => {
  it('every Season 2 puzzle has its answer words listed here', () => {
    expect(Object.keys(ANSWER).sort()).toEqual(Object.keys(ALL).sort());
  });
  for (const [id, words] of Object.entries(ANSWER)) {
    it(`${id}: nothing said or shown before it gives the answer`, () => {
      const def = ALL[id];
      const m = missionOf(id);
      const texts = [def.title, def.goal, def.intro, ...(m ? [m.summary, ...m.steps.map((s) => s.text)] : []), ...saidBefore(id).flatMap(lines)].filter(Boolean);
      expect(m, `${id}: its mission`).toBeTruthy();
      expect(texts.length).toBeGreaterThan(4);
      for (const text of texts) for (const w of words) expect(text.includes(w), `${id}: «${w}» in «${text}»`).toBe(false);
    });
  }
});
