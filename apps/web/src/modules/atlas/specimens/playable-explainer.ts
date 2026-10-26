import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "A concept you poke instead of read. Change the stiffness and watch the spring answer live.",
    tr: "Okunmak yerine kurcalanan bir kavram. Sertliği değiştirdiğinde yay anında tepki verir.",
  },
  family: "play",
  fit: "strong",
  hint: "slider",
  id: "PH-03",
  name: { en: "Playable explainer", tr: "Oynanabilir anlatım" },
  pairs: ["MO-01", "AE-05", "GN-03", "SP-01"],
  prompt:
    "Explain [concept] as a playable explainer: a live simulation with 2–3 sliders, a plot that updates in real time, and short text beside each step, in the spirit of Bartosz Ciechanowski and Nicky Case. Every number on screen is computed, never faked.",
  refs: [
    { label: "Bartosz Ciechanowski", url: "https://ciechanow.ski/" },
    { label: "Nicky Case", url: "https://ncase.me/" },
    { label: "Explorable Explanations", url: "https://explorabl.es/" },
  ],
  slug: "playable-explainer",
  tags: ["simulation", "sliders", "live plot"],
} satisfies SpecimenInput;

const INK = "#121420";
/** How many past positions the plot keeps. */
const HISTORY = 220;

/** The spring hanging from its bracket, with the mass `x` below its rest point. */
const drawSpring = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  x: number
) => {
  const anchor = width * 0.18;
  const bracket = height * 0.12;
  const mass = bracket + height * 0.4 + x * height * 0.2;
  const coils = 14;
  const reach = mass - 14 - bracket;
  ctx.fillStyle = INK;
  ctx.fillRect(anchor - 24, bracket - 6, 48, 6);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(anchor, bracket);
  for (let coil = 1; coil < coils; coil += 1) {
    ctx.lineTo(
      anchor + (coil % 2 === 1 ? 10 : -10),
      bracket + (reach * coil) / coils
    );
  }
  ctx.lineTo(anchor, mass - 14);
  ctx.stroke();
  ctx.fillStyle = "#2F45E8";
  ctx.beginPath();
  ctx.roundRect(anchor - 16, mass - 14, 32, 28, 6);
  ctx.fill();
};

/** The position over time in a framed plot, with its axis through the middle. */
const drawPlot = (
  ctx: CanvasRenderingContext2D,
  box: { height: number; left: number; top: number; width: number },
  trace: readonly number[]
) => {
  const middle = box.top + box.height / 2;
  ctx.strokeStyle = "rgba(18,20,32,.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(box.left, box.top, box.width, box.height);
  ctx.beginPath();
  ctx.moveTo(box.left, middle);
  ctx.lineTo(box.left + box.width, middle);
  ctx.stroke();
  ctx.strokeStyle = "#E8501A";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [index, value] of trace.entries()) {
    ctx.lineTo(
      box.left + (index / HISTORY) * box.width,
      middle + value * box.height * 0.45
    );
  }
  ctx.stroke();
};

/** A damped spring simulated live; the slider sets its stiffness and lets it go again. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const font = `600 11px ${fontStack("mono")}`;
  const control = document.createElement("label");
  const caption = document.createElement("span");
  const input = document.createElement("input");
  control.className = "st-playable-explainer-ui";
  caption.textContent = "stiffness k";
  input.type = "range";
  input.min = "2";
  input.max = "40";
  input.value = "12";
  control.append(caption, input);
  stage.append(control);
  let x = 1;
  let v = 0;
  let previous: number | null = null;
  const trace: number[] = [];
  input.addEventListener("input", () => {
    x = 1;
    v = 0;
  });
  return (t) => {
    const dt =
      previous === null ? 0.016 : Math.min(0.033, Math.max(0, t - previous));
    previous = t;
    const k = input.valueAsNumber;
    v += (-k * x - 0.6 * v) * dt;
    x += v * dt;
    if (Math.abs(x) < 0.004 && Math.abs(v) < 0.01) {
      x = 1;
      v = 0;
    }
    trace.push(x);
    if (trace.length > HISTORY) {
      trace.shift();
    }
    const { ctx, width, height } = view;
    ctx.fillStyle = "#F2F6EC";
    ctx.fillRect(0, 0, width, height);
    drawSpring(ctx, width, height, x);
    const box = {
      height: height * 0.6,
      left: width * 0.36,
      top: height * 0.14,
      width: width * 0.6,
    };
    drawPlot(ctx, box, trace);
    ctx.fillStyle = "#3E4733";
    ctx.font = font;
    ctx.fillText(
      `k=${k}  ω=${Math.sqrt(k).toFixed(2)} rad/s`,
      box.left,
      box.top - 6
    );
  };
};
