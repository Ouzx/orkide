/** Ashima Arts 3D simplex noise (MIT) — https://github.com/ashima/webgl-noise */
const simplexNoise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/**
 * The bloom: a sphere pushed outward into five petals (an orchid's symmetry), breathing with
 * layered noise. `vBloom` carries the displacement to the fragment stage for coloring.
 */
export const bloomVertex = `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vView;
varying float vBloom;
${simplexNoise}

float bloom(vec3 p) {
  float angle = atan(p.z, p.x);
  // Petals fade out toward the poles, where the angle around the axis is undefined.
  float ring = smoothstep(0.08, 0.6, length(p.xz));
  float petals = pow(abs(cos(angle * 2.5)), 3.0) * smoothstep(-0.6, 0.9, p.y) * ring;
  float drift = snoise(p * 1.3 + vec3(0.0, uTime * 0.18, 0.0));
  float ripple = snoise(p * 3.1 - uTime * 0.12) * 0.35;
  return petals * 0.42 + (drift + ripple) * 0.16;
}

void main() {
  float displacement = bloom(normal);
  vec3 displaced = position + normal * displacement;

  // Recompute the normal from two nearby points on the displaced surface.
  vec3 axis = abs(normal.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(normal, axis));
  vec3 bitangent = normalize(cross(normal, tangent));
  float e = 0.015;
  vec3 n1 = normalize(normal + tangent * e);
  vec3 n2 = normalize(normal + bitangent * e);
  vec3 p1 = n1 * (1.0 + bloom(n1));
  vec3 p2 = n2 * (1.0 + bloom(n2));
  vec3 recomputed = normalize(cross(p1 - displaced, p2 - displaced));

  vec4 world = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * recomputed);
  vView = normalize(-world.xyz);
  vBloom = displacement;
  gl_Position = projectionMatrix * world;
}
`;

export const bloomFragment = `
uniform vec3 uOrchid;
uniform vec3 uAurora;
uniform vec3 uDeep;
varying vec3 vNormal;
varying vec3 vView;
varying float vBloom;

void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vView)), 2.2);
  vec3 body = mix(uDeep, uOrchid, smoothstep(-0.1, 0.45, vBloom));
  vec3 color = mix(body, uAurora, fresnel * 0.85);
  color += uAurora * pow(fresnel, 4.0) * 0.6;
  gl_FragColor = vec4(color, 0.55 + fresnel * 0.45);
}
`;

export const pollenVertex = `
uniform float uTime;
uniform float uPixelRatio;
attribute float aScale;
varying float vAlpha;

void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.4 + position.x * 2.0) * 0.08;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aScale * uPixelRatio * (9.0 / -view.z);
  vAlpha = 0.35 + 0.65 * aScale;
  gl_Position = projectionMatrix * view;
}
`;

export const pollenFragment = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float glow = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor, glow * vAlpha);
}
`;
