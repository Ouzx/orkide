/**
 * A project's plate: a technical drawing generated from its slug (a truss, a floor plan, a flange
 * or a wall section), so every project has its own artwork without an image. Pure and seeded: the
 * same slug always draws the same plate, on the server and in the admin.
 */

import { seeded } from "@/shared/lib/random.ts";

export type Shape =
  | {
      readonly kind: "line";
      readonly d: string;
      readonly width: number;
      readonly tone?: "2" | "3" | "mark";
      readonly dash?: string;
    }
  | {
      readonly kind: "wash";
      readonly d: string;
      readonly fill: "hatch" | "paper" | "dots";
    }
  | {
      readonly kind: "text";
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly anchor: "start" | "middle";
      readonly tone?: "mark" | "ink";
      readonly rotate?: number;
    };

export interface Plate {
  readonly width: number;
  readonly height: number;
  readonly shapes: readonly Shape[];
}

type Pt = readonly [number, number];
type Random = () => number;

const f = (value: number) => value.toFixed(1);
const path = (points: readonly Pt[], close = false) =>
  `${points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${f(x)} ${f(y)}`).join("")}${close ? "Z" : ""}`;
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
const circle = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0`;
const arc = (cx: number, cy: number, r: number, from: number, to: number) => {
  const steps = Math.max(10, Math.ceil((Math.abs(to - from) * r) / 4));
  return path(
    Array.from({ length: steps + 1 }, (_, i) => {
      const angle = from + ((to - from) * i) / steps;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
    })
  );
};

/** A drawing under construction: shapes in plotting order. */
class Sheet {
  readonly shapes: Shape[] = [];

  line(d: string, width = 1.2, tone?: "2" | "3" | "mark", dash?: string): this {
    this.shapes.push({
      d,
      kind: "line",
      width,
      ...(tone ? { tone } : {}),
      ...(dash ? { dash } : {}),
    });
    return this;
  }

  wash(d: string, fill: "hatch" | "paper" | "dots" = "hatch"): this {
    this.shapes.push({ d, fill, kind: "wash" });
    return this;
  }

  text(
    x: number,
    y: number,
    text: string,
    options: {
      anchor?: "start" | "middle";
      tone?: "mark" | "ink";
      rotate?: number;
    } = {}
  ): this {
    this.shapes.push({
      anchor: options.anchor ?? "middle",
      kind: "text",
      text,
      x,
      y,
      ...(options.tone ? { tone: options.tone } : {}),
      ...(options.rotate ? { rotate: options.rotate } : {}),
    });
    return this;
  }

  /** A dimension along x: extension lines, architect's ticks, the value above. */
  dimX(xa: number, xb: number, y: number, label: string): this {
    this.line(
      path([
        [xa, y - 9],
        [xa, y + 5],
      ]),
      1,
      "2"
    )
      .line(
        path([
          [xb, y - 9],
          [xb, y + 5],
        ]),
        1,
        "2"
      )
      .line(
        path([
          [xa - 6, y],
          [xb + 6, y],
        ]),
        1,
        "2"
      )
      .line(
        path([
          [xa - 4, y + 4],
          [xa + 4, y - 4],
        ]),
        1.5,
        "2"
      )
      .line(
        path([
          [xb - 4, y + 4],
          [xb + 4, y - 4],
        ]),
        1.5,
        "2"
      );
    return this.text((xa + xb) / 2, y - 5, label);
  }

  /** A dimension along y, its value turned with the line. */
  dimY(x: number, ya: number, yb: number, label: string): this {
    this.line(
      path([
        [x - 5, ya],
        [x + 9, ya],
      ]),
      1,
      "2"
    )
      .line(
        path([
          [x - 5, yb],
          [x + 9, yb],
        ]),
        1,
        "2"
      )
      .line(
        path([
          [x, ya - 5],
          [x, yb + 5],
        ]),
        1,
        "2"
      )
      .line(
        path([
          [x - 4, ya + 4],
          [x + 4, ya - 4],
        ]),
        1.5,
        "2"
      )
      .line(
        path([
          [x - 4, yb + 4],
          [x + 4, yb - 4],
        ]),
        1.5,
        "2"
      );
    return this.text(x + 6, (ya + yb) / 2, label, { rotate: -90 });
  }
}

const CENTRE = "14 4 3 4";

