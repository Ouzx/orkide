/**
 * The exploded drawing of a mix (`MixAnatomy.astro`): four slabs in isometric projection, from the
 * content at the bottom to the hero on top, each with its own marking and a balloon on the right.
 * Drawn once on the server; the drawing is a pure function of these numbers.
 */
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const CENTRE_X = 262;
const BALLOON_X = 552;

type Point = readonly [number, number];

/** A polygon point (`x,y`) and a path coordinate (`x y`). */
const point = ([x, y]: Point) => `${x.toFixed(1)},${y.toFixed(1)}`;
const xy = ([x, y]: Point) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const line = (from: Point, to: Point) => `M${xy(from)} L${xy(to)}`;

/** A square slab: its top face centred at (CENTRE_X, y), `size` on a side, `height` thick. */
const slab = (y: number, size: number, height: number) => {
  // A point on the top face, from the plan (x right, y towards the viewer), and its drop.
  const at = (px: number, py: number, drop = 0): Point => [
    CENTRE_X + (px - py) * COS,
    y + (px + py) * SIN + drop,
  ];
  const half = size / 2;
  const back = at(-half, -half);
  const right = at(half, -half);
  const front = at(half, half);
  const left = at(-half, half);
  const rightLow = at(half, -half, height);
  const frontLow = at(half, half, height);
  const leftLow = at(-half, half, height);
  return {
    at,
    corner: right,
    // The top face, then the two visible sides, then the front vertical.
    edge: `M${xy(back)} L${xy(right)} L${xy(front)} L${xy(left)} Z M${xy(right)} L${xy(rightLow)} L${xy(frontLow)} L${xy(leftLow)} L${xy(left)} ${line(front, frontLow)}`,
    half,
    label: at(0, half - 16),
    left: [left, front, frontLow, leftLow].map(point).join(" "),
    right: [right, front, frontLow, rightLow].map(point).join(" "),
    top: [back, right, front, left].map(point).join(" "),
  };
};

export interface Layer {
  /** 1 hero, 2 support, 3 aesthetic, 4 content: the parts list's numbers. */
  readonly part: 1 | 2 | 3 | 4;
  readonly top: string;
  readonly left: string;
  readonly right: string;
  readonly edge: string;
  /** Where the label sits on the top face (rotated onto the face by the caller). */
  readonly label: Point;
  /** Markings drawn on the top face. */
  readonly deco: readonly string[];
  /** A hatched area on the top face. */
  readonly hatch?: string;
  /** The balloon: its anchor on the slab and its bubble at the right edge. */
  readonly balloon: { readonly anchor: Point; readonly bubble: Point };
}

const hero = slab(118, 120, 14);
const support = slab(200, 180, 10);
const aesthetic = slab(280, 230, 10);
const content = slab(360, 270, 16);

const layer = (
  part: Layer["part"],
  geometry: ReturnType<typeof slab>,
  deco: readonly string[],
  hatch?: string
): Layer => ({
  balloon: {
    anchor: geometry.corner,
    bubble: [BALLOON_X, geometry.corner[1]],
  },
  deco,
  edge: geometry.edge,
  label: geometry.label,
  left: geometry.left,
  part,
  right: geometry.right,
  top: geometry.top,
  ...(hatch === undefined ? {} : { hatch }),
});

/** Paint order: the content first (furthest back), the hero last. */
export const layers: readonly Layer[] = [
  // The content: a page of text lines, readable without any effect.
  layer(
    4,
    content,
    [-0.3, -0.12, 0.06, 0.24].map((row, index) =>
      line(
        content.at(-content.half * 0.62, content.half * row),
        content.at(
          content.half * (index === 0 ? 0.1 : 0.55),
          content.half * row
        )
      )
    )
  ),
  // The aesthetic: the look that ties everything together, as a hatched skin.
  layer(
    3,
    aesthetic,
    [],
    [
      aesthetic.at(-aesthetic.half * 0.7, -aesthetic.half * 0.7),
      aesthetic.at(aesthetic.half * 0.7, -aesthetic.half * 0.7),
      aesthetic.at(aesthetic.half * 0.7, aesthetic.half * 0.45),
      aesthetic.at(-aesthetic.half * 0.7, aesthetic.half * 0.45),
    ]
      .map(point)
      .join(" ")
  ),
  // Support: flow lines that add depth without competing.
  layer(
    2,
    support,
    [-0.45, -0.15, 0.15].map((row) =>
      line(
        support.at(-support.half * 0.75, support.half * row),
        support.at(support.half * 0.75, support.half * (row + 0.12))
      )
    )
  ),
  // The hero: one spark, the page's idea.
  layer(1, hero, [
    `${line(hero.at(0, -hero.half * 0.5), hero.at(0, hero.half * 0.3))} ${line(hero.at(-hero.half * 0.4, -hero.half * 0.1), hero.at(hero.half * 0.4, -hero.half * 0.1))}`,
  ]),
];

/** The explode axis: through the slabs' centres, from the hero's back corner to the content. */
export const explodeAxis = line([CENTRE_X, 118 - 60], [CENTRE_X, 360]);

/** The matrix that lays text onto a top face, at `at`. */
export const faceMatrix = ([x, y]: Point): string =>
  `matrix(${COS.toFixed(7)} ${SIN} ${(-COS).toFixed(7)} ${SIN} ${x.toFixed(1)} ${y.toFixed(1)})`;
