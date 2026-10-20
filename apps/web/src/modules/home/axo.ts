import { axo } from "@orkide/ui/effects/axo";

/**
 * The cover's drawing: Orkide's stack as an exploded isometric (orthographic projection, hidden
 * lines dashed). Pure geometry, shared by the server (the static SVG every visitor gets first)
 * and the browser (`axo-motion.ts`: plotting, orbiting, exploding). Lengths are drawing units.
 */

/** The SVG's coordinate system; the drawing scales with its box. */
export const VIEW = { height: 720, width: 600 } as const;

export interface Camera {
  readonly azimuth: number;
  readonly elevation: number;
  /** Gap between the layers: wider as the page scrolls. */
  readonly gap: number;
}

interface Part {
  /** Balloon number in the parts list (0: the foundation, no balloon). */
  readonly id: number;
  readonly kind: "box" | "cylinder";
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  readonly d: number;
  readonly h: number;
  readonly disks?: number;
  readonly label?: string;
  readonly tiles?: boolean;
  readonly screen?: boolean;
  /** Where its balloon's leader starts. */
  readonly anchor?: readonly [number, number, number];
}

type Point = readonly [x: number, y: number, depth: number];

export interface DrawnPart {
  /** Stable across frames: the part's place in the model (the queue has two trays with one id). */
  readonly key: number;
  readonly id: number;
  readonly depth: number;
  /** Visible faces, filled with the paper so they hide what is behind. */
  readonly fills: readonly { readonly d: string; readonly top: boolean }[];
  /** Visible edges, as one path. */
  readonly edges: string;
  /** Lines drawn on a face: cache tiles, the browser window. */
  readonly deco: string;
  /** Hatched tiles (pages in the cache) and the one red pixel. */
  readonly hatch: string;
  readonly pixel: string;
  /** Lettering on the front face, as an SVG transform. */
  readonly label?: { readonly text: string; readonly transform: string };
}

export interface Balloon {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly bx: number;
  readonly by: number;
}

export interface Drawing {
  /** Parts from the farthest to the nearest. */
  readonly parts: readonly DrawnPart[];
  readonly hidden: string;
  readonly explode: string;
  /** The route of a request, down the stack and into D1. */
  readonly route: string;
  readonly balloons: readonly Balloon[];
  /** Heights of the layers, for the request's pulse. */
  readonly levels: Readonly<Record<"browser" | "edge" | "web" | "api", number>>;
  readonly top: number;
}

const FOUNDATION = 8;

const model = (gap: number) => {
  const api = FOUNDATION + 40 + gap;
  const web = api + 24 + gap;
  const edge = web + 24 + gap;
  const browser = edge + 12 + gap;
  const parts: Part[] = [
    { d: 192, h: FOUNDATION, id: 0, kind: "box", w: 252, x: 0, y: 0, z: 0 },
    {
      anchor: [-66, FOUNDATION + 40, -13],
      d: 54,
      disks: 2,
      h: 40,
      id: 6,
      kind: "cylinder",
      w: 54,
      x: -66,
      y: FOUNDATION,
      z: -40,
    },
    {
      anchor: [39, FOUNDATION + 30, -25],
      d: 46,
      h: 30,
      id: 7,
      kind: "box",
      w: 46,
      x: 16,
      y: FOUNDATION,
      z: -48,
    },
    {
      anchor: [109, FOUNDATION + 23, -17],
      d: 38,
      h: 9,
      id: 8,
      kind: "box",
      w: 54,
      x: 82,
      y: FOUNDATION,
      z: -36,
    },
    {
      d: 38,
      h: 9,
      id: 8,
      kind: "box",
      w: 54,
      x: 82,
      y: FOUNDATION + 14,
      z: -36,
    },
    {
      anchor: [-45, FOUNDATION + 30, 69],
      d: 30,
      h: 30,
      id: 9,
      kind: "box",
      w: 30,
      x: -60,
      y: FOUNDATION,
      z: 54,
    },
    {
      anchor: [107, api + 12, 76],
      d: 152,
      h: 24,
      id: 5,
      kind: "box",
      label: "API · HONO",
      w: 214,
      x: 0,
      y: api,
      z: 0,
    },
    {
      anchor: [-62, api + 24 + gap / 2, 44],
      d: 20,
      h: gap,
      id: 4,
      kind: "cylinder",
      w: 20,
      x: -72,
      y: api + 24,
      z: 44,
    },
    {
      anchor: [107, web + 12, 76],
      d: 152,
      h: 24,
      id: 3,
      kind: "box",
      label: "WEB · ASTRO",
      w: 214,
      x: 0,
      y: web,
      z: 0,
    },
    {
      anchor: [116, edge + 12, 70],
      d: 168,
      h: 12,
      id: 2,
      kind: "box",
      tiles: true,
      w: 232,
      x: 0,
      y: edge,
      z: 0,
    },
    {
      anchor: [80, browser + 8, 50],
      d: 132,
      h: 8,
      id: 1,
      kind: "box",
      screen: true,
      w: 190,
      x: 0,
      y: browser,
      z: 0,
    },
  ];
  return { levels: { api, browser, edge, web }, parts, top: browser + 8 };
};