const truss = (w: number, h: number, random: Random): Shape[] => {
  const s = new Sheet();
  const ground = h * 0.78;
  const x0 = w * 0.1;
  const x1 = w * 0.9;
  const bottom = h * 0.6;
  const top = h * 0.28;
  const panels = [6, 8, 10][Math.floor(random() * 3)] ?? 8;
  const pw = (x1 - x0) / panels;
  const arched = random() > 0.45;
  const chordY = (i: number) => {
    if (arched) {
      return bottom - (bottom - top) * Math.sin((Math.PI * i) / panels);
    }
    return i === 0 || i === panels ? bottom : top;
  };
  s.line(
    path([
      [w * 0.04, ground],
      [w * 0.96, ground],
    ]),
    1.6
  ).wash(path(rect(w * 0.04, ground, w * 0.96, ground + 12), true));
  s.line(
    path(
      [
        [x0, bottom],
        [x0 - 12, ground],
        [x0 + 12, ground],
      ],
      true
    ),
    1.4
  ).line(
    path(
      [
        [x1, bottom],
        [x1 - 12, ground - 8],
        [x1 + 12, ground - 8],
      ],
      true
    ),
    1.4
  );
  s.line(circle(x1 - 6, ground - 4, 3.6), 1.1).line(
    circle(x1 + 6, ground - 4, 3.6),
    1.1
  );
  const lower: Pt[] = [];
  const upper: Pt[] = [];
  for (let i = 0; i <= panels; i += 1) {
    lower.push([x0 + i * pw, bottom]);
    upper.push([x0 + i * pw, chordY(i)]);
  }
  s.line(path(lower), 2.2).line(path(upper), 2.2);
  for (let i = 1; i < panels; i += 1) {
    s.line(
      path([
        [x0 + i * pw, bottom],
        [x0 + i * pw, chordY(i)],
      ])
    );
  }
  for (let i = 0; i < panels; i += 1) {
    s.line(
      path(
        i < panels / 2
          ? [
              [x0 + i * pw, chordY(i)],
              [x0 + (i + 1) * pw, bottom],
            ]
          : [
              [x0 + i * pw, bottom],
              [x0 + (i + 1) * pw, chordY(i + 1)],
            ]
      )
    );
  }
  for (let i = 0; i <= panels; i += 1) {
    s.line(circle(x0 + i * pw, bottom, 2.6), 1.1);
    if (i > 0 && i < panels) {
      s.line(circle(x0 + i * pw, chordY(i), 2.6), 1.1);
    }
  }
  for (const i of [panels / 2 - 2, panels / 2, panels / 2 + 2]) {
    const x = x0 + i * pw;
    const y = chordY(i);
    s.line(
      path([
        [x, y - 36],
        [x, y - 7],
      ]),
      1.5,
      "mark"
    ).line(
      path([
        [x - 4.5, y - 14],
        [x, y - 7],
        [x + 4.5, y - 14],
      ]),
      1.5,
      "mark"
    );
  }
  s.text(
    x0 + (panels / 2) * pw + 8,
    chordY(panels / 2) - 40,
    `P = ${(12 + random() * 8).toFixed(1)} kN`,
    {
      anchor: "start",
      tone: "mark",
    }
  );
  s.line(
    path([
      [w / 2, h * 0.1],
      [w / 2, ground + 26],
    ]),
    1,
    "3",
    CENTRE
  );
  s.dimX(
    x0,
    x1,
    ground + 30,
    `${panels} × ${(3.5 + random() * 1.5).toFixed(1)} m`
  );
  return s.shapes;
};

