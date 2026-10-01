import { lazy, Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

/** The WebGL bloom ships in its own chunk, fetched only once every gate below has passed. */
const HeroCanvas = lazy(() => import("./hero-canvas.tsx"));

const supportsWebGl = (): boolean => {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
};

/** Safari lacks `requestIdleCallback`; a short timeout is a fine stand-in after load. */
// A scheduling primitive: the callback form is the point (it returns its own cancel function).
// oxlint-disable-next-line promise/prefer-await-to-callbacks
const whenIdle = (callback: () => void): (() => void) => {
  if ("requestIdleCallback" in globalThis) {
    const handle = requestIdleCallback(callback, { timeout: 4000 });
    return () => cancelIdleCallback(handle);
  }
  const handle = setTimeout(callback, 1500);
  return () => clearTimeout(handle);
};

const saveData = (): boolean =>
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData === true;

/**
 * Progressive 3D hero. The server renders nothing here; the poster image beneath is the LCP
 * element. After the page is idle, the scene fades in — unless the visitor prefers reduced motion,
 * is saving data, lacks WebGL 2, or the `hero-scene` flag is off. Any runtime failure leaves the
 * poster in place.
 */
export const HeroScene = ({ enabled }: { readonly enabled: boolean }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!enabled || reducedMotion.matches || saveData() || !supportsWebGl()) {
      return;
    }
    return whenIdle(() => setReady(true));
  }, [enabled]);

  if (!ready) {
    return null;
  }
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>
    </ErrorBoundary>
  );
};

export default HeroScene;
