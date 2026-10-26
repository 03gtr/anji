/**
 * Small inline SVG symbols for puzzles, cards, items and the map.
 * All original, drawn on a 48×48 grid.
 */
const wrap = (inner, bg = 'none') =>
  `<svg viewBox="0 0 48 48" aria-hidden="true">${bg !== 'none' ? `<circle cx="24" cy="24" r="22" fill="${bg}"/>` : ''}${inner}</svg>`;

const moon = (phase) => {
  const base = '<circle cx="24" cy="24" r="15" fill="#151a46" stroke="#fff2c6" stroke-width="2"/>';
  if (phase === 'new') return wrap(base);
  if (phase === 'full') return wrap(`${base}<circle cx="24" cy="24" r="13" fill="#fff2c6"/>`);
  if (phase === 'half') return wrap(`${base}<path d="M24 11 A13 13 0 0 1 24 37Z" fill="#fff2c6"/>`);
  return wrap(`${base}<path d="M24 11 A13 13 0 0 1 24 37 A9 13 0 0 0 24 11Z" fill="#fff2c6"/>`);
};

const rosePath = (c1 = '#3f6fe0', c2 = '#8fb2ff') =>
  `<circle cx="24" cy="21" r="11" fill="${c1}"/><path d="M14 22 C16 31 32 31 34 22 C30 27 18 27 14 22Z" fill="#2a4fb8"/><path d="M19 21 C19 15 29 15 29 21 C29 25 23 25 23 21" fill="none" stroke="${c2}" stroke-width="2.2" stroke-linecap="round"/><path d="M24 32 V44" stroke="#4f8a5a" stroke-width="2.6"/><path d="M24 38 C30 34 34 37 34 37 C30 41 26 40 24 38Z" fill="#6fa56b"/>`;

