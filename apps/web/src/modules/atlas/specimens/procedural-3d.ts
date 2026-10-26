import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "heavy",
  desc: {
    en: "Geometry built from math, spinning over a synthwave floor. The cursor steers the camera.",
    tr: "Matematikle kurulmuş bir geometri, synthwave bir zeminin üzerinde döner. Kamerayı imleç yönlendirir.",
  },
  family: "spatial",
  fit: "good",
  hint: "move",
  id: "SP-03",
  name: { en: "Procedural 3D", tr: "Prosedürel 3D" },
  pairs: ["GN-07", "MO-01", "AE-06", "SN-02"],
  prompt:
    "Create a procedural 3D hero for [subject] with Three.js: an object generated from code (no model files), lit and slowly rotating, camera steered by the cursor, light post-processing. Pause offscreen, cap DPR, static poster fallback.",
  refs: [
    { label: "three.js examples", url: "https://threejs.org/examples/" },
    {
      label: "WebGPU samples",
      url: "https://webgpu.github.io/webgpu-samples/",
    },
  ],
  slug: "procedural-3d",
  tags: ["Three.js", "WebGPU", "procedural meshes"],
} satisfies SpecimenInput;

type Vertex = readonly [number, number, number];

const PHI = (1 + Math.sqrt(5)) / 2;
/** An icosahedron's twelve corners; its edges join the corners exactly 2 apart. */
const CORNERS: readonly Vertex[] = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

/** A wireframe icosahedron over a scrolling synthwave grid; the pointer turns it. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const edges: (readonly [Vertex, Vertex])[] = [];
  for (const [index, a] of CORNERS.entries()) {
    for (const b of CORNERS.slice(index + 1)) {
      if (
        Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2) < 0.01
      ) {
        edges.push([a, b]);
      }
    }
  }
  return (t) => {
    const { ctx, width, height } = view;
    const aim = pointer.at(t);
    const yaw = t * 0.5 + (aim.x - 0.5) * 2;
    const pitch = (aim.y - 0.5) * 1.5 + t * 0.2;
    const size = Math.min(width, height) * 0.19;
    const project = ([x, y, z]: Vertex) => {
      const turnedX = x * Math.cos(yaw) - z * Math.sin(yaw);
      const turnedZ = x * Math.sin(yaw) + z * Math.cos(yaw);
      const tiltedY = y * Math.cos(pitch) - turnedZ * Math.sin(pitch);
      const depth = y * Math.sin(pitch) + turnedZ * Math.cos(pitch);
      const scale = (4 / (4 + depth)) * size;
      return {
        depth,
        x: width / 2 + turnedX * scale,
        y: height * 0.42 + tiltedY * scale,
      };
    };
    ctx.fillStyle = "#05060B";
    ctx.fillRect(0, 0, width, height);
    const horizon = height * 0.66;
    ctx.strokeStyle = "rgba(255,60,200,.45)";
    ctx.lineWidth = 1;
    for (let line = 0; line < 12; line += 1) {
      const z = (line + ((t * 0.8) % 1)) / 12;
      const y = horizon + (height - horizon) * z * z;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let ray = -8; ray <= 8; ray += 1) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + ray * 18, horizon);
      ctx.lineTo(width / 2 + ray * width * 0.16, height);
      ctx.stroke();
    }
    ctx.lineWidth = 1.6;
    for (const [from, to] of edges) {
      const a = project(from);
      const b = project(to);
      const near = 1 - ((a.depth + b.depth) / 2 + PHI) / (2 * PHI);
      ctx.strokeStyle = `rgba(110,220,255,${0.25 + near * 0.75})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.fillStyle = "#FF8A3D";
    for (const corner of CORNERS) {
      const point = project(corner);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };
};
