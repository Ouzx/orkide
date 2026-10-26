import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack, track } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "medium",
  desc: {
    en: "On a phone you tilt to roll the marble. Here the cursor stands in for the gyroscope.",
    tr: "Telefonda bilyeyi yuvarlamak için cihazı eğersin. Burada jiroskopun yerini imleç tutar.",
  },
  family: "senses",
  fit: "tune",
  hint: "move",
  id: "SN-02",
  name: { en: "Device tilt", tr: "Cihaz eğimi" },
  pairs: ["SP-04", "SP-03", "PH-02", "GN-07"],
  prompt:
    "Make [subject] respond to phone tilt: DeviceOrientation drives a parallax scene or a rolling marble, with an explicit “Enable motion” button for the iOS permission and pointer control as the desktop fallback. Test on a real device.",
  refs: [
    {
      label: "MDN: device orientation",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events",
    },
  ],
  slug: "device-tilt",
  tags: ["DeviceOrientation", "mobile", "permissions"],
} satisfies SpecimenInput;

/** A marble in a bowl, rolled by the pointer as if it were the phone's tilt; it bounces off the rim. */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const pointer = track(stage);
  const font = `600 11px ${fontStack("mono")}`;
  const marble = { vx: 0, vy: 0, x: 0, y: 0 };
  return (t) => {
    const { ctx, width, height } = view;
    const aim = pointer.at(t);
    const tiltX = (aim.x - 0.5) * 2;
    const tiltY = (aim.y - 0.5) * 2;
    const bowl = Math.min(width, height) * 0.38;
    const radius = bowl * 0.16;
    marble.vx = (marble.vx + tiltX * 0.35) * 0.95;
    marble.vy = (marble.vy + tiltY * 0.35) * 0.95;
    marble.x += marble.vx;
    marble.y += marble.vy;
    const reach = Math.hypot(marble.x, marble.y);
    if (reach > bowl - radius) {
      const nx = marble.x / reach;
      const ny = marble.y / reach;
      marble.x = nx * (bowl - radius);
      marble.y = ny * (bowl - radius);
      const along = marble.vx * nx + marble.vy * ny;
      marble.vx -= 1.6 * along * nx;
      marble.vy -= 1.6 * along * ny;
    }
    const cx = width / 2;
    const cy = height / 2;
    ctx.fillStyle = "#CDEADB";
    ctx.fillRect(0, 0, width, height);
    const dish = ctx.createRadialGradient(cx, cy, bowl * 0.1, cx, cy, bowl);
    dish.addColorStop(0, "#F7FFFA");
    dish.addColorStop(1, "#93C9AE");
    ctx.fillStyle = dish;
    ctx.beginPath();
    ctx.arc(cx, cy, bowl, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,60,40,.25)";
    ctx.lineWidth = 1;
    for (const ring of [0.33, 0.66]) {
      ctx.beginPath();
      ctx.arc(cx, cy, bowl * ring, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - bowl, cy);
    ctx.lineTo(cx + bowl, cy);
    ctx.moveTo(cx, cy - bowl);
    ctx.lineTo(cx, cy + bowl);
    ctx.stroke();
    const bx = cx + marble.x;
    const by = cy + marble.y;
    const shine = ctx.createRadialGradient(
      bx - radius * 0.35,
      by - radius * 0.35,
      radius * 0.1,
      bx,
      by,
      radius
    );
    shine.addColorStop(0, "#FFFFFF");
    shine.addColorStop(0.35, "#FF5A36");
    shine.addColorStop(1, "#8E240C");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0E3B2A";
    ctx.font = font;
    ctx.fillText(
      `β ${(tiltY * 45).toFixed(0)}°  γ ${(tiltX * 45).toFixed(0)}°`,
      12,
      height - 12
    );
  };
};