export const SYMBOLS = {
  'moon-new': moon('new'),
  'moon-crescent': moon('crescent'),
  'moon-half': moon('half'),
  'moon-full': moon('full'),
  rose: wrap(rosePath()),
  'rose-red': wrap(rosePath('#c9304a', '#ff8a9c')),
  'rose-gold': wrap(rosePath('#e7b84a', '#fff0b0')),
  'rose-white': wrap(rosePath('#f3f1ff', '#c9c5e6')),
  star: wrap('<path d="M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#ffe28a" stroke="#e2b544" stroke-width="1.6" stroke-linejoin="round"/>'),
  paw: wrap('<ellipse cx="24" cy="30" rx="9" ry="8" fill="#f3f1ff"/><circle cx="14" cy="20" r="4.4" fill="#f3f1ff"/><circle cx="21" cy="14" r="4.4" fill="#f3f1ff"/><circle cx="28" cy="14" r="4.4" fill="#f3f1ff"/><circle cx="35" cy="20" r="4.4" fill="#f3f1ff"/>', '#3a72d8'),
  car: wrap('<path d="M6 30 L8 24 L18 22 L23 16 H32 L37 22 L43 24 L44 30 Z" fill="#1f4fd1"/><path d="M20 22 L24 18 H31 L34 22Z" fill="#bfe3ff"/><circle cx="15" cy="31" r="4.4" fill="#16161c"/><circle cx="36" cy="31" r="4.4" fill="#16161c"/><circle cx="15" cy="31" r="1.8" fill="#9aa3b8"/><circle cx="36" cy="31" r="1.8" fill="#9aa3b8"/>'),
  heart: wrap('<path d="M24 40 C10 30 6 22 10 15 C14 9 21 10 24 16 C27 10 34 9 38 15 C42 22 38 30 24 40Z" fill="#e0567f"/>'),
  key: wrap('<circle cx="16" cy="24" r="8" fill="none" stroke="#e2b544" stroke-width="4"/><path d="M24 24 H42 M36 24 V31 M41 24 V29" stroke="#e2b544" stroke-width="4" stroke-linecap="round"/>'),
  drop: wrap('<path d="M24 8 C30 18 36 24 36 31 A12 12 0 0 1 12 31 C12 24 18 18 24 8Z" fill="#6fd3ff"/>'),
  leaf: wrap('<path d="M10 38 C10 18 22 8 40 8 C40 26 30 38 10 38Z" fill="#6fa56b"/><path d="M12 36 C20 28 28 20 38 10" stroke="#3f6a4e" stroke-width="2"/>'),
  crown: wrap('<path d="M8 34 V16 L17 25 L24 12 L31 25 L40 16 V34Z" fill="#e2b544" stroke="#a77b1e" stroke-width="2"/>'),
  note: wrap('<path d="M18 34 V12 L36 8 V30" stroke="#f3f1ff" stroke-width="3.4" fill="none"/><ellipse cx="14" cy="34" rx="6" ry="4.6" fill="#f3f1ff"/><ellipse cx="32" cy="30" rx="6" ry="4.6" fill="#f3f1ff"/>'),
  sun: wrap('<circle cx="24" cy="24" r="8" fill="#ffd977"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4" stroke="#ffd977" stroke-width="3" stroke-linecap="round"/>'),
  stethoscope: wrap('<path d="M14 8 V20 A10 10 0 0 0 34 20 V8" stroke="#9aa3b8" stroke-width="3.4" fill="none"/><path d="M24 30 V36 A6 6 0 0 0 36 36 V32" stroke="#9aa3b8" stroke-width="3.4" fill="none"/><circle cx="36" cy="29" r="4" fill="#6fd3ff"/>'),
  dumbbell: wrap('<rect x="6" y="18" width="6" height="12" rx="2" fill="#9aa3b8"/><rect x="36" y="18" width="6" height="12" rx="2" fill="#9aa3b8"/><rect x="12" y="15" width="5" height="18" rx="2" fill="#c7d3e6"/><rect x="31" y="15" width="5" height="18" rx="2" fill="#c7d3e6"/><rect x="17" y="22" width="14" height="4" fill="#9aa3b8"/>'),
  coffee: wrap('<path d="M10 18 H32 V30 A9 9 0 0 1 23 39 H19 A9 9 0 0 1 10 30Z" fill="#f3e3c3"/><path d="M32 21 H36 A4 4 0 0 1 36 29 H32" fill="none" stroke="#f3e3c3" stroke-width="3"/><path d="M16 8 C14 11 18 12 16 15 M23 8 C21 11 25 12 23 15" stroke="#c9b8de" stroke-width="2" fill="none"/>'),
  mark: wrap('<circle cx="24" cy="16" r="7" fill="none" stroke="#9fd7ff" stroke-width="2.6"/><path d="M24 23 V42 M24 27 C33 27 33 34 24 34 M27 34 L34 42" stroke="#9fd7ff" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M24 33 C15 28 13 37 14 39 C18 40 22 38 24 36Z" fill="#9fd7ff"/>'),
  map: wrap('<path d="M8 12 L18 8 L30 12 L40 8 V36 L30 40 L18 36 L8 40Z" fill="#f3e3c3" stroke="#a88b5c" stroke-width="1.6"/><path d="M14 30 C20 20 26 28 34 16" stroke="#c9437a" stroke-width="2" fill="none" stroke-dasharray="3 3"/>'),
  bone: wrap('<path d="M14 18 a5 5 0 1 1 6 -6 L28 20 a5 5 0 1 1 6 6 a5 5 0 1 1 -6 6 L20 24 a5 5 0 1 1 -6 -6Z" fill="#f3f1ff"/>'),
  candy: wrap('<circle cx="24" cy="24" r="9" fill="#e0567f"/><path d="M15 24 L6 18 V30Z M33 24 L42 18 V30Z" fill="#e0567f"/><path d="M19 20 L29 28" stroke="#fff" stroke-width="2.4"/>'),
  apple: wrap('<path d="M24 16 C16 10 8 16 10 26 C12 36 20 40 24 37 C28 40 36 36 38 26 C40 16 32 10 24 16Z" fill="#d64545"/><path d="M24 16 C24 11 27 8 30 7" stroke="#5a3d2c" stroke-width="2.4" fill="none"/><path d="M26 12 C30 8 36 10 34 12 C30 15 27 13 26 12Z" fill="#6fa56b"/>'),
  carrot: wrap('<path d="M14 34 L32 14 C36 12 38 14 36 18 Z" fill="#f08a3c"/><path d="M33 13 L38 6 M35 15 L42 12 M34 14 L40 10" stroke="#6fa56b" stroke-width="2.6" stroke-linecap="round"/>'),
  avocado: wrap('<path d="M24 6 C34 6 38 28 34 36 A12 12 0 0 1 14 36 C10 28 14 6 24 6Z" fill="#3f7a3a"/><path d="M24 12 C31 12 33 28 31 34 A8 8 0 0 1 17 34 C15 28 17 12 24 12Z" fill="#d9e8a0"/><circle cx="24" cy="30" r="5" fill="#8a5a3a"/>'),
  egg: wrap('<ellipse cx="24" cy="26" rx="12" ry="15" fill="#fff6e6"/><circle cx="24" cy="28" r="6" fill="#ffc94a"/>'),
  bread: wrap('<path d="M8 22 C8 12 40 12 40 22 C40 26 36 26 36 26 V38 H12 V26 C12 26 8 26 8 22Z" fill="#d8a46a"/>'),
  fish: wrap('<path d="M8 24 C16 14 30 14 36 24 C30 34 16 34 8 24Z" fill="#7aa2ff"/><path d="M36 24 L44 16 V32Z" fill="#7aa2ff"/><circle cx="16" cy="22" r="2" fill="#16161c"/>'),
  berries: wrap('<circle cx="18" cy="28" r="7" fill="#4b3fa0"/><circle cx="30" cy="28" r="7" fill="#4b3fa0"/><circle cx="24" cy="18" r="7" fill="#5a4fbf"/><path d="M24 11 V6" stroke="#6fa56b" stroke-width="2.4"/>'),
  yogurt: wrap('<path d="M12 18 H36 L33 40 H15Z" fill="#f3f1ff"/><rect x="10" y="12" width="28" height="6" rx="2" fill="#7aa2ff"/>'),
  honey: wrap('<path d="M14 16 H34 V38 A4 4 0 0 1 30 42 H18 A4 4 0 0 1 14 38Z" fill="#e7b84a"/><rect x="12" y="10" width="24" height="6" rx="2" fill="#8a5a3a"/>'),
  chocolate: wrap('<rect x="12" y="10" width="24" height="30" rx="3" fill="#6b3f2a"/><path d="M12 20 H36 M12 30 H36 M24 10 V40" stroke="#4a2a1c" stroke-width="2"/>'),
  pizza: wrap('<path d="M24 42 L8 12 C18 6 30 6 40 12Z" fill="#f2c55c"/><circle cx="20" cy="18" r="3" fill="#c9304a"/><circle cx="28" cy="24" r="3" fill="#c9304a"/><circle cx="24" cy="32" r="2.4" fill="#c9304a"/>'),
  spinach: wrap('<path d="M24 40 C10 32 8 18 18 8 C22 18 26 18 30 8 C40 18 38 32 24 40Z" fill="#3f8a4a"/><path d="M24 40 V16" stroke="#2b5a34" stroke-width="2"/>'),
  footprint: wrap('<ellipse cx="24" cy="28" rx="7" ry="9" fill="#c9b8de"/><circle cx="17" cy="15" r="3" fill="#c9b8de"/><circle cx="24" cy="12" r="3" fill="#c9b8de"/><circle cx="31" cy="15" r="3" fill="#c9b8de"/>'),
  feather: wrap('<path d="M12 40 C14 24 26 10 38 8 C38 22 26 34 12 40Z" fill="#2f8f6a"/><circle cx="32" cy="16" r="4" fill="#e2b544"/><circle cx="32" cy="16" r="2" fill="#1d3fa0"/><path d="M12 40 L32 16" stroke="#1f5a44" stroke-width="1.6"/>'),
  hoof: wrap('<path d="M14 14 C14 32 22 36 22 36 L22 14Z M34 14 C34 32 26 36 26 36 L26 14Z" fill="#c9b8de"/>'),
  claw: wrap('<circle cx="24" cy="30" r="7" fill="#c9b8de"/><path d="M14 20 l-3 -8 M20 16 l-1 -9 M28 16 l1 -9 M34 20 l3 -8" stroke="#c9b8de" stroke-width="3" stroke-linecap="round"/>'),
  bird: wrap('<path d="M24 34 V20 M24 20 L16 12 M24 20 L32 12 M24 20 L24 10" stroke="#c9b8de" stroke-width="3" stroke-linecap="round"/>'),
};

export function symbol(name) {
  return SYMBOLS[name] || SYMBOLS.star;
}
