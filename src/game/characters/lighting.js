/**
 * One lighting model for every character (2.5D art direction).
 *
 * The characters are vector drawings; this module gives them volume with SVG
 * lighting filters: each body part's own silhouette is blurred into a height
 * map and lit by
 *   - a warm KEY light from the upper left (lanterns),
 *   - a soft specular highlight (hair shine, fur sheen, glossy shoes),
 *   - a cool RIM light from behind on the right (moonlight / blue roses),
 * then multiplied back onto the flat colours. Sprites are rasterised once
 * when a scene loads (characters/sprites.js), so the filters cost nothing per
 * frame. The same constants are documented in docs/ART_PIPELINE.md.
 */
export const LIGHT = Object.freeze({
  key: { azimuth: 225, elevation: 52, color: '#fff3e2' }, // upper left, warm
  rim: { azimuth: 330, elevation: 18, color: '#9fd7ff' }, // behind, right, moonlight
  ambient: 0.4, // how much of the flat colour survives in full shadow
  diffuse: 0.68,
});

/**
 * Filter definitions for one SVG document (ids are suffixed to stay unique
 * when several SVGs share a page).
 *   v3d-<id>   general volume (skin, cloth, hair)
 *   fur-<id>   softer, wider falloff and more sheen (Snooki's coat)
 *   gloss-<id> tight highlight (eyes, nose, bows, shoes)
 */
export function lightingDefs(id) {
  const filter = (name, { blur, scale, spec, exp, rim }) => `
    <filter id="${name}-${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="h"/>
      <feDiffuseLighting in="h" surfaceScale="${scale}" diffuseConstant="1" lighting-color="${LIGHT.key.color}" result="d">
        <feDistantLight azimuth="${LIGHT.key.azimuth}" elevation="${LIGHT.key.elevation}"/>
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="${LIGHT.diffuse}" k2="${LIGHT.ambient}" k3="0" k4="0" result="lit"/>
      <feSpecularLighting in="h" surfaceScale="${scale}" specularConstant="${spec}" specularExponent="${exp}" lighting-color="#ffffff" result="s">
        <feDistantLight azimuth="${LIGHT.key.azimuth}" elevation="${LIGHT.key.elevation + 8}"/>
      </feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
      <feSpecularLighting in="h" surfaceScale="${scale}" specularConstant="${rim}" specularExponent="6" lighting-color="${LIGHT.rim.color}" result="r">
        <feDistantLight azimuth="${LIGHT.rim.azimuth}" elevation="${LIGHT.rim.elevation}"/>
      </feSpecularLighting>
      <feComposite in="r" in2="SourceAlpha" operator="in" result="r2"/>
      <feComposite in="lit" in2="s2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="ls"/>
      <feComposite in="ls" in2="r2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="all"/>
      <feComposite in="all" in2="SourceAlpha" operator="in"/>
    </filter>`;
  return [
    filter('v3d', { blur: 2.4, scale: 3, spec: 0.12, exp: 30, rim: 0.32 }),
    filter('fur', { blur: 3.4, scale: 2.4, spec: 0.12, exp: 16, rim: 0.5 }),
    filter('gloss', { blur: 1.2, scale: 2.2, spec: 0.45, exp: 34, rim: 0.25 }),
  ].join('');
}

/** Wrap markup in a lit group. */
export const lit = (id, inner, kind = 'v3d') => `<g filter="url(#${kind}-${id})">${inner}</g>`;

/** Soft contact/ambient-occlusion shadow (an ellipse with a blurred edge). */
export function aoDefs(id) {
  return `<radialGradient id="ao-${id}"><stop offset="0" stop-color="#0a0c24" stop-opacity=".45"/><stop offset="1" stop-color="#0a0c24" stop-opacity="0"/></radialGradient>`;
}
export const ao = (id, cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ao-${id})"/>`;
