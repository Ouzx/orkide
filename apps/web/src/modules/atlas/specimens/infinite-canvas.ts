import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "No pages, just a board you pan around. Content lives in space, connected by lines.",
    tr: "Sayfa yok, yalnızca üzerinde gezindiğin bir pano var. İçerik düzlemde yerini alır, çizgilerle birbirine bağlanır.",
  },
  drag: true,
  family: "spatial",
  fit: "strong",
  hint: "drag",
  id: "SP-01",
  name: { en: "Infinite canvas", tr: "Sonsuz tuval" },
  pairs: ["MO-02", "PH-03", "AE-05", "SP-02"],
  prompt:
    "Lay out [subject] as an infinite canvas: content cards placed in 2D space and joined by curved lines, drag to pan with inertia, wheel or pinch to zoom, a minimap, and a “back to center” button. Keep a linear list for screen readers.",
  refs: [
    { label: "tldraw", url: "https://www.tldraw.com/" },
    {
      label: "Awwwards interactive",
      url: "https://www.awwwards.com/inspiration_search/web-interactive/",
    },
  ],
  slug: "infinite-canvas",
  tags: ["pan & zoom", "inertia", "Canvas"],
} satisfies SpecimenInput;

/** The stack as a board, Edge in the middle (offsets in CSS pixels from the board's centre). */
const NODES = [
  { label: "Edge", x: 0, y: 0 },
  { label: "Worker", x: 190, y: -80 },
  { label: "D1", x: -180, y: 70 },
  { label: "R2", x: 130, y: 120 },
  { label: "Queue", x: -100, y: -130 },
  { label: "Cache", x: 350, y: 30 },
  { label: "Browser", x: -350, y: -30 },
  { label: "Pixel", x: 20, y: 230 },
] as const;
const [edge, worker, d1, r2, queue, cache, browser, pixel] = NODES;
const LINKS = [
  [edge, worker],
  [edge, d1],
  [edge, r2],
  [edge, queue],
  [worker, cache],
  [d1, browser],
  [r2, pixel],
  [queue, worker],
] as const;
/** The board repeats every 1000 × 640 px, so panning never runs out. */
const SPAN_X = 1000;
const SPAN_Y = 640;
const DOT_GAP = 22;

/** Drag to pan with inertia; while nobody points, the board drifts on its own. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const font = `600 12px ${fontStack("text")}`;
  let offsetX = 0;
  let offsetY = 0;
  let speedX = 0;
  let speedY = 0;
  let grab: { x: number; y: number } | undefined;
  stage.addEventListener("pointerdown", (event) => {
    grab = { x: event.clientX, y: event.clientY };
    speedX = 0;
    speedY = 0;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!grab) {
      return;
    }
    speedX = event.clientX - grab.x;
    speedY = event.clientY - grab.y;
    offsetX += speedX;
    offsetY += speedY;
    grab = { x: event.clientX, y: event.clientY };
  });
  const release = () => {
    grab = undefined;
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  return (t) => {
    if (!grab) {
      offsetX += speedX;
      offsetY += speedY;
      speedX *= 0.94;
      speedY *= 0.94;
      if (!pointer.inside) {
        offsetX -= 0.25;
        offsetY += Math.sin(t * 0.5) * 0.15;
      }
    }
    const { ctx, width, height } = view;
    ctx.fillStyle = "#E7EDF4";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#A7B4C5";
    const dotX = ((offsetX % DOT_GAP) + DOT_GAP) % DOT_GAP;
    const dotY = ((offsetY % DOT_GAP) + DOT_GAP) % DOT_GAP;
    for (let x = dotX; x < width; x += DOT_GAP) {
      for (let y = dotY; y < height; y += DOT_GAP) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;
    ctx.font = font;
    ctx.textBaseline = "middle";
    const lastColumn = Math.ceil((width - centerX + 450) / SPAN_X);
    const lastRow = Math.ceil((height - centerY + 300) / SPAN_Y);
    for (
      let column = Math.floor((-centerX - 450) / SPAN_X);
      column <= lastColumn;
      column += 1
    ) {
      for (
        let row = Math.floor((-centerY - 300) / SPAN_Y);
        row <= lastRow;
        row += 1
      ) {
        const boardX = centerX + column * SPAN_X;
        const boardY = centerY + row * SPAN_Y;
        ctx.strokeStyle = "#5B6CFF";
        ctx.lineWidth = 1.5;
        for (const [from, to] of LINKS) {
          const middle = boardX + (from.x + to.x) / 2;
          ctx.beginPath();
          ctx.moveTo(boardX + from.x, boardY + from.y);
          ctx.bezierCurveTo(
            middle,
            boardY + from.y,
            middle,
            boardY + to.y,
            boardX + to.x,
            boardY + to.y
          );
          ctx.stroke();
        }
        for (const node of NODES) {
          const dark = node === edge;
          const cardWidth = ctx.measureText(node.label).width + 22;
          const left = boardX + node.x - cardWidth / 2;
          ctx.beginPath();
          ctx.roundRect(left, boardY + node.y - 14, cardWidth, 28, 8);
          ctx.fillStyle = dark ? "#121420" : "#FFFFFF";
          ctx.fill();
          ctx.strokeStyle = "#121420";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = dark ? "#FFFFFF" : "#121420";
          ctx.fillText(node.label, left + 11, boardY + node.y + 1);
        }
      }
    }
  };
};