/* Faces of a box: vertex indices and outward normal. Edges: two vertices and their two faces. */
const FACES = [
  [0, 1, 2, 3, 0, -1, 0],
  [4, 5, 6, 7, 0, 1, 0],
  [0, 1, 5, 4, 0, 0, -1],
  [3, 2, 6, 7, 0, 0, 1],
  [0, 3, 7, 4, -1, 0, 0],
  [1, 2, 6, 5, 1, 0, 0],
] as const;
const EDGES = [
  [0, 1, 0, 2],
  [1, 2, 0, 5],
  [2, 3, 0, 3],
  [3, 0, 0, 4],
  [4, 5, 1, 2],
  [5, 6, 1, 5],
  [6, 7, 1, 3],
  [7, 4, 1, 4],
  [0, 4, 2, 4],
  [1, 5, 2, 5],
  [2, 6, 3, 5],
  [3, 7, 3, 4],
] as const;

const fixed = (value: number) => value.toFixed(1);
/** Points are [x, y] or projected [x, y, depth]: only x and y are drawn. */
const polyline = (points: readonly (readonly number[])[]) =>
  points
    .map(
      ([x = 0, y = 0], index) =>
        `${index === 0 ? "M" : "L"}${fixed(x)} ${fixed(y)}`
    )
    .join("");
const polygon = (points: readonly (readonly number[])[]) =>
  `${polyline(points)}Z`;
const arc = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  steps = 28
) =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / steps;
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)] as const;
  });

/** A camera: projects drawing units to SVG units for one frame. */
const lens = (camera: Camera, scale: number, cx: number, cy: number) => {
  const ca = Math.cos(camera.azimuth);
  const sa = Math.sin(camera.azimuth);
  const ce = Math.cos(camera.elevation);
  const se = Math.sin(camera.elevation);
  const project = (x: number, y: number, z: number): Point => {
    const xr = x * ca - z * sa;
    const zr = x * sa + z * ca;
    return [cx + xr * scale, cy - (y * ce - zr * se) * scale, y * se + zr * ce];
  };
  const facing = (nx: number, ny: number, nz: number) =>
    ny * se + (nx * sa + nz * ca) * ce > 0.0001;
  return { ce, facing, project, se };
};

type Lens = ReturnType<typeof lens>;

const at = (points: readonly Point[], index: number): Point =>
  points[index] ?? [0, 0, 0];

const drawBox = (part: Part, view: Lens) => {
  const { x, y, z, w, d, h } = part;
  const base = [
    [x - w / 2, z - d / 2],
    [x + w / 2, z - d / 2],
    [x + w / 2, z + d / 2],
    [x - w / 2, z + d / 2],
  ] as const;
  const vertices = [
    ...base.map(([px, pz]) => view.project(px, y, pz)),
    ...base.map(([px, pz]) => view.project(px, y + h, pz)),
  ];
  const shown = FACES.map((face) => view.facing(face[4], face[5], face[6]));
  const fills = FACES.filter((_, index) => shown[index]).map((face) => ({
    d: polygon(
      [face[0], face[1], face[2], face[3]].map((i) => at(vertices, i))
    ),
    top: face[5] === 1,
  }));
  const edges: string[] = [];
  const hidden: string[] = [];
  for (const [a, b, faceA, faceB] of EDGES) {
    (shown[faceA] || shown[faceB] ? edges : hidden).push(
      polyline([at(vertices, a), at(vertices, b)])
    );
  }
  const depth = vertices.reduce((sum, point) => sum + point[2], 0) / 8;
  return { depth, edges, fills, frontShown: shown[3] ?? false, hidden };
};

