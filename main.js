/*
 * THESIS: LOCU proves itself through real machine-vision distortion instead
 *   of a static hero with a decorative neon glow.
 * OWN-WORLD: Void-black stage; cyan/magenta RGB-split is the only color and
 *   is earned by input, never resting; Chakra Petch wordmark; IBM Plex Mono
 *   HUD readouts in bracketed corners; hard edges, no shadows — light and
 *   displacement stand in for depth.
 * STORY: LOCU sits solid and locked; the instant a pointer or finger enters
 *   the frame, it fractures into chromatic-aberration glitch slabs that
 *   track the input, then re-locks the moment it leaves.
 * FIRST VIEWPORT: full-bleed WebGL canvas, LOCU centered ~60-85vw, sparse
 *   low-opacity HUD labels in all four corners, no nav, no scroll.
 * FORM: world pinned directly by the user's brief (cyberpunk / machine /
 *   glitch / cyan-magenta aberration) — built directly, no concept-seed
 *   tournament, since no open aesthetic decision remained. Staging: a
 *   single full-viewport interactive hero-as-page.
 */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const WORD = "LOCU";
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE_POINTER = window.matchMedia("(pointer: coarse)").matches;

const CAMERA_FOV = 45;
const CAMERA_Z = 6;
const VISIBLE_HEIGHT = 2 * Math.tan(((CAMERA_FOV * Math.PI) / 180) / 2) * CAMERA_Z;
const IDLE_TIMEOUT_MS = 1800;

const canvas = document.getElementById("scene");
const veilEl = document.querySelector(".veil");
const fallbackEl = document.getElementById("fallback-static");
const hudEls = Array.from(document.querySelectorAll(".hud"));
const hudStatusEl = document.getElementById("hud-status");
const hudCoordsEl = document.getElementById("hud-coords");
const hudYearEl = document.getElementById("hud-year");

if (hudYearEl) hudYearEl.textContent = `LOCU — ${new Date().getFullYear()}`;

if (hasWebGL()) {
  init().catch(() => showFallback());
} else {
  showFallback();
}

function hasWebGL() {
  try {
    const test = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (test.getContext("webgl2") || test.getContext("webgl"))
    );
  } catch (err) {
    return false;
  }
}

function showFallback() {
  canvas.style.display = "none";
  if (veilEl) veilEl.style.display = "none";
  hudEls.forEach((el) => (el.style.display = "none"));
  fallbackEl.style.display = "flex";
}

