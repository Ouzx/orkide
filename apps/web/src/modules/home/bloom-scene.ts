import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Timer,
  WebGLRenderer,
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
/** Golden-angle spiral: evenly spread points without randomness (stable across loads). */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MAX_PIXEL_RATIO = 1.75;

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

/**
 * Mounts the orchid bloom into `container` and returns a disposer. Plain Three.js with named
 * imports (tree-shaken), a frame loop that runs only while the canvas is on screen, and pointer
 * parallax eased per frame.
 */
export const mountBloomScene = (container: HTMLElement): (() => void) => {
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  const pixelRatio = Math.min(globalThis.devicePixelRatio, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  container.append(renderer.domElement);

  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 7;
  const scene = new Scene();
  const group = new Group();
  group.rotation.x = 0.35;
  scene.add(group);

  // One uniform object shared by both materials: updating its value updates both.
  const uTime = { value: 0 };

  const bloomGeometry = new IcosahedronGeometry(1, 48);
  const bloomMaterial = new ShaderMaterial({
    depthWrite: false,
    fragmentShader: bloomFragment,
    transparent: true,
    uniforms: {
      uAurora: { value: AURORA },
      uDeep: { value: DEEP },
      uOrchid: { value: ORCHID },
      uTime,
    },
    vertexShader: bloomVertex,
  });
  const bloom = new Mesh(bloomGeometry, bloomMaterial);
  bloom.scale.setScalar(1.45);
  group.add(bloom);

  const pollenGeometry = createPollen();
  const pollenMaterial = new ShaderMaterial({
    blending: AdditiveBlending,
    depthWrite: false,
    fragmentShader: pollenFragment,
    transparent: true,
    uniforms: {
      uColor: { value: AURORA },
      uPixelRatio: { value: pixelRatio },
      uTime,
    },
    vertexShader: pollenVertex,
  });
  group.add(new Points(pollenGeometry, pollenMaterial));

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
    uTime.value = timer.getElapsed();
    const ease = Math.min(1, delta * 2);
    group.rotation.y += delta * 0.08;
    group.rotation.x += (pointer.y * 0.25 + 0.35 - group.rotation.x) * ease;
    group.rotation.z += (-pointer.x * 0.2 - group.rotation.z) * ease;
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
    bloomGeometry.dispose();
    bloomMaterial.dispose();
    pollenGeometry.dispose();
    pollenMaterial.dispose();
    timer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
};