const drawCylinder = (part: Part, view: Lens, scale: number) => {
  const { x, y, z, w, h } = part;
  const radius = w / 2;
  const top = view.project(x, y + h, z);
  const bottom = view.project(x, y, z);
  const rx = radius * scale;
  const ry = radius * view.se * scale;
  const fills = [
    {
      d: polygon([
        ...arc(top[0], top[1], rx, ry, 0, -Math.PI),
        ...arc(bottom[0], bottom[1], rx, ry, Math.PI, 0),
      ]),
      top: false,
    },
  ];
  const edges = [
    polygon(arc(top[0], top[1], rx, ry, 0, Math.PI * 2, 36)),
    polyline([
      [top[0] - rx, top[1]],
      [bottom[0] - rx, bottom[1]],
    ]),
    polyline([
      [top[0] + rx, top[1]],
      [bottom[0] + rx, bottom[1]],
    ]),
    polyline(arc(bottom[0], bottom[1], rx, ry, 0, Math.PI)),
  ];
  const disks = part.disks ?? 0;
  for (let index = 1; index <= disks; index += 1) {
    const [dx, dy] = view.project(x, y + (h * index) / (disks + 1), z);
    edges.push(polyline(arc(dx, dy, rx, ry, 0, Math.PI)));
  }
  const hidden = [
    polyline(arc(bottom[0], bottom[1], rx, ry, Math.PI, Math.PI * 2)),
  ];
  return {
    depth: (top[2] + bottom[2]) / 2,
    edges,
    fills,
    frontShown: false,
    hidden,
  };
};

/** Tiles on the edge cache's top (some hatched: pages it holds), the window on the browser's. */
const decorate = (part: Part, view: Lens) => {
  const deco: string[] = [];
  const hatch: string[] = [];
  let pixel = "";
  const y = part.y + part.h;
  if (part.tiles) {
    const columns = 6;
    const rows = 4;
    const inset = 12;
    const tw = (part.w - inset * 2) / columns;
    const td = (part.d - inset * 2) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x0 = part.x - part.w / 2 + inset + column * tw + 2;
        const z0 = part.z - part.d / 2 + inset + row * td + 2;
        const tile = polygon([
          view.project(x0, y, z0),
          view.project(x0 + tw - 4, y, z0),
          view.project(x0 + tw - 4, y, z0 + td - 4),
          view.project(x0, y, z0 + td - 4),
        ]);
        ((row * columns + column) % 7 === 2 ? hatch : deco).push(tile);
      }
    }
  }
  if (part.screen) {
    const corner = (dx: number, dz: number) =>
      view.project(part.x + dx, y, part.z + dz);
    deco.push(
      polygon([
        corner(-82, -56),
        corner(82, -56),
        corner(82, 56),
        corner(-82, 56),
      ]),
      polyline([corner(-82, -42), corner(82, -42)])
    );
    for (const [index, length] of [110, 140, 90].entries()) {
      deco.push(
        polyline([
          corner(-70, -26 + index * 12),
          corner(-70 + length, -26 + index * 12),
        ])
      );
    }
    pixel = polygon([
      corner(40, 26),
      corner(52, 26),
      corner(52, 38),
      corner(40, 38),
    ]);
  }
  return { deco: deco.join(""), hatch: hatch.join(""), pixel };
};

/** Lettering on a box's front face: an affine map from text space onto the face. */
const letter = (part: Part, view: Lens) => {
  if (!part.label) {
    return;
  }
  const x = part.x - part.w / 2 + 12;
  const y = part.y + 8;
  const z = part.z + part.d / 2;
  const origin = view.project(x, y, z);
  const across = view.project(x + 1, y, z);
  const up = view.project(x, y + 1, z);
  const matrix = [
    across[0] - origin[0],
    across[1] - origin[1],
    origin[0] - up[0],
    origin[1] - up[1],
    origin[0],
    origin[1],
  ].map((value) => value.toFixed(3));
  return { text: part.label, transform: `matrix(${matrix.join(" ")})` };
};