async function init() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  const cameraRest = new THREE.Vector3(0, 0, CAMERA_Z);
  camera.position.copy(cameraRest);

  await loadFonts();

  const segmentsFor = () => (COARSE_POINTER ? [70, 42] : [140, 84]);

  let geometry = buildPlaneGeometry(window.innerWidth / window.innerHeight, segmentsFor());
  let texture = buildTextTexture(window.innerWidth / window.innerHeight, renderer);

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uMouseUV: { value: new THREE.Vector2(0.5, 0.5) },
    uActive: { value: 0 },
    uRadius: { value: VISIBLE_HEIGHT * 0.62 },
    uIdleAmp: { value: REDUCED_MOTION ? 0.012 : 0.05 },
    uAberration: { value: 0.03 },
    uText: { value: texture },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.35,
    0.25,
    0.55
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---- Pointer / touch (unified via Pointer Events) ----------------------

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const targetWorld = new THREE.Vector2(0, 0);
  const targetUv = new THREE.Vector2(0.5, 0.5);
  const currentWorld = new THREE.Vector2(0, 0);
  const currentUv = new THREE.Vector2(0.5, 0.5);
  const lastNdc = new THREE.Vector2(0, 0);
  const smoothNdc = new THREE.Vector2(0, 0);
  const zero2 = new THREE.Vector2(0, 0);

  let pointerOnPlane = false;
  let lastMoveAt = 0;

  function updateFromClient(clientX, clientY) {
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -((clientY / window.innerHeight) * 2 - 1);
    lastNdc.copy(ndc);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(mesh, false)[0];
    if (hit) {
      targetWorld.set(hit.point.x, hit.point.y);
      if (hit.uv) targetUv.copy(hit.uv);
      pointerOnPlane = true;
      lastMoveAt = performance.now();
      if (hit.uv) {
        hudCoordsEl.textContent = `X ${hit.uv.x.toFixed(3)}  Y ${(1 - hit.uv.y).toFixed(3)}`;
      }
    }
  }

  function onPointerMove(e) {
    updateFromClient(e.clientX, e.clientY);
  }
  function onPointerDown(e) {
    updateFromClient(e.clientX, e.clientY);
  }
  function onPointerEnd() {
    pointerOnPlane = false;
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });
  window.addEventListener("pointercancel", onPointerEnd, { passive: true });
  window.addEventListener("pointerleave", onPointerEnd, { passive: true });
  window.addEventListener("blur", onPointerEnd);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onPointerEnd();
  });

  // ---- Resize --------------------------------------------------------------

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 120);
  });

  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;

    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    geometry.dispose();
    geometry = buildPlaneGeometry(aspect, segmentsFor());
    mesh.geometry = geometry;

    texture.dispose();
    texture = buildTextTexture(aspect, renderer);
    uniforms.uText.value = texture;
  }

  // ---- Animation loop --------------------------------------------------

  const startTime = performance.now();

  function tick() {
    const now = performance.now();
    const engaged = pointerOnPlane && now - lastMoveAt < IDLE_TIMEOUT_MS;
    const activeTarget = engaged ? 1 : 0;

    uniforms.uActive.value += (activeTarget - uniforms.uActive.value) * 0.07;
    currentWorld.lerp(targetWorld, engaged ? 0.16 : 0.05);
    currentUv.lerp(targetUv, engaged ? 0.16 : 0.05);
    uniforms.uMouse.value.copy(currentWorld);
    uniforms.uMouseUV.value.copy(currentUv);
    uniforms.uTime.value = (now - startTime) / 1000;

    if (!REDUCED_MOTION) {
      smoothNdc.lerp(engaged ? lastNdc : zero2, 0.04);
      camera.position.x = smoothNdc.x * 0.4;
      camera.position.y = smoothNdc.y * 0.22;
      camera.position.z = CAMERA_Z;
      camera.lookAt(0, 0, 0);
      mesh.rotation.y = Math.sin(uniforms.uTime.value * 0.15) * 0.02;
    }

    hudStatusEl.textContent = engaged ? "STATUS — TRACKING" : "STATUS — LOCKED";
    hudStatusEl.classList.toggle("is-active", engaged);

    composer.render();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

async function loadFonts() {
  if (!("fonts" in document)) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 100px "Chakra Petch"'),
        document.fonts.load('500 32px "IBM Plex Mono"'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (err) {
    // Fall back silently to the system font stack declared in the canvas draw.
  }
}

function buildPlaneGeometry(aspect, segments) {
  const [segX, segY] = segments;
  const height = VISIBLE_HEIGHT;
  const width = height * aspect;
  return new THREE.PlaneGeometry(width, height, segX, segY);
}

function buildTextTexture(aspect, renderer) {
  const W = 2048;
  const H = Math.max(1, Math.round(W / aspect));
  const cnv = document.createElement("canvas");
  cnv.width = W;
  cnv.height = H;
  const ctx = cnv.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const probeSize = 100;
  ctx.font = `700 ${probeSize}px "Chakra Petch", Arial, sans-serif`;
  const probe = ctx.measureText(WORD);
  const probeWidth = probe.width || probeSize;
  const probeHeight =
    (probe.actualBoundingBoxAscent || probeSize * 0.72) +
    (probe.actualBoundingBoxDescent || probeSize * 0.02);

  const fontSizeByWidth = (W * 0.66 * probeSize) / probeWidth;
  const fontSizeByHeight = (H * 0.58 * probeSize) / probeHeight;
  const fontSize = Math.min(fontSizeByWidth, fontSizeByHeight);

  ctx.font = `700 ${fontSize}px "Chakra Petch", Arial, sans-serif`;
  ctx.fillText(WORD, W / 2, H / 2 + fontSize * 0.04);

  const texture = new THREE.CanvasTexture(cnv);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

const VERT = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uActive;
uniform float uRadius;
uniform float uIdleAmp;

varying vec2 vUv;
varying float vInfluence;

// Simplex noise (Ashima Arts / Stefan Gustavson, MIT) — a standard compact
// 3D implementation, used here for idle drift and glitch jitter.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vUv = uv;

  float dist = distance(position.xy, uMouse);
  float influence = smoothstep(uRadius, 0.0, dist) * uActive;

  float idle = snoise(vec3(position.xy * 0.18, uTime * 0.15)) * uIdleAmp;
  float jitterZ = snoise(vec3(position.xy * 1.4, uTime * 2.2 + 30.0));
  float jitterX = snoise(vec3(position.xy * 1.4 + 80.0, uTime * 2.2));
  float jitterY = snoise(vec3(position.xy * 1.4 - 80.0, uTime * 2.2));

  vec3 pos = position;
  pos.z += idle + influence * (0.55 + jitterZ * 0.6);
  pos.x += jitterX * 0.05 * influence;
  pos.y += jitterY * 0.05 * influence;

  vInfluence = influence;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D uText;
uniform float uTime;
uniform vec2 uMouseUV;
uniform float uAberration;

varying vec2 vUv;
varying float vInfluence;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  vec2 dir = normalize(vUv - uMouseUV + 1e-5);

  float sliceCount = 46.0;
  float sliceId = floor(vUv.y * sliceCount);
  float sliceSeed = floor(uTime * 9.0);
  float sliceActive = step(0.74, hash(sliceId * 12.9898 + sliceSeed * 3.7));
  float sliceShift = (hash(sliceId * 7.233 + sliceSeed) - 0.5) * 0.05 * sliceActive * vInfluence;

  vec2 baseUv = vUv + vec2(sliceShift, 0.0);
  vec2 offset = dir * uAberration * vInfluence;

  float maskCenter = texture2D(uText, baseUv).a;
  float maskMagenta = texture2D(uText, baseUv + offset).a;
  float maskCyan = texture2D(uText, baseUv - offset).a;

  vec3 base = vec3(0.95, 0.99, 1.0) * maskCenter * (1.0 - vInfluence * 0.3);
  vec3 magentaLayer = vec3(1.15, 0.1, 1.0) * maskMagenta * vInfluence;
  vec3 cyanLayer = vec3(0.0, 1.05, 1.15) * maskCyan * vInfluence;

  vec3 color = base + magentaLayer + cyanLayer;
  float alpha = max(maskCenter, max(maskMagenta, maskCyan));

  if (alpha < 0.02) discard;

  gl_FragColor = vec4(color, alpha);
}
`;
