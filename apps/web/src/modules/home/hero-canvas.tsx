import { useEffect, useState } from "react";

import { mountBloomScene } from "./bloom-scene.ts";

/** React host for the WebGL bloom: mounts the scene into its element, disposes it on unmount. */
const HeroCanvas = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!element) {
      return;
    }
    return mountBloomScene(element);
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