/** Balloons in two columns beside the drawing, each above the next, with a leader to its part. */
const place = (
  anchors: readonly { id: number; x: number; y: number }[],
  centre: number
) => {
  const left: Balloon[] = [];
  const right: Balloon[] = [];
  for (const anchor of anchors) {
    const side = anchor.x > centre ? right : left;
    side.push({
      ...anchor,
      bx: anchor.x > centre ? VIEW.width - 30 : 30,
      by: anchor.y,
    });
  }
  const spread = (column: Balloon[]) => {
    column.sort((a, b) => a.y - b.y);
    let previous = 64;
    const placed = column.map((balloon) => {
      const by = Math.max(balloon.y, previous + 30);
      previous = by;
      return { ...balloon, by };
    });
    const overflow = (placed.at(-1)?.by ?? 0) - (VIEW.height - 52);
    return overflow > 0
      ? placed.map((balloon) => ({ ...balloon, by: balloon.by - overflow }))
      : placed;
  };
  return [...spread(left), ...spread(right)];
};

/** The scale that fits the fully exploded drawing in the view, leaving room for balloons. */
const SCALE = (() => {
  const view = lens(
    {
      azimuth: axo.camera.azimuth,
      elevation: axo.camera.elevation,
      gap: axo.gap.max,
    },
    1,
    0,
    0
  );
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const part of model(axo.gap.max).parts) {
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      for (const height of [part.y, part.y + part.h]) {
        const [px, py] = view.project(
          part.x + (dx * part.w) / 2,
          height,
          part.z + (dz * part.d) / 2
        );
        minX = Math.min(minX, px);
        maxX = Math.max(maxX, px);
        minY = Math.min(minY, py);
        maxY = Math.max(maxY, py);
      }
    }
  }
  return Math.min(
    (VIEW.width - 150) / (maxX - minX) / 1.12,
    (VIEW.height - 92) / (maxY - minY)
  );
})();

/** One frame of the drawing for `camera`. */
export const draw = (camera: Camera): Drawing => {
  const { levels, parts, top } = model(camera.gap);
  const probe = lens(camera, SCALE, 0, 0);
  const cx = VIEW.width / 2 + 8;
  const cy =
    VIEW.height / 2 + 18 + (top / 2) * probe.ce * SCALE - 40 * probe.se * SCALE;
  const view = lens(camera, SCALE, cx, cy);
  const hidden: string[] = [];
  const drawn = parts.map((part, key) => {
    const shape =
      part.kind === "box"
        ? drawBox(part, view)
        : drawCylinder(part, view, SCALE);
    hidden.push(...shape.hidden);
    const label = shape.frontShown ? letter(part, view) : undefined;
    return {
      ...decorate(part, view),
      depth: shape.depth,
      edges: shape.edges.join(""),
      fills: shape.fills,
      id: part.id,
      key,
      ...(label ? { label } : {}),
    } satisfies DrawnPart;
  });
  // The service binding sits on the API Worker and under the web Worker: draw it between them.
  const depthOf = (id: number) =>
    drawn.find((part) => part.id === id)?.depth ?? 0;
  const binding = drawn.find((part) => part.id === 4);
  const ordered = drawn
    .map((part) =>
      part === binding
        ? { ...part, depth: (depthOf(5) + depthOf(3)) / 2 }
        : part
    )
    .toSorted((a, b) => a.depth - b.depth);

  const explode: string[] = [];
  for (const [upper, halfWidth, halfDepth, lower] of [
    [levels.browser, 95, 66, levels.edge + 12],
    [levels.edge, 107, 76, levels.web + 24],
    [levels.web, 107, 76, levels.api + 24],
    [levels.api, 107, 76, FOUNDATION],
  ] as const) {
    for (const side of [-1, 1]) {
      explode.push(
        polyline([
          view.project(side * halfWidth, upper, halfDepth),
          view.project(side * halfWidth, lower, halfDepth),
        ])
      );
    }
  }

  const anchors = parts.flatMap((part) => {
    if (!part.anchor) {
      return [];
    }
    const [x, y] = view.project(...part.anchor);
    return [{ id: part.id, x, y }];
  });

  return {
    balloons: place(anchors, cx),
    explode: explode.join(""),
    hidden: hidden.join(""),
    levels,
    parts: ordered,
    route: polyline([
      view.project(104, top + 6, 62),
      view.project(104, FOUNDATION, 62),
      view.project(-40, FOUNDATION, 62),
      view.project(-66, FOUNDATION, -13),
    ]),
    top,
  };
};

/** The drawing at rest: default camera, layers slightly apart. */
export const resting = (): Drawing =>
  draw({
    azimuth: axo.camera.azimuth,
    elevation: axo.camera.elevation,
    gap: axo.gap.rest,
  });
