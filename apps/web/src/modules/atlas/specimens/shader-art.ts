import type { SpecimenInput } from "@orkide/validators/atlas";

import { shader } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "heavy",
  desc: {
    en: "A GPU fragment shader paints a living, domain-warped noise field. The cursor steers it.",
    tr: "GPU'da çalışan bir fragment shader, domain warping ile bükülmüş canlı bir gürültü alanı boyar. Akışı imleç yönlendirir.",
  },
  family: "generative",
  fit: "tune",
  hint: "move",
  id: "GN-01",
  name: { en: "Shader art", tr: "Shader sanatı" },
  pairs: ["AE-04", "MO-03", "SN-03", "SP-04"],
  prompt:
    "Create a full-bleed WebGL fragment shader background for [subject]: domain-warped fbm noise in [palette], drifting slowly and reacting to cursor position. Cap DPR at 1.5, pause offscreen, and show a static gradient when WebGL is unavailable.",
  refs: [
    { label: "Shadertoy", url: "https://www.shadertoy.com/" },
    { label: "The Book of Shaders", url: "https://thebookofshaders.com/" },
  ],
  slug: "shader-art",
  tags: ["GLSL", "WebGL", "fbm noise"],
} satisfies SpecimenInput;

/** Value noise summed in five octaves (fbm); two fbm layers warp the domain of a third. */
const FRAGMENT = `
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.,a=.5;
  for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}
  return v;
}
void main(){
  vec2 uv=gl_FragCoord.xy/r.y;
  vec2 q=vec2(fbm(uv*2.+t*.06),fbm(uv*2.+vec2(5.2,1.3)-t*.05));
  float f=fbm(uv*2.+q*2.6+(m-.5)*1.2);
  vec3 c=mix(vec3(.04,.05,.18),vec3(1.,.36,.12),smoothstep(.3,.8,f));
  c=mix(c,vec3(.55,.75,1.),smoothstep(.5,.95,q.x)*.65);
  c+=vec3(.9,.9,.6)*smoothstep(.78,.95,f)*.4;
  gl_FragColor=vec4(c,1.);
}`;

/** A warped noise field drifting from navy to ember and ice; the pointer shifts the warp. */
export const preview: Preview = (stage) => shader(stage, FRAGMENT);
