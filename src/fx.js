/**
 * Small celebratory effects. All DOM-based, cleaned up after themselves,
 * and skipped (or reduced to a soft glow) when reduced motion is preferred.
 */
const PETALS = ['#f48fb1', '#f7a8c4', '#e2668f', '#fff2c7', '#d9c3f2'];

export function createFx(layer, { reduced }) {
  function burst(x, y, { count = 14, spread = 120, glyphs = null } = {}) {
    if (reduced) {
      const glow = document.createElement('span');
      glow.className = 'fx-glow';
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
      layer.append(glow);
      setTimeout(() => glow.remove(), 900);
      return;
    }
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const d = spread * (0.55 + Math.random() * 0.6);
      p.className = glyphs ? 'fx-glyph' : 'fx-petal';
      if (glyphs) p.textContent = glyphs[i % glyphs.length];
      else p.style.background = PETALS[i % PETALS.length];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
      p.style.setProperty('--dy', `${Math.sin(a) * d - 30}px`);
      p.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`);
      layer.append(p);
      setTimeout(() => p.remove(), 1400);
    }
  }

  function burstAt(el, opts) {
    if (!el?.getBoundingClientRect) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  return { burst, burstAt };
}
