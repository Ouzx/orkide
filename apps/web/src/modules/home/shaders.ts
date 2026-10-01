/**
 * Pollen: soft round points that drift on slow, per-particle orbits and twinkle. Size attenuates
 * with distance; color comes per particle (orchid ↔ aurora).
 */
export const pollenVertex = `
uniform float uTime;
uniform float uPixelRatio;
attribute float aScale;
attribute float aSeed;
attribute vec3 aColor;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float t = uTime * (0.15 + aSeed * 0.1);
  p.x += sin(t + aSeed * 6.2831) * 0.18;
  p.y += mod(uTime * 0.05 * (0.5 + aSeed) + aSeed * 4.0, 4.0) - 2.0;
  p.z += cos(t * 0.8 + aSeed * 3.1) * 0.18;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aScale * uPixelRatio * (34.0 / -view.z);
  float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 12.0);
  // Fade in and out at the ends of the vertical drift so particles never pop.
  float edge = smoothstep(-2.0, -1.4, p.y - position.y) * smoothstep(2.0, 1.4, p.y - position.y);
  vAlpha = twinkle * edge * (0.35 + 0.65 * aScale);
  vColor = aColor;
  gl_Position = projectionMatrix * view;
}
`;

export const pollenFragment = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float glow = smoothstep(0.5, 0.0, d);
  // Bright core with a soft halo.
  float core = smoothstep(0.18, 0.0, d);
  gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6), (glow * glow * 0.8 + core) * vAlpha);
}
`;
