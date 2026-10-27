/**
 * Dialogue runner: walks an authored script and yields what to show next.
 * Pure logic (no DOM), so branching, conditions and effects are testable.
 *
 * Script nodes:
 *   { s: 'snooki', e: 'smug', t: '…' }           a line (speaker, expression, text)
 *   { …line, if: cond }                           line shown only when cond holds
 *   { if: cond, then: [ … ], else: [ … ] }        branch
 *   { s, t, choice: [ { t, if?, do?, then } ] }   a choice (prompt text optional)
 *   { do: effects }                               state effects (see core/effects.js)
 *   { cue: 'bark' }                               presentation cue (sound, shake…)
 *   any line may also carry `do` (applied when the line is shown) and `cue`.
 *
 * Step types returned by next(): 'line' | 'choice' | 'cue' | 'end'.
 */
export function createDialogue(script, { check = () => true, apply = () => {} } = {}) {
  if (!Array.isArray(script)) throw new Error('Dialogue script must be an array.');
  const stack = [{ nodes: script, i: 0 }];
  let pending = null; // the choice waiting for an answer
  let ended = false;

  function next() {
    if (pending) throw new Error('A choice is waiting: call choose(index).');
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top.i >= top.nodes.length) {
        stack.pop();
        continue;
      }
      const node = top.nodes[top.i++];
      if ('then' in node || 'else' in node) {
        stack.push({ nodes: (check(node.if) ? node.then : node.else) || [], i: 0 });
        continue;
      }
      if ('if' in node && !check(node.if)) continue;
      if (node.choice) {
        const options = node.choice.filter((o) => !('if' in o) || check(o.if));
        if (!options.length) continue; // nothing to choose: skip the choice
        pending = options;
        return { type: 'choice', speaker: node.s ?? null, expr: node.e ?? null, text: node.t ?? null, options: options.map((o) => o.t) };
      }
      if (node.do) apply(node.do);
      if (node.t != null) return { type: 'line', speaker: node.s ?? null, expr: node.e ?? null, text: node.t, cue: node.cue ?? null };
      if (node.cue) return { type: 'cue', cue: node.cue };
    }
    ended = true;
    return { type: 'end' };
  }

  return {
    next,
    choose(index) {
      if (!pending) throw new Error('No choice is waiting.');
      const option = pending[index];
      if (!option) throw new Error(`No option ${index}.`);
      pending = null;
      if (option.do) apply(option.do);
      stack.push({ nodes: option.then || [], i: 0 });
    },
    get waitingForChoice() {
      return Boolean(pending);
    },
    get ended() {
      return ended;
    },
  };
}

/** Every line/choice text of a script (for content checks and tests). */
export function scriptTexts(script, out = []) {
  for (const n of script) {
    if (n.t != null) out.push(n.t);
    if (n.then) scriptTexts(n.then, out);
    if (n.else) scriptTexts(n.else, out);
    for (const o of n.choice || []) {
      out.push(o.t);
      scriptTexts(o.then || [], out);
    }
  }
  return out;
}

/** Walk all nodes (for validating conditions/effects/speakers in content). */
export function walkScript(script, fn) {
  for (const n of script) {
    fn(n);
    if (n.then) walkScript(n.then, fn);
    if (n.else) walkScript(n.else, fn);
    for (const o of n.choice || []) {
      fn(o);
      walkScript(o.then || [], fn);
    }
  }
}
