/**
 * Healthy kitchen rules: each order describes constraints in words; the
 * player picks ingredients and the rules decide. Mistakes get funny (and
 * true) feedback — e.g. chocolate and avocado are unsafe for dogs.
 */
export const INGREDIENTS = {
  carrot: { name: 'جزر', icon: 'carrot', tags: ['veg', 'crunchy'] },
  spinach: { name: 'سبانخ', icon: 'spinach', tags: ['veg', 'green'] },
  avocado: { name: 'أفوكادو', icon: 'avocado', tags: ['green', 'healthy-fat', 'dog-unsafe'] },
  fish: { name: 'سمچ', icon: 'fish', tags: ['protein'] },
  egg: { name: 'بيض', icon: 'egg', tags: ['protein'] },
  apple: { name: 'تفاح', icon: 'apple', tags: ['fruit'] },
  berries: { name: 'توت', icon: 'berries', tags: ['fruit'] },
  yogurt: { name: 'زبادي', icon: 'yogurt', tags: ['protein', 'dairy'] },
  honey: { name: 'عسل', icon: 'honey', tags: ['sugar'] },
  chocolate: { name: 'شوكولاتة', icon: 'chocolate', tags: ['sugar', 'dog-unsafe'] },
  bread: { name: 'خبز', icon: 'bread', tags: ['carb'] },
  rice: { name: 'تمّن', icon: 'rice', tags: ['carb'] },
  pizza: { name: 'بيتزا', icon: 'pizza', tags: ['junk'] },
};

export const RECIPES = [
  {
    id: 'snooki-dinner',
    title: 'عشاء سنوكي',
    brief: 'سنوكي يريد عشاء «صحي»… حسب تعريفه. ٣ مكونات: بروتين واحد على الأقل، خضرة وحدة على الأقل، وكل شي لازم يكون آمن للكلاب.',
    size: 3,
    rules: [{ forbid: 'dog-unsafe' }, { forbid: 'junk' }, { need: 'protein' }, { need: 'veg' }],
  },
  {
    id: 'gym-bowl',
    title: 'وجبة ما بعد الجيم',
    brief: 'أنجي راجعة من الجيم وجوعانة. ٤ مكونات: بروتين، شي أخضر، دهون صحية، وبدون سكر ولا أكل سريع.',
    size: 4,
    rules: [{ forbid: 'sugar' }, { forbid: 'junk' }, { need: 'protein' }, { need: 'green' }, { need: 'healthy-fat' }],
  },
  {
    // the recipe card is found in the kitchen: it also carries the garage clue
    id: 'ryan-snack',
    title: 'سناك منتصف الليل',
    brief: 'بطاقة وصفة بخط ريان: «زبادي، توت، وملعقة عسل. الفرن مو لازم… بس خلّي المؤقت على ٠٢:٣٠.»',
    size: 3,
    exact: ['yogurt', 'berries', 'honey'],
  },
  {
    // V2 «الوصفة الناقصة»: the three scraps (protein, green, filling; no fast food)
    id: 'home-meal',
    title: 'أكل البيت',
    brief: 'البطاقة رجعت كاملة: «شي يقوّي، شي أخضر من الأرض، شي يشبّع، وبدون أكل سريع.» ٤ مكونات.',
    size: 4,
    side: true,
    rules: [{ forbid: 'junk' }, { forbid: 'sugar' }, { need: 'protein' }, { need: 'veg' }, { need: 'carb' }],
  },
];

/** Recipes of the main kitchen order (the side recipe is played on its own). */
export const MAIN_RECIPES = RECIPES.filter((r) => !r.side);

const FAIL = {
  size: (n) => `العدد لازم يكون ${n}.`,
  'dog-unsafe:chocolate': 'سنوكي: شوكولاتة؟! تريدين تودّيني للمستوصف؟ (الشوكولاتة سامة للكلاب، صدگ.)',
  'dog-unsafe:avocado': 'سنوكي: الأفوكادو مو آمن للكلاب. أعرف لأني قريت. …مرة.',
  junk: 'بيتزا مو أكل صحي… بس سنوكي يحترم المحاولة.',
  sugar: 'بدون سكر هنا. العضلات (والوصفة) ما تحب العسل… والشوكولاتة.',
  protein: 'وين البروتين؟ لازم عضلات حتى نهرب من الإبرة.',
  veg: 'وين الخضرة؟ سنوكي يگول «اختيارية». سنوكي غلطان.',
  green: 'ناقص شي أخضر.',
  'healthy-fat': 'ناقصها دهون صحية. (تلميح: شي أخضر ومحبوب بعد التمرين.)',
  exact: 'مو نفس الوصفة اللي بالبطاقة. اقرئيها مرة ثانية.',
  carb: 'ناقصها شي يشبّع: تمّن أو خبز. (القصاصة الثالثة)',
};

export const hasTag = (id, tag) => INGREDIENTS[id]?.tags.includes(tag);

/** @returns {{ ok: boolean, reason?: string }} */
export function checkRecipe(recipe, picked) {
  if (picked.length !== recipe.size) return { ok: false, reason: FAIL.size(recipe.size) };
  if (recipe.exact) {
    const ok = recipe.exact.every((x) => picked.includes(x)) && picked.every((x) => recipe.exact.includes(x));
    return ok ? { ok: true } : { ok: false, reason: FAIL.exact };
  }
  for (const rule of recipe.rules) {
    if (rule.forbid) {
      const bad = picked.find((id) => hasTag(id, rule.forbid));
      if (bad) return { ok: false, reason: FAIL[`${rule.forbid}:${bad}`] || FAIL[rule.forbid] };
    }
    if (rule.need && !picked.some((id) => hasTag(id, rule.need))) return { ok: false, reason: FAIL[rule.need] };
  }
  return { ok: true };
}

/** One valid answer per recipe (used by tests and the hint button). */
export function exampleSolution(recipe) {
  if (recipe.exact) return [...recipe.exact];
  const ids = Object.keys(INGREDIENTS);
  const combos = (k, start = 0, acc = []) => {
    if (acc.length === k) return [acc];
    const out = [];
    for (let i = start; i < ids.length; i++) out.push(...combos(k, i + 1, [...acc, ids[i]]));
    return out;
  };
  return combos(recipe.size).find((c) => checkRecipe(recipe, c).ok) ?? null;
}

export function kitchenMedal(mistakes) {
  return mistakes === 0 ? 'gold' : mistakes <= 2 ? 'silver' : 'bronze';
}
