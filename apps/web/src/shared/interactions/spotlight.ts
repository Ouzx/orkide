/**
 * Feeds the `spotlight` utility: one delegated, passive pointer listener writes the pointer
 * position into `--spot-x/--spot-y` on the hovered `[data-spotlight]` element, at most once per
 * frame. Touch and reduced-motion visitors get the static, centered glow.
 */
export const startSpotlight = (): void => {
  if (matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) {
    return;
  }
  let frame = 0;
  let pending: { target: HTMLElement; x: number; y: number } | undefined;

  const paint = () => {
    frame = 0;
    if (!pending) {
      return;
    }
    const { target, x, y } = pending;
    const bounds = target.getBoundingClientRect();
    target.style.setProperty("--spot-x", `${x - bounds.left}px`);
    target.style.setProperty("--spot-y", `${y - bounds.top}px`);
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-spotlight]"
      );
      if (!target) {
        return;
      }
      pending = { target, x: event.clientX, y: event.clientY };
      frame ||= requestAnimationFrame(paint);
    },
    { passive: true }
  );
};
