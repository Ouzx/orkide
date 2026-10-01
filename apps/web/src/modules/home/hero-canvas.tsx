import { useEffect, useState } from "react";

import { mountPollenScene } from "./pollen-scene.ts";

/** React host for the WebGL pollen layer: mounts the scene into its element, disposes it on unmount. */
const HeroCanvas = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!element) {
      return;
    }
    return mountPollenScene(element);
  }, [element]);

  return (
    <div
      ref={setElement}
      aria-hidden="true"
      className="absolute inset-0 animate-in duration-1000 fade-in"
    />
  );
};

export default HeroCanvas;
