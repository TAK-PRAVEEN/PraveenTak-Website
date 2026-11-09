/**
 * Particle-orb cursor — DESIGN.md §6B.
 *
 * A Fibonacci sphere + two orbital rings in a small fixed canvas that follows
 * the pointer (never a full-screen overlay). Rotation and the explode effect
 * run in the vertex shader; JS moves the canvas and springs one scalar.
 *
 * Paper surface: charcoal particles over an orange core (additive glow would be
 * invisible on light paper). Ink surface: orange additive glow.
 */
import { attribute, createContext, createProgram, rgb, uniforms } from "../../lib/gl";
import { onFrame, spring } from "../../lib/frame";

const VS = /* glsl */ `#version 300 es
precision highp float;
in vec3 aPos;
in float aSeed;
in float aKind; // 0 sphere, 1 ring A, 2 ring B
uniform float uTime, uExplode, uPress, uDpr, uRadius;
out float vFront;

mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1,0,0, 0,c,s, 0,-s,c); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c,s,0, -s,c,0, 0,0,1); }
float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  float s = aSeed;
  vec3 p = aPos;
  float ex = uExplode;

  if (aKind < 0.5) {
    // Sphere: separate along the normal (with per-particle spread), keep spinning.
    p *= 1.0 + ex * (0.9 + s * 2.2);
    p += (vec3(hash(s * 13.1), hash(s * 29.7), hash(s * 47.3)) - 0.5) * ex * 0.5;
    p = rotZ(uTime * 0.37) * rotY(uTime * 0.83) * rotX(uTime * 0.55) * p;
  } else {
    // Orbital rings: own spin, fixed tilt, widen on explode.
    float tilt = aKind < 1.5 ? 1.15 : -0.85;
    float spin = aKind < 1.5 ? 1.6 : -1.1;
    p = rotZ(uTime * spin) * p;
    p *= (aKind < 1.5 ? 1.55 : 1.85) * (1.0 + ex * 0.65);
    p = rotX(tilt) * rotY(uTime * 0.2) * p;
  }
  p *= uRadius * (1.0 - uPress * 0.18);

  float persp = 1.0 / (1.0 - p.z * 0.35);
  gl_Position = vec4(p.xy * persp, 0.0, 1.0);
  vFront = clamp(p.z / (uRadius * 1.6) * 0.5 + 0.5, 0.0, 1.0);
  float ring = step(0.5, aKind);
  gl_PointSize = uDpr * mix(1.2 + 1.5 * vFront, 1.0 + 0.8 * vFront, ring) * (1.0 + ex * 0.35);
}`;

const FS = /* glsl */ `#version 300 es
precision mediump float;
uniform vec3 uColor;
uniform float uAlpha;
in float vFront;
out vec4 outColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, d) * (0.3 + 0.7 * vFront) * uAlpha;
  outColor = vec4(uColor * a, a);
}`;

const U = ["uTime", "uExplode", "uPress", "uDpr", "uRadius", "uColor", "uAlpha"] as const;

const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], summary, label[for], select, [data-cursor="explode"]';
const TEXT_ENTRY =
  'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';

function geometry() {
  const SPHERE = 520;
  const RING_A = 96;
  const RING_B = 72;
  const n = SPHERE + RING_A + RING_B;
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const kind = new Float32Array(n);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < SPHERE; i++) {
    const y = 1 - (i / (SPHERE - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pos.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
  }
  for (let j = 0; j < RING_A + RING_B; j++) {
    const i = SPHERE + j;
    const count = j < RING_A ? RING_A : RING_B;
    const a = ((j < RING_A ? j : j - RING_A) / count) * Math.PI * 2;
    pos.set([Math.cos(a), Math.sin(a) * 0.32, 0], i * 3);
    kind[i] = j < RING_A ? 1 : 2;
  }
  for (let i = 0; i < n; i++) {
    const h = Math.sin((i + 3) * 78.233) * 43758.5453;
    seed[i] = h - Math.floor(h);
  }
  return { n, pos, seed, kind };
}

export function mountOrb(root: HTMLElement): () => void {
  const canvas = root.querySelector("canvas")!;
  const dot = root.querySelector<HTMLElement>("[data-orb-dot]")!;
  const gl = createContext(canvas);
  if (!gl) throw new Error("WebGL2 unavailable");

  const program = createProgram(gl, VS, FS);
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());
  const g = geometry();
  attribute(gl, program, "aPos", g.pos, 3);
  attribute(gl, program, "aSeed", g.seed, 1);
  attribute(gl, program, "aKind", g.kind, 1);
  const u = uniforms(gl, program, U);
  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.clientWidth || 200;
  canvas.width = canvas.height = Math.round(size * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform1f(u.uDpr, dpr);
  gl.uniform1f(u.uRadius, 0.2);

  const css = getComputedStyle(document.documentElement);
  const charcoal = rgb(css.getPropertyValue("--charcoal") || "#171719");
  const orange = rgb(css.getPropertyValue("--orange") || "#ff5a1f");
  let onInk = document.documentElement.dataset.surface === "ink";
  const applySurface = () => {
    onInk = document.documentElement.dataset.surface === "ink";
    root.dataset.surface = onInk ? "ink" : "paper";
    gl.uniform3fv(u.uColor, onInk ? orange : charcoal);
    if (onInk) gl.blendFunc(gl.ONE, gl.ONE); // additive glow on dark
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  };
  applySurface();

  const target = { x: -200, y: -200 };
  const pos = { x: -200, y: -200 };
  const explode = { value: 0, velocity: 0 };
  const press = { value: 0, velocity: 0 };
  const alpha = { value: 0, velocity: 0 };
  let explodeTarget = 0;
  let pressed = false;
  let shown = false;
  let overText = false;

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    target.x = e.clientX;
    target.y = e.clientY;
    if (!shown) {
      pos.x = target.x;
      pos.y = target.y;
      shown = true;
    }
    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
  };
  const onOver = (e: PointerEvent) => {
    const el = e.target as Element | null;
    overText = !!el?.closest?.(TEXT_ENTRY);
    explodeTarget = !overText && el?.closest?.(INTERACTIVE) ? 1 : 0;
  };
  const onDown = () => (pressed = true);
  const onUp = () => (pressed = false);
  const onLeaveDoc = () => (shown = false);

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeaveDoc);
  document.addEventListener("astro:after-swap", applySurface);
  document.documentElement.classList.add("orb-on");

  const half = size / 2;
  const stop = onFrame((t, dt) => {
    const k = 1 - Math.exp(-dt * 20); // slight trailing, stays responsive
    pos.x += (target.x - pos.x) * k;
    pos.y += (target.y - pos.y) * k;
    canvas.style.transform = `translate3d(${pos.x - half}px, ${pos.y - half}px, 0)`;

    spring(explode, explodeTarget, dt, 140, 13); // slight overshoot = "burst"
    spring(press, pressed ? 1 : 0, dt, 300, 22);
    spring(alpha, shown && !overText ? 1 : 0, dt, 200, 26);
    root.style.setProperty("--orb-alpha", String(Math.max(0, Math.min(1, alpha.value))));
    root.style.setProperty("--orb-explode", String(Math.max(0, explode.value)));

    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uExplode, Math.max(0, explode.value));
    gl.uniform1f(u.uPress, press.value);
    gl.uniform1f(u.uAlpha, onInk ? 0.6 : 1); // additive on Ink saturates fast; fade is CSS opacity
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, g.n);
  });

  return () => {
    stop();
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
    document.removeEventListener("astro:after-swap", applySurface);
    document.documentElement.classList.remove("orb-on");
  };
}
