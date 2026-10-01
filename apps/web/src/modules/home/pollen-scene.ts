import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Timer,
  WebGLRenderer,
} from "three";

import { pollenFragment, pollenVertex } from "./shaders.ts";

/** Brand palette (the `--orchid` / `--aurora` tokens, in sRGB). */
const ORCHID = new Color("#e05ad8");
const AURORA = new Color("#5fd4e8");

const POLLEN_COUNT = 900;
/** Golden-angle spiral: evenly spread points without randomness (stable across loads). */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MAX_PIXEL_RATIO = 1.75;

/** Deterministic pseudo-random in [0, 1) from an index (no `Math.random`: stable frames). */
const hash = (index: number, salt: number): number => {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43_758.5453;
  return x - Math.floor(x);
};

const createPollen = (): BufferGeometry => {
  const positions = new Float32Array(POLLEN_COUNT * 3);
  const colors = new Float32Array(POLLEN_COUNT * 3);
  const scales = new Float32Array(POLLEN_COUNT);
  const seeds = new Float32Array(POLLEN_COUNT);
  const color = new Color();
  for (let index = 0; index < POLLEN_COUNT; index += 1) {
    // A shell around the flower: dense near it, sparse far away.
    const y = 1 - (index / (POLLEN_COUNT - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = GOLDEN_ANGLE * index;
    const radius = 1.6 + hash(index, 1) ** 2 * 2.2;
    positions.set(
      [
        Math.cos(theta) * ring * radius,
        y * radius,
        Math.sin(theta) * ring * radius,
      ],
      index * 3
    );
    color.copy(ORCHID).lerp(AURORA, hash(index, 2));
    colors.set([color.r, color.g, color.b], index * 3);
    scales[index] = 0.35 + hash(index, 3) * 0.9;
    seeds[index] = hash(index, 4);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new BufferAttribute(scales, 1));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
};

/**
 * Mounts drifting, twinkling pollen around the hero orchid into `container` and returns a
 * disposer. Plain Three.js with named imports (tree-shaken), a frame loop that runs only while
 * the canvas is on screen, and pointer parallax eased per frame.
 */
export const mountPollenScene = (container: HTMLElement): (() => void) => {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  const pixelRatio = Math.min(globalThis.devicePixelRatio, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  container.append(renderer.domElement);

  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 7;
  const scene = new Scene();
  // Outer group follows the pointer (parallax); the inner one spins slowly on its own.
  const group = new Group();
  const spin = new Group();
  group.add(spin);
  scene.add(group);

  const geometry = createPollen();
  const material = new ShaderMaterial({
    blending: AdditiveBlending,
    depthWrite: false,
    fragmentShader: pollenFragment,
    transparent: true,
    uniforms: {
      uPixelRatio: { value: pixelRatio },
      uTime: { value: 0 },
    },
    vertexShader: pollenVertex,
  });
  spin.add(new Points(geometry, material));
  const time = material.uniforms.uTime;

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    if (width === 0 || height === 0) {
      return;
    }
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // Pointer position in [-1, 1] relative to the canvas, for parallax.
  const pointer = { x: 0, y: 0 };
  const onPointerMove = (event: PointerEvent) => {
    const bounds = container.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  };
  globalThis.addEventListener("pointermove", onPointerMove, { passive: true });

  const timer = new Timer();
  const frame = (timestamp: number) => {
    timer.update(timestamp);
    const delta = timer.getDelta();
    if (time) {
      time.value = timer.getElapsed();
    }
    const ease = Math.min(1, delta * 1.5);
    spin.rotation.y += delta * 0.05;
    group.rotation.y += (pointer.x * 0.3 - group.rotation.y) * ease;
    group.rotation.x += (-pointer.y * 0.2 - group.rotation.x) * ease;
    renderer.render(scene, camera);
  };

  // Offscreen, the loop stops entirely.
  const visibility = new IntersectionObserver(([entry]) => {
    renderer.setAnimationLoop(entry?.isIntersecting ? frame : null);
  });
  visibility.observe(container);

  return () => {
    visibility.disconnect();
    resizeObserver.disconnect();
    globalThis.removeEventListener("pointermove", onPointerMove);
    renderer.setAnimationLoop(null);
    geometry.dispose();
    material.dispose();
    timer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
};
