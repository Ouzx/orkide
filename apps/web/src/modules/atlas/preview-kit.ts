/**
 * Helpers for specimen previews (`specimens/<slug>.ts`). A preview fills its stage and returns the
 * frame function the atlas calls on the page's one animation loop while the stage is on screen
 * (or a few times in a row for a still, when motion is off). A preview animated by CSS alone
 * returns nothing. Previews touch the DOM only when called, never at module scope.
 */

/** Draws the preview at `t` seconds since the atlas started. */
export type Frame = (t: number) => void;

/** Fills a stage; returns its frame function when script animates it. */
export type Preview = (stage: HTMLElement) => Frame | undefined;

export interface Point {
  x: number;
  y: number;
}

export interface Tracked extends Point {
  /** Whether the pointer is over the stage. */
  inside: boolean;
  /** The pointer, or the idle path while it is away. */
  at: (t: number) => Point;
}

/** An unhurried loop for previews that react to the pointer, so they move when nobody points. */
export const idle = (t: number): Point => ({
  x: 0.5 + 0.3 * Math.cos(t * 0.7),
  y: 0.5 + 0.25 * Math.sin(t * 1.1),
});

/** Where the pointer is over a stage, from 0 to 1 on each axis (top left is 0, 0). */
export const track = (stage: HTMLElement): Tracked => {
  const tracked: Tracked = {
    at: (t) => (tracked.inside ? { x: tracked.x, y: tracked.y } : idle(t)),
    inside: false,
    x: 0.5,
    y: 0.5,
  };
  stage.addEventListener(
    "pointermove",
    (event) => {
      const box = stage.getBoundingClientRect();
      tracked.x = (event.clientX - box.left) / box.width;
      tracked.y = (event.clientY - box.top) / box.height;
      tracked.inside = true;
    },
    { passive: true }
  );
  stage.addEventListener("pointerleave", () => {
    tracked.inside = false;
  });
  return tracked;
};

/** A pointer event's position in the stage, in CSS pixels. */
export const localPoint = (stage: HTMLElement, event: PointerEvent): Point => {
  const box = stage.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
};

export interface View2d {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  /** The stage's size in CSS pixels. */
  width: number;
  height: number;
  /** Called after every resize (the canvas is cleared by it). */
  onResize?: () => void;
}

/** Keeps a canvas the size of its stage, at the device's pixel ratio up to `maxRatio`. */
const fitCanvas = (
  stage: HTMLElement,
  canvas: HTMLCanvasElement,
  maxRatio: number,
  fitted: (ratio: number, width: number, height: number) => void
) => {
  let fittedTo = "";
  const fit = () => {
    const box = stage.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, maxRatio);
    const width = Math.max(1, box.width);
    const height = Math.max(1, box.height);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    // Setting a canvas's size clears it, even to the same size: only refit a real change (the
    // observer's first call repeats the size measured here).
    if (`${pixelWidth}x${pixelHeight}` === fittedTo) {
      return;
    }
    fittedTo = `${pixelWidth}x${pixelHeight}`;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    fitted(ratio, width, height);
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(stage);
};

/** A 2D canvas filling the stage (pixel ratio up to 2), drawn in CSS pixels. */
export const canvas2d = (stage: HTMLElement): View2d => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D is unavailable");
  }
  stage.append(canvas);
  const view: View2d = { canvas, ctx, height: 1, width: 1 };
  fitCanvas(stage, canvas, 2, (ratio, width, height) => {
    view.width = width;
    view.height = height;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    view.onResize?.();
  });
  return view;
};

const VERTEX = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const UNIFORMS =
  "precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;";

/**
 * A full-stage fragment shader (WebGL 1, pixel ratio up to 1.5). `fragment` sees `r` (the size in
 * device pixels), `t` (seconds) and `m` (the pointer from 0 to 1, y up). Throws where WebGL or the
 * shader is unavailable; the atlas then shows the stage's fallback.
 */
export const shader = (stage: HTMLElement, fragment: string): Frame => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { antialias: false });
  if (!gl) {
    throw new Error("WebGL is unavailable");
  }
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, VERTEX],
    [gl.FRAGMENT_SHADER, UNIFORMS + fragment],
  ] as const) {
    const part = gl.createShader(type);
    if (!part) {
      throw new Error("WebGL could not create a shader");
    }
    gl.shaderSource(part, source);
    gl.compileShader(part);
    gl.attachShader(program, part);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("The shader did not compile");
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "r");
  const time = gl.getUniformLocation(program, "t");
  const mouse = gl.getUniformLocation(program, "m");
  stage.append(canvas);
  fitCanvas(stage, canvas, 1.5, () => {
    gl.viewport(0, 0, canvas.width, canvas.height);
  });
  const pointer = track(stage);
  return (t) => {
    const { x, y } = pointer.at(t);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, t);
    gl.uniform2f(mouse, x, 1 - y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
};

/** The skin's font stack for canvas text: `display` and `text` (Archivo) or `mono` (Chivo Mono). */
export const fontStack = (family: "display" | "mono" | "text"): string =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--o-font-${family}`)
    .trim() || "sans-serif";

/** A five-pointed star as the current path. */
export const starPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number
): void => {
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const reach = point % 2 === 0 ? radius : radius * 0.45;
    const turn = angle + (point * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(turn) * reach, y + Math.sin(turn) * reach);
  }
  ctx.closePath();
};
