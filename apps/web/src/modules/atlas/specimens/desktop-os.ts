import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "The site is a fake operating system. Sections open as windows you can drag around.",
    tr: "Site, bir işletim sistemi taklidi. Bölümler, sürükleyip istediğin yere taşıyabileceğin pencerelerde açılır.",
  },
  family: "spatial",
  fit: "strong",
  hint: "drag",
  id: "SP-02",
  name: { en: "Desktop OS metaphor", tr: "Masaüstü işletim sistemi metaforu" },
  pairs: ["AE-06", "MO-04", "PH-02", "SN-01"],
  prompt:
    "Build [subject] as a fake desktop OS: icons on a desktop, sections opening as draggable, focusable windows with title bars, and a taskbar with a live clock. Use an original retro style without real OS branding. On phones, windows become full-screen sheets.",
  refs: [
    { label: "Poolsuite", url: "https://poolsuite.net/" },
    { label: "Windows 93", url: "https://www.windows93.net/" },
  ],
  slug: "desktop-os",
  tags: ["draggable windows", "retro UI", "z-order"],
} satisfies SpecimenInput;

const ICONS =
  '<div class="st-desktop-os-icons"><span><i></i>posts.txt</span><span><i class="st-desktop-os-folder"></i>plates</span><span><i class="st-desktop-os-bin"></i>trash</span></div>';
const WINDOWS = [
  {
    body: '<p>Drafts waiting: <strong>3</strong></p><span class="st-desktop-os-button">Publish</span>',
    left: "20%",
    title: "drafts.exe",
    top: "12%",
  },
  {
    body: "<p>09:14 build ok<br>09:15 live</p>",
    left: "46%",
    title: "deploy.log",
    top: "42%",
  },
] as const;
const TASKBAR = '<div class="st-desktop-os-task"><span>Start</span></div>';

/** Windows drag by their title bars; the one you touch comes to the front. */
export const preview: Preview = (stage) => {
  const desk = document.createElement("div");
  desk.className = "st-desktop-os-desk";
  desk.setAttribute("aria-hidden", "true");
  desk.innerHTML = ICONS;
  for (const { body, left, title, top } of WINDOWS) {
    const win = document.createElement("div");
    win.className = "st-desktop-os-win";
    win.innerHTML = `<div class="st-desktop-os-bar">${title}<b>×</b></div>${body}`;
    win.style.left = left;
    win.style.top = top;
    desk.append(win);
  }
  desk.insertAdjacentHTML("beforeend", TASKBAR);
  stage.append(desk);
  let front = 2;
  let grab:
    | { left: number; top: number; win: HTMLElement; x: number; y: number }
    | undefined;
  desk.addEventListener("pointerdown", (event) => {
    const { target } = event;
    if (!(target instanceof Element)) {
      return;
    }
    const win = target.closest<HTMLElement>(".st-desktop-os-win");
    if (!win) {
      return;
    }
    front += 1;
    win.style.zIndex = String(front);
    const bar = target.closest<HTMLElement>(".st-desktop-os-bar");
    if (bar) {
      grab = {
        left: win.offsetLeft,
        top: win.offsetTop,
        win,
        x: event.clientX,
        y: event.clientY,
      };
      bar.setPointerCapture(event.pointerId);
    }
  });
  desk.addEventListener("pointermove", (event) => {
    if (!grab) {
      return;
    }
    grab.win.style.left = `${grab.left + event.clientX - grab.x}px`;
    grab.win.style.top = `${Math.max(0, grab.top + event.clientY - grab.y)}px`;
  });
  const drop = () => {
    grab = undefined;
  };
  desk.addEventListener("pointerup", drop);
  desk.addEventListener("pointercancel", drop);
};