interface Room {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const plan = (w: number, h: number, random: Random): Shape[] => {
  const s = new Sheet();
  const t = Math.max(5, w * 0.014);
  const X0 = w * 0.1;
  const Y0 = h * 0.17;
  const X1 = w * 0.88;
  const Y1 = h * 0.86;
  s.line(path(rect(X0, Y0, X1, Y1), true), 1.8)
    .line(path(rect(X0 + t, Y0 + t, X1 - t, Y1 - t), true), 1.1)
    .wash(
      `${path(rect(X0, Y0, X1, Y1), true)}${path(rect(X0 + t, Y0 + t, X1 - t, Y1 - t), true)}`
    );
  const rooms: Room[] = [];
  const walls: [vertical: boolean, at: number, from: number, to: number][] = [];
  const split = (room: Room, depth: number) => {
    const rw = room.x1 - room.x0;
    const rh = room.y1 - room.y0;
    if (
      depth >= 3 ||
      (rw < w * 0.24 && rh < h * 0.3) ||
      (depth >= 2 && random() < 0.4)
    ) {
      rooms.push(room);
      return;
    }
    let vertical = random() > 0.5;
    if (rw > rh * 1.15) {
      vertical = true;
    } else if (rh > rw * 1.15) {
      vertical = false;
    }
    if (vertical) {
      const at = room.x0 + rw * (0.38 + random() * 0.24);
      walls.push([true, at, room.y0, room.y1]);
      split({ ...room, x1: at - t / 2 }, depth + 1);
      split({ ...room, x0: at + t / 2 }, depth + 1);
    } else {
      const at = room.y0 + rh * (0.38 + random() * 0.24);
      walls.push([false, at, room.x0, room.x1]);
      split({ ...room, y1: at - t / 2 }, depth + 1);
      split({ ...room, y0: at + t / 2 }, depth + 1);
    }
  };
  split({ x0: X0 + t, x1: X1 - t, y0: Y0 + t, y1: Y1 - t }, 0);
  const door = Math.max(18, w * 0.05);
  for (const [vertical, at, from, to] of walls) {
    const centre = from + (to - from) * (0.3 + random() * 0.4);
    for (const [a, b] of [
      [from, centre - door / 2],
      [centre + door / 2, to],
    ] as const) {
      if (vertical) {
        s.line(
          path([
            [at - t / 2, a],
            [at - t / 2, b],
          ]),
          1.1
        )
          .line(
            path([
              [at + t / 2, a],
              [at + t / 2, b],
            ]),
            1.1
          )
          .wash(path(rect(at - t / 2, a, at + t / 2, b), true));
      } else {
        s.line(
          path([
            [a, at - t / 2],
            [b, at - t / 2],
          ]),
          1.1
        )
          .line(
            path([
              [a, at + t / 2],
              [b, at + t / 2],
            ]),
            1.1
          )
          .wash(path(rect(a, at - t / 2, b, at + t / 2), true));
      }
    }
    if (vertical) {
      s.line(
        path([
          [at + t / 2, centre - door / 2],
          [at + t / 2 + door, centre - door / 2],
        ])
      ).line(
        arc(at + t / 2, centre - door / 2, door, 0, Math.PI / 2),
        0.9,
        "2"
      );
    } else {
      s.line(
        path([
          [centre - door / 2, at + t / 2],
          [centre - door / 2, at + t / 2 + door],
        ])
      ).line(
        arc(centre - door / 2, at + t / 2, door, Math.PI / 2, 0),
        0.9,
        "2"
      );
    }
  }
  const windows = 2 + Math.floor(random() * 2);
  for (let i = 0; i < windows; i += 1) {
    const wx = X0 + (X1 - X0) * ((i + 0.6 + random() * 0.3) / (windows + 0.4));
    const ww = Math.max(20, w * 0.06);
    for (const y of [Y0, Y1 - t]) {
      s.wash(
        path(rect(wx - ww / 2, y - 0.5, wx + ww / 2, y + t + 0.5), true),
        "paper"
      )
        .line(
          path([
            [wx - ww / 2, y],
            [wx + ww / 2, y],
          ]),
          1
        )
        .line(
          path([
            [wx - ww / 2, y + t / 2],
            [wx + ww / 2, y + t / 2],
          ]),
          0.8
        )
        .line(
          path([
            [wx - ww / 2, y + t],
            [wx + ww / 2, y + t],
          ]),
          1
        )
        .line(
          path([
            [wx - ww / 2, y],
            [wx - ww / 2, y + t],
          ]),
          1
        )
        .line(
          path([
            [wx + ww / 2, y],
            [wx + ww / 2, y + t],
          ]),
          1
        );
    }
  }
  for (const [index, room] of rooms.entries()) {
    const cx = (room.x0 + room.x1) / 2;
    const cy = (room.y0 + room.y1) / 2;
    s.line(circle(cx, cy - 3, 9), 0.9, "3").text(
      cx,
      cy + 0.5,
      String(index + 1).padStart(2, "0"),
      {
        tone: "ink",
      }
    );
  }
  s.dimX(X0, X1, Y0 - 16, `${(9 + random() * 5).toFixed(2)} m`);
  const nx = X1 + (w - X1) / 2;
  const ny = Y1 - 16;
  s.line(circle(nx, ny, 10), 1, "2")
    .line(
      path([
        [nx, ny + 10],
        [nx, ny - 16],
      ]),
      1.3,
      "mark"
    )
    .line(
      path([
        [nx - 4, ny - 9],
        [nx, ny - 16],
        [nx + 4, ny - 9],
      ]),
      1.3,
      "mark"
    )
    .text(nx, ny - 20, "N", { tone: "mark" });
  return s.shapes;
};

const flange = (w: number, h: number, random: Random): Shape[] => {
  const s = new Sheet();
  const cx = w * 0.36;
  const cy = h * 0.53;
  const R = Math.min(w * 0.25, h * 0.36);
  const holes = [6, 8, 10][Math.floor(random() * 3)] ?? 8;
  s.line(
    path([
      [cx - R - 20, cy],
      [cx + R + 20, cy],
    ]),
    1,
    "3",
    CENTRE
  ).line(
    path([
      [cx, cy - R - 20],
      [cx, cy + R + 20],
    ]),
    1,
    "3",
    CENTRE
  );
  s.line(circle(cx, cy, R), 2)
    .line(circle(cx, cy, R * 0.5), 1.3)
    .line(circle(cx, cy, R * 0.28), 1.6)
    .line(
      path(
        rect(
          cx - R * 0.06,
          cy - R * 0.28 - R * 0.08,
          cx + R * 0.06,
          cy - R * 0.28 + 2
        ),
        true
      ),
      1.3
    )
    .line(circle(cx, cy, R * 0.75), 1, "2", "10 3 2 3");
  for (let i = 0; i < holes; i += 1) {
    const angle = (i / holes) * Math.PI * 2 + Math.PI / holes;
    const hx = cx + Math.cos(angle) * R * 0.75;
    const hy = cy + Math.sin(angle) * R * 0.75;
    s.line(circle(hx, hy, R * 0.075), 1.3)
      .line(
        path([
          [hx - 7, hy],
          [hx + 7, hy],
        ]),
        0.8,
        "3"
      )
      .line(
        path([
          [hx, hy - 7],
          [hx, hy + 7],
        ]),
        0.8,
        "3"
      );
  }
  const lx = cx + R * Math.cos(-Math.PI / 4);
  const ly = cy + R * Math.sin(-Math.PI / 4);
  s.line(
    path([
      [lx, ly],
      [lx + 22, ly - 22],
      [lx + 62, ly - 22],
    ]),
    1,
    "mark"
  ).text(lx + 26, ly - 26, `Ø${Math.round(140 + random() * 120)}`, {
    anchor: "start",
    tone: "mark",
  });
  const sx = w * 0.72;
  const plate = R * 0.2;
  const hubWidth = R * 0.46;
  const hub = R * 0.5;
  const bore = R * 0.28;
  const upper: Pt[] = [
    [sx, cy - R],
    [sx + plate, cy - R],
    [sx + plate, cy - hub],
    [sx + hubWidth, cy - hub],
    [sx + hubWidth, cy - bore],
    [sx, cy - bore],
  ];
  const lower = upper.map(([x, y]) => [x, cy + (cy - y)] as const);
  s.line(path(upper, true), 1.6)
    .wash(path(upper, true))
    .line(path(lower, true), 1.6)
    .wash(path(lower, true))
    .line(
      path([
        [sx, cy - bore],
        [sx + hubWidth, cy - bore],
      ]),
      1
    )
    .line(
      path([
        [sx - 14, cy],
        [sx + hubWidth + 14, cy],
      ]),
      1,
      "3",
      CENTRE
    )
    .text(sx + hubWidth / 2, cy - R - 12, "A–A", { tone: "ink" })
    .dimY(sx + hubWidth + 26, cy - R, cy + R, `${Math.round(R * 2)}`);
  return s.shapes;
};

/** The zigzag of a break line: flat at both ends, alternating between. */
const breakOffset = (i: number) => {
  if (i === 0 || i === 10) {
    return 0;
  }
  return i % 2 ? 5 : -5;
};

const section = (w: number, h: number, random: Random): Shape[] => {
  const s = new Sheet();
  const x0 = w * 0.12;
  const x1 = w * 0.74;
  // Layers by their hatch (drawings are not translated, so no material names).
  const layers = [
    [0.05, "lines"],
    [0.09, "dots"],
    [0.15, "zigzag"],
    [0.2, "concrete"],
    [0.12, "gravel"],
    [0.2, "earth"],
  ] as const;
  const total = h * 0.66;
  const sum = layers.reduce((acc, layer) => acc + layer[0], 0);
  let y = h * 0.18;
  s.line(
    path([
      [x0 - 18, y],
      [x0 - 4, y],
    ]),
    1.2,
    "mark"
  )
    .line(
      path(
        [
          [x0 - 13, y - 9],
          [x0 - 4, y],
          [x0 + 5, y - 9],
        ],
        true
      ),
      1.2,
      "mark"
    )
    .text(x0 - 8, y - 13, "±0.00", { tone: "mark" });
  for (const [share, fill] of layers) {
    const lh = (total * share) / sum;
    const y1 = y + lh;
    s.line(path(rect(x0, y, x1, y1), true), 1.3);
    if (fill === "lines") {
      for (let yy = y + 2.5; yy < y1; yy += 2.5) {
        s.line(
          path([
            [x0, yy],
            [x1, yy],
          ]),
          0.6,
          "3"
        );
      }
    }
    if (fill === "dots" || fill === "concrete") {
      const count = Math.round(
        (x1 - x0) * lh * (fill === "dots" ? 0.05 : 0.03)
      );
      let dots = "";
      for (let i = 0; i < count; i += 1) {
        const dx = x0 + random() * (x1 - x0);
        const dy = y + 1.5 + random() * (lh - 3);
        dots += `M${f(dx)} ${f(dy)}h1.3v1.3h-1.3Z`;
      }
      s.wash(dots, "dots");
    }
    if (fill === "concrete") {
      for (let i = 0; i < (x1 - x0) / 24; i += 1) {
        const tx = x0 + 6 + random() * (x1 - x0 - 12);
        const ty = y + 5 + random() * (lh - 10);
        const size = 2.5 + random() * 2.5;
        const turn = random() * 6;
        s.line(
          path(
            [0, 2.1, 4.2].map(
              (step) =>
                [
                  tx + Math.cos(turn + step) * size,
                  ty + Math.sin(turn + step) * size,
                ] as const
            ),
            true
          ),
          0.8,
          "2"
        );
      }
    }
    if (fill === "zigzag") {
      const step = lh * 0.5;
      const points: Pt[] = [];
      for (let i = 0, xx = x0; xx <= x1; i += 1, xx += step) {
        points.push([xx, i % 2 ? y + 3 : y1 - 3]);
      }
      s.line(path(points), 1, "2");
    }
    if (fill === "gravel") {
      for (let i = 0; i < (x1 - x0) / 9; i += 1) {
        s.line(
          circle(
            x0 + 4 + random() * (x1 - x0 - 8),
            y + 3 + random() * (lh - 6),
            1.4 + random() * 2.4
          ),
          0.8,
          "2"
        );
      }
    }
    if (fill === "earth") {
      s.wash(path(rect(x0, y, x1, y1), true));
    }
    s.line(
      path([
        [x1, y],
        [x1 + 14, y],
      ]),
      0.9,
      "2"
    ).text(x1 + 20, y + lh / 2 + 3.5, String(Math.round(lh * 4)), {
      anchor: "start",
    });
    y = y1;
  }
  const brk: Pt[] = [];
  for (let i = 0; i <= 10; i += 1) {
    brk.push([x1 + breakOffset(i), h * 0.18 + (total * i) / 10]);
  }
  s.line(path(brk), 1, "2").dimY(
    x0 - 28,
    h * 0.18,
    h * 0.18 + total,
    `${Math.round(total * 4)}`
  );
  return s.shapes;
};

const kinds = { flange, plan, section, truss } as const;
export type PlateKind = keyof typeof kinds;

/** The plate for `seed` (a slug). `kind` picks the drawing; without it the seed does. */
export const plateArt = (
  seed: string,
  {
    width = 400,
    height = 300,
    kind,
  }: { width?: number; height?: number; kind?: PlateKind } = {}
): Plate => {
  const random = seeded(seed);
  const names = Object.keys(kinds) as PlateKind[];
  const chosen = kind ?? names[Math.floor(random() * names.length)] ?? "truss";
  return { height, shapes: kinds[chosen](width, height, random), width };
};
