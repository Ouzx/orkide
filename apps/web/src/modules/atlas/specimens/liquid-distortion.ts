import type { SpecimenInput } from "@orkide/validators/atlas";

import { shader } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "heavy",
  desc: {
    en: "Ripples bend the surface under the cursor, like a finger dragged through water.",
    tr: "Dalgacıklar imlecin altındaki yüzeyi büker; tıpkı suda gezdirilen bir parmak gibi.",
  },
  family: "generative",
  fit: "tune",
  hint: "move",
  id: "GN-02",
  name: { en: "Liquid distortion", tr: "Sıvı distorsiyon" },
  pairs: ["MO-03", "AE-02", "GN-01", "SN-03"],
  prompt:
    "Add a liquid hover distortion to the hero of [subject]: a WebGL plane that ripples outward from the cursor and settles back, with the hero typography or pattern as its texture. Include a non-WebGL fallback.",
  refs: [
    { label: "Codrops demos", url: "https://tympanus.net/codrops/demos/" },
    {
      label: "Shadertoy: ripple",
      url: "https://www.shadertoy.com/results?query=ripple",
    },
  ],
  slug: "liquid-distortion",
  tags: ["WebGL", "displacement", "ripples"],
} satisfies SpecimenInput;

/** A damped sine ring around the pointer displaces the lookup of a striped, lined pattern. */
const FRAGMENT = `
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 a=vec2(r.x/r.y,1.);
  vec2 d=(uv-m)*a;
  float L=length(d)+1e-4;
  float w=sin(L*42.-t*6.)*exp(-L*4.5)*.035;
  uv+=d/L*w;
  float s=step(.5,fract((uv.x*a.x+uv.y)*5.));
  vec3 c=mix(vec3(.98,.84,.18),vec3(.07,.09,.33),s);
  float g=step(.5,fract(uv.y*30.));
  c=mix(c,c*.86,g*.35);
  c+=vec3(1.)*max(w,0.)*7.;
  gl_FragColor=vec4(c,1.);
}`;

/** Yellow and navy stripes that ripple out from the pointer, with highlights on the crests. */
export const preview: Preview = (stage) => shader(stage, FRAGMENT);
