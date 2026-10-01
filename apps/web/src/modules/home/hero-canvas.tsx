import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, ShaderMaterial } from "three";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
} from "three";

import {
  bloomFragment,
  bloomVertex,
  pollenFragment,
  pollenVertex,
} from "./shaders.ts";

/** Brand palette (the `--orchid` / `--aurora` tokens, in sRGB). */
const ORCHID = new Color("#e05ad8");
const AURORA = new Color("#5fd4e8");
const DEEP = new Color("#4b2aa8");

const POLLEN_COUNT = 520;
/** Golden-angle spiral: evenly spread points without randomness (stable across renders). */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const createPollen = (): BufferGeometry => {
  const positions = new Float32Array(POLLEN_COUNT * 3);
  const scales = new Float32Array(POLLEN_COUNT);
  for (let index = 0; index < POLLEN_COUNT; index += 1) {
    const y = 1 - (index / (POLLEN_COUNT - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = GOLDEN_ANGLE * index;
    const radius = 2.3 + ((index * 7919) % 100) / 80;
    positions.set(
      [
        Math.cos(theta) * ring * radius,
        y * radius,
        Math.sin(theta) * ring * radius,
      ],
      index * 3
    );
    scales[index] = 0.4 + ((index * 104_729) % 60) / 100;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new BufferAttribute(scales, 1));
  return geometry;
};

const Bloom = () => {
  const group = useRef<Group>(null);
  const bloomMaterial = useRef<ShaderMaterial>(null);
  const pollenMaterial = useRef<ShaderMaterial>(null);
  const dpr = useThree((state) => state.viewport.dpr);
  const pollen = useMemo(() => createPollen(), []);

  const bloomUniforms = useMemo(
    () => ({
      uAurora: { value: AURORA },
      uDeep: { value: DEEP },
      uOrchid: { value: ORCHID },
      uTime: { value: 0 },
    }),
    []
  );
  const pollenUniforms = useMemo(
    () => ({
      uColor: { value: AURORA },
      uPixelRatio: { value: dpr },
      uTime: { value: 0 },
    }),
    [dpr]
  );

  useEffect(() => () => pollen.dispose(), [pollen]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    // Per-frame updates go through the materials (refs), never through render-time values.
    for (const material of [bloomMaterial.current, pollenMaterial.current]) {
      const uniform = material?.uniforms.uTime;
      if (uniform) {
        uniform.value = time;
      }
    }
    const { current } = group;
    if (current) {
      // Ease toward the pointer for a subtle parallax; drift slowly otherwise.
      current.rotation.y += delta * 0.08;
      current.rotation.x +=
        (state.pointer.y * 0.25 - current.rotation.x) * Math.min(1, delta * 2);
      current.rotation.z +=
        (-state.pointer.x * 0.2 - current.rotation.z) * Math.min(1, delta * 2);
    }
  });

  return (
    <group ref={group} rotation={[0.35, 0, 0]}>
      <mesh scale={1.45}>
        <icosahedronGeometry args={[1, 48]} />
        <shaderMaterial
          ref={bloomMaterial}
          vertexShader={bloomVertex}
          fragmentShader={bloomFragment}
          uniforms={bloomUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      <points geometry={pollen}>
        <shaderMaterial
          ref={pollenMaterial}
          vertexShader={pollenVertex}
          fragmentShader={pollenFragment}
          uniforms={pollenUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
};

/** Renders only while on screen: offscreen, the frame loop stops entirely. */
const useOnScreen = (target: RefObject<HTMLElement | null>) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const element = target.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false)
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);
  return visible;
};

const HeroCanvas = () => {
  const container = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(container);

  return (
    <div
      ref={container}
      aria-hidden="true"
      className="animate-in fade-in absolute inset-0 duration-1000"
    >
      <Canvas
        camera={{ fov: 40, position: [0, 0, 7] }}
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <Bloom />
      </Canvas>
    </div>
  );
};

export default HeroCanvas;
