/**
 * Hidden-object scenes (portrait composition, viewBox 300×420).
 * Each object: { id, label, icon, x, y, w, h, svg } — svg drawn at (x, y).
 * `background` and `decoys` are plain SVG markup.
 */
const books = (x, y, w, h, colors) => {
  let out = '';
  let bx = x;
  let i = 0;
  while (bx < x + w - 4) {
    const bw = 4 + ((i * 7) % 5);
    const bh = h - ((i * 5) % 9);
    out += `<rect x="${bx}" y="${y + h - bh}" width="${bw}" height="${bh}" fill="${colors[i % colors.length]}"/>`;
    bx += bw + 1;
    i += 1;
  }
  return out;
};

const PALETTE = ['#8e1c2e', '#2f5fd0', '#e2b544', '#2f6a5a', '#6b4fa0', '#c9a77a', '#e0567f'];

export const HIDDEN_SCENES = {
  study: {
    title: 'ميز ريان',
    intro: 'ميز مبرمج: شاشات، أسلاك، وأغراض بكل مكان. دوّري على الثمانية اللي بالقائمة.',
    background: `
      <defs>
        <pattern id="hs-wall" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#22265a"/><path d="M12 4 L16 12 L12 20 L8 12Z" fill="#2a2f6c"/></pattern>
        <linearGradient id="hs-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141a52"/><stop offset="1" stop-color="#4b3f8e"/></linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#hs-wall)"/>
      <rect y="292" width="300" height="128" fill="#5a3a32"/>
      ${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${300 + i * 10} H300" stroke="rgba(0,0,0,.2)"/>`).join('')}
      <rect x="18" y="26" width="96" height="116" fill="#2a2236"/>
      <rect x="24" y="32" width="84" height="104" fill="url(#hs-win)"/>
      <circle cx="88" cy="56" r="10" fill="#fff4d6"/><circle cx="93" cy="52" r="9" fill="#1a2058"/>
      <circle cx="40" cy="50" r="1.4" fill="#fff6d0"/><circle cx="60" cy="72" r="1" fill="#fff6d0"/><circle cx="34" cy="96" r="1.2" fill="#fff6d0"/>
      <path d="M66 32 V136 M24 84 H108" stroke="#2a2236" stroke-width="4"/>
      <rect x="14" y="140" width="104" height="8" fill="#3b2630"/>
      <circle cx="150" cy="62" r="22" fill="#f3e3c3" stroke="#3b2630" stroke-width="4"/>
      <path d="M150 62 L141 72 M150 62 L154 44" stroke="#2a1a22" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="104" y="112" width="80" height="62" fill="#b78a5a" stroke="#6b4a3a" stroke-width="3"/>
      <rect x="112" y="120" width="20" height="16" fill="#f3e3c3" transform="rotate(-6 122 128)"/>
      <rect x="158" y="118" width="18" height="22" fill="#fff6e6" transform="rotate(5 167 129)"/>
      <path d="M118 126 L168 132 L132 160" stroke="#c9304a" stroke-width="1.4" fill="none"/>
      <circle cx="118" cy="126" r="2" fill="#c9304a"/><circle cx="168" cy="132" r="2" fill="#c9304a"/><circle cx="132" cy="160" r="2" fill="#c9304a"/>
      <rect x="188" y="16" width="104" height="276" fill="#3b2630"/>
      ${[0, 1, 2, 3].map((r) => `<rect x="192" y="${84 + r * 66}" width="96" height="5" fill="#2a1a22"/>${books(194, 30 + r * 66, 92, 54, PALETTE.slice(r).concat(PALETTE))}`).join('')}
      <rect x="30" y="250" width="160" height="12" fill="#6b4a3a"/>
      <rect x="36" y="262" width="10" height="80" fill="#4a3028"/><rect x="174" y="262" width="10" height="80" fill="#4a3028"/>
      <rect x="40" y="262" width="60" height="40" fill="#5a3a32"/><rect x="66" y="278" width="10" height="3" fill="#e2b544"/>
      <path d="M170 248 L178 214 L196 206" stroke="#2d2f45" stroke-width="3" fill="none"/>
      <path d="M188 200 L206 206 L198 222 Z" fill="#2d2f45"/>
      <circle cx="200" cy="218" r="16" fill="rgba(255,217,140,.25)"/>
      <rect x="110" y="236" width="44" height="14" fill="#f3e3c3"/><path d="M112 240 H150 M112 244 H140" stroke="#a88b5c"/>
      <rect x="96" y="186" width="70" height="46" rx="3" fill="#16161c"/><rect x="100" y="190" width="62" height="38" fill="#0b1020"/>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="${104 + (i % 2) * 6}" y="${194 + i * 7}" width="${18 + ((i * 11) % 24)}" height="2.4" fill="${['#9fd7ff', '#ffd977', '#e85d8c', '#9ee6a8', '#c9b8de'][i]}"/>`).join('')}
      <rect x="126" y="232" width="10" height="5" fill="#16161c"/>
      <rect x="64" y="244" width="40" height="5" rx="1.5" fill="#1d1f28"/>
      <path d="M40 256 C30 290 70 300 60 330 M150 250 C170 300 120 300 140 340" stroke="#15161b" stroke-width="2.4" fill="none"/>
      <rect x="236" y="300" width="30" height="8" rx="2" fill="#2b2f3a"/><circle cx="242" cy="304" r="1.4" fill="#7fd38a"/><circle cx="248" cy="304" r="1.4" fill="#7fd38a"/>
      <ellipse cx="150" cy="392" rx="120" ry="20" fill="#5b1f34"/><ellipse cx="150" cy="392" rx="100" ry="14" fill="none" stroke="#e2b544" stroke-width="1.5" opacity=".6"/>
      <path d="M118 300 H190 V312 H118Z M126 312 V380 M182 312 V380" stroke="#3b2630" stroke-width="6" fill="#4a3040"/>
      <path d="M22 400 L16 352 H48 L42 400Z" fill="#b4674a"/>
      <circle cx="26" cy="344" r="12" fill="#2f5a4a"/><circle cx="40" cy="336" r="12" fill="#3f7460"/><circle cx="32" cy="324" r="12" fill="#2f5a4a"/>
      <circle cx="30" cy="330" r="4" fill="#3f6fe0"/><circle cx="42" cy="340" r="3.5" fill="#e85d8c"/>`,
    decoys: `
      <rect x="256" y="102" width="20" height="16" fill="#c9a77a" opacity=".9"/>
      <circle cx="232" cy="242" r="7" fill="#f3e3c3"/><circle cx="234" cy="241" r="7" fill="none" stroke="#a88b5c"/>
      <ellipse cx="90" cy="372" rx="7" ry="6" fill="#efe9dd"/><ellipse cx="236" cy="404" rx="6" ry="5" fill="#efe9dd"/>
      <path d="M58 246 l30 -4" stroke="#e2b544" stroke-width="2"/><path d="M60 244 l24 -6" stroke="#2f5fd0" stroke-width="2"/>
      <rect x="250" y="176" width="16" height="18" rx="2" fill="#f3f1ff"/>
      <rect x="208" y="368" width="26" height="8" rx="2" fill="#8e1c2e" transform="rotate(12 220 372)"/>`,
    objects: [
      {
        id: 'duck',
        line: 'بطة مطاطية؟ ريان يشرحلها الكود لمن ما يشتغل. تگول تفهم أكثر من الناس.',
        label: 'بطة مطاطية',
        icon: 'bird',
        x: 210,
        y: 98,
        w: 20,
        h: 18,
        svg: '<ellipse cx="10" cy="13" rx="9" ry="5" fill="#ffd977"/><circle cx="13" cy="6" r="5" fill="#ffd977"/><path d="M17 6 L21 7 L17 8Z" fill="#f08a3c"/><circle cx="14" cy="5" r="1" fill="#16161c"/>',
      },
      {
        id: 'keytag',
        line: 'ميدالية بوردة زرقاء… بس المفتاح مو بيها. منو أخذه؟',
        label: 'ميدالية مفاتيح بوردة زرقاء',
        icon: 'key',
        x: 160,
        y: 236,
        w: 18,
        h: 14,
        svg: '<circle cx="5" cy="7" r="4" fill="none" stroke="#9aa3b8" stroke-width="1.6"/><circle cx="13" cy="7" r="5" fill="#3f6fe0"/><path d="M10.5 7 Q13 4 15.5 7" stroke="#9fc0ff" stroke-width="1.2" fill="none"/>',
      },
      {
        id: 'seeds',
        line: 'بذور ورد أزرق. ريان يزرعها حتى بالمكتب.',
        label: 'كيس بذور',
        icon: 'leaf',
        x: 52,
        y: 386,
        w: 16,
        h: 20,
        svg: '<path d="M1 3 H15 V18 Q8 21 1 18Z" fill="#c9a77a"/><rect x="1" y="1" width="14" height="3" fill="#8a6a45"/><circle cx="8" cy="11" r="3.4" fill="#3f6fe0"/>',
      },
      {
        id: 'brush',
        line: 'فرشاتي! كنت أدوّر عليها من سنة. لا تسألين.',
        label: 'فرشاة سنوكي',
        icon: 'paw',
        x: 150,
        y: 384,
        w: 32,
        h: 11,
        svg: '<rect x="0" y="3" width="14" height="6" rx="3" fill="#8a5a3a"/><rect x="14" y="0" width="18" height="11" rx="3" fill="#2f5fd0"/><path d="M16 11 V14 M20 11 V14 M24 11 V14 M28 11 V14" stroke="#f3f1ff" stroke-width="1.4"/>',
      },
      {
        id: 'mug',
        line: 'لحظة… القهوة بعدها دافية؟ يعني ما صارله هواية تارك المكان.',
        label: 'كوب قهوة… لسه دافي',
        icon: 'coffee',
        x: 64,
        y: 230,
        w: 18,
        h: 20,
        svg: '<path d="M2 8 H14 V17 Q14 20 11 20 H5 Q2 20 2 17Z" fill="#f3f1ff"/><path d="M14 10 Q18 11 14 16" stroke="#f3f1ff" stroke-width="1.6" fill="none"/><path d="M6 6 Q4 3 6 0 M10 6 Q8 3 10 0" stroke="#c9b8de" stroke-width="1.2" fill="none"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></path>',
      },
      {
        id: 'sketchbook',
        line: 'رسمة سيارة زرقاء. ريان يرسم السيارات أحسن من الناس.',
        label: 'دفتر رسم',
        icon: 'car',
        x: 196,
        y: 260,
        w: 30,
        h: 24,
        svg: '<rect x="0" y="0" width="30" height="24" rx="2" fill="#f3e3c3" transform="rotate(-8 15 12)"/><path d="M6 15 L9 11 L15 10 L18 7 H22 L25 11 Z" fill="#1f4fd1" transform="rotate(-8 15 12)"/>',
      },
      {
        id: 'usb',
        line: 'فلاشة زرقاء مكتوب عليها «BlueRose — نسخة احتياطية». حتى الحدائق تحتاج باك أب.',
        label: 'فلاشة زرقاء',
        icon: 'key',
        x: 74,
        y: 136,
        w: 22,
        h: 10,
        svg: '<rect x="0" y="1" width="16" height="8" rx="2" fill="#2f5fd0"/><rect x="16" y="2.5" width="6" height="5" fill="#c7d3e6"/><circle cx="6" cy="5" r="2" fill="#9fd7ff"/>',
      },
      {
        id: 'letter',
        line: 'رسالة مختومة بالختم الأحمر… والتاريخ عليها باچر.',
        label: 'رسالة مختومة',
        icon: 'heart',
        x: 136,
        y: 136,
        w: 20,
        h: 15,
        svg: '<rect x="0" y="0" width="20" height="15" fill="#f7c6d6"/><path d="M0 0 L10 8 L20 0" stroke="#e0567f" stroke-width="1.2" fill="none"/><circle cx="10" cy="9" r="3" fill="#8e1c2e"/>',
      },
    ],
  },
  evidence: {
    title: 'طاولة الأدلة',
    intro: 'سنوكي فرش كل «الأدلة» على الطاولة. لگي الثمانية… وفكّري منو جابها.',
    background: `
      <rect width="300" height="300" fill="#4a3324"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 19}" y="0" width="18" height="300" fill="${i % 2 ? '#523928' : '#4a3324'}"/>`).join('')}
      <rect y="292" width="300" height="128" fill="#3a2a22"/>
      <rect x="26" y="22" width="150" height="96" fill="#1d2b2c" stroke="#8a6a45" stroke-width="5"/>
      <text x="101" y="52" text-anchor="middle" font-size="12" fill="#f3f1ff" font-family="sans-serif">قضية الخريطة المختفية</text>
      <path d="M44 70 H96 M44 84 H120 M44 98 H80" stroke="#f3f1ff" stroke-width="2" opacity=".6"/>
      <circle cx="150" cy="88" r="12" fill="none" stroke="#f3f1ff" stroke-width="2" opacity=".7"/><path d="M158 96 L168 106" stroke="#f3f1ff" stroke-width="3" opacity=".7"/>
      <rect x="196" y="24" width="40" height="52" fill="#f3e3c3" stroke="#c9a24a" stroke-width="3"/><circle cx="216" cy="46" r="9" fill="#3a72d8"/><path d="M210 66 H222" stroke="#8a6a45"/>
      <rect x="246" y="30" width="40" height="52" fill="#f3e3c3" stroke="#c9a24a" stroke-width="3"/><circle cx="266" cy="52" r="9" fill="#3a72d8"/><path d="M260 72 H272" stroke="#8a6a45"/>
      <rect x="196" y="96" width="94" height="110" fill="#2a1a22"/>
      ${[0, 1, 2].map((r) => `<rect x="196" y="${132 + r * 36}" width="94" height="4" fill="#1a1016"/>${books(198, 100 + r * 36, 90, 30, PALETTE.slice(r + 1).concat(PALETTE))}`).join('')}
      <rect x="10" y="230" width="280" height="16" fill="#8a6a45"/>
      <rect x="10" y="246" width="280" height="54" fill="#6b5134"/>
      <rect x="20" y="300" width="12" height="70" fill="#4a3324"/><rect x="268" y="300" width="12" height="70" fill="#4a3324"/>
      <ellipse cx="150" cy="396" rx="110" ry="16" fill="#2b3a8c" opacity=".8"/>
      <rect x="40" y="252" width="70" height="40" fill="#f3e3c3" transform="rotate(-4 75 272)"/>
      <rect x="170" y="254" width="80" height="34" fill="#efe2cf" transform="rotate(5 210 271)"/>`,
    decoys: `
      <circle cx="132" cy="268" r="9" fill="#9fd7ff" opacity=".7"/>
      <rect x="84" y="320" width="18" height="12" rx="3" fill="#c9a77a"/>
      <path d="M236 330 q8 -8 16 0" stroke="#f3f1ff" stroke-width="3" fill="none"/>
      <rect x="128" y="352" width="22" height="6" rx="3" fill="#e2b544"/>`,
    objects: [
      { id: 'feather', label: 'ريشة طاووس', icon: 'feather', line: 'ريشة السلطان. بس السلطان يخسر ريش كل ما يتحمّس.', x: 54, y: 254, w: 22, h: 30, svg: '<path d="M2 28 C2 14 10 4 20 2 C20 14 12 24 2 28Z" fill="#2f8f6a"/><circle cx="15" cy="9" r="4" fill="#e2b544"/><circle cx="15" cy="9" r="2" fill="#1d3fa0"/>' },
      { id: 'fur', label: 'خصلة فرو أبيض', icon: 'paw', line: 'فرو أبيض… فرو ناعم… فرو مألوف جداً. لا تباوعيني.', x: 186, y: 258, w: 22, h: 16, svg: '<path d="M2 10 Q6 2 11 8 Q15 0 20 8 Q22 14 14 14 Q6 16 2 10Z" fill="#fbfbfd" stroke="#c9c5d8" stroke-width="1"/>' },
      { id: 'teeth', label: 'غطاء الخريطة معضوض', icon: 'map', line: 'آثار أسنان على الغطاء. أسنان كبيرة. أسنان… محترمة.', x: 220, y: 262, w: 26, h: 18, svg: '<rect x="0" y="2" width="26" height="14" rx="3" fill="#8a6a45"/><path d="M18 2 l2 4 l2 -4 l2 4" stroke="#f3e3c3" stroke-width="1.6" fill="none"/>' },
      { id: 'thread', label: 'خيط أزرق', icon: 'leaf', line: 'خيط أزرق… من قلادتي؟ لا. من شي ثاني. أكيد.', x: 118, y: 236, w: 26, h: 8, svg: '<path d="M1 4 Q7 0 13 4 T25 4" stroke="#3a72d8" stroke-width="2.4" fill="none"/>' },
      { id: 'acorn', label: 'قشرة جوز', icon: 'claw', line: 'السناجب! مجرمين معروفين. بس بالجوز، مو بالخرايط.', x: 70, y: 362, w: 14, h: 16, svg: '<path d="M2 6 H12 V10 Q12 16 7 16 Q2 16 2 10Z" fill="#a66a3a"/><path d="M1 6 Q7 0 13 6Z" fill="#6b4a2a"/>' },
      { id: 'sticker', label: 'ملصق «شجاع»', icon: 'stethoscope', line: 'ملصق الممرضة إبرة. هي تلزگها على كل شي. حتى عليّ. مرة.', x: 250, y: 352, w: 20, h: 20, svg: '<circle cx="10" cy="10" r="9" fill="#ffd977" stroke="#e2405f" stroke-width="2"/><path d="M6 10 l3 3 l5 -6" stroke="#e2405f" stroke-width="2" fill="none"/>' },
      { id: 'tape', label: 'شريط تسجيل', icon: 'note', line: 'تسجيل… لصوت واحد يحچي وهو نايم. منو يحچي وهو نايم؟ مو آني.', x: 154, y: 374, w: 26, h: 16, svg: '<rect x="0" y="0" width="26" height="16" rx="2" fill="#2a2236"/><circle cx="8" cy="8" r="4" fill="#9aa3b8"/><circle cx="18" cy="8" r="4" fill="#9aa3b8"/>' },
      { id: 'magnifier', label: 'عدسة المحقق', icon: 'star', line: 'عدستي! هي اللي تخلّيني محقق. والقبعة. والذكاء.', x: 28, y: 300, w: 22, h: 22, svg: '<circle cx="8" cy="8" r="7" fill="#bfe3ff" stroke="#8a6a45" stroke-width="2.4"/><path d="M13 13 L20 20" stroke="#8a6a45" stroke-width="3.4" stroke-linecap="round"/>' },
    ],
  },
};

