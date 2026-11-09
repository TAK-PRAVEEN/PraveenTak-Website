/**
 * Particle rock (ref: dark matte stone sphere with sparkle). Thousands of grains
 * sit on a noisy, rock-like sphere surface and slowly turn. Hovering scatters
 * them outward slowly; leaving lets them drift back together, slowly.
 * One WebGL2 point draw; everything per-particle happens in the vertex shader.
 */
import { createContext, createProgram, attribute, uniforms, fitCanvas, rgb } from "../../lib/gl";
import { onFrame, spring } from "../../lib/frame";
import { currentTheme, onThemeChange } from "../../lib/theme";

const VS = /* glsl */ `#version 300 es
precision highp float;
in vec3 aPos;
in float aSeed;
uniform float uTime, uScatter, uAspect, uSize;
out float vShade;
out float vSpark;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec3 p = aPos;
  // slow scatter: outward along the normal + a curl-ish drift, staggered by seed
  float k = smoothstep(0.0, 1.0, clamp(uScatter * 1.4 - aSeed * 0.4, 0.0, 1.0));
  vec3 dir = normalize(p + 1e-4);
  vec3 drift = vec3(sin(aSeed * 31.0 + uTime * 0.3), cos(aSeed * 17.0 + uTime * 0.25), sin(aSeed * 23.0 - uTime * 0.2));
  p += (dir * (0.1 + aSeed * 0.26) + drift * 0.08) * k;
  // slow rotation
  float a = uTime * 0.12, b = 0.35;
  p = vec3(cos(a) * p.x + sin(a) * p.z, p.y, -sin(a) * p.x + cos(a) * p.z);
  p = vec3(p.x, cos(b) * p.y - sin(b) * p.z, sin(b) * p.y + cos(b) * p.z);
  float w = 3.2 - p.z;
  gl_Position = vec4(p.x * 2.35 / uAspect, p.y * 2.35, 0.0, w);
  // matte rock: lit from the upper left
  vec3 n = normalize(aPos);
  float diff = max(dot(n, normalize(vec3(-0.45, 0.65, 0.6))), 0.0);
  vShade = clamp(0.12 + 0.88 * pow(diff, 0.8), 0.0, 1.0);
  vSpark = step(0.992, hash(aSeed * 91.0 + floor(uTime * 1.5 + aSeed * 7.0))) * 0.7;
  gl_PointSize = uSize * (1.1 + 0.5 * aSeed) * (3.2 / w) * (1.0 - 0.5 * k);
}`;

const FS = /* glsl */ `#version 300 es
precision mediump float;
uniform vec3 uDark, uLight;
uniform float uAlpha;
in float vShade;
in float vSpark;
out vec4 o;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  vec3 c = mix(uDark, uLight, vShade) + vSpark * vec3(0.85);
  float a = (1.0 - smoothstep(0.3, 0.5, d)) * uAlpha;
  o = vec4(c * a, a);
}`;

function vnoise(x: number, y: number, z: number) {
  return Math.sin(x * 2.1 + Math.sin(y * 3.3)) * 0.5 + Math.sin(y * 2.7 + Math.sin(z * 2.9)) * 0.3 + Math.sin(z * 3.1 + Math.sin(x * 2.3)) * 0.2;
}

export function mountRock(canvas: HTMLCanvasElement, hoverEl: HTMLElement): () => void {
  const gl = createContext(canvas);
  if (!gl) throw new Error("WebGL2 unavailable");
  const small = window.matchMedia("(max-width: 767px)").matches;
  const N = small ? 18000 : 42000;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    // fine, even dot lattice (the light "engraved" look)
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const x = Math.cos(t) * r, z = Math.sin(t) * r;
    // lumpy rock surface: low-frequency bulges + facets
    const f = 0.82 + 0.12 * vnoise(x * 1.3, y * 1.3, z * 1.3) + 0.05 * vnoise(x * 4, y * 4, z * 4);
    const jitter = 1 + (Math.random() - 0.5) * 0.02;
    pos.set([x * f * jitter, y * f * jitter, z * f * jitter], i * 3);
    seed[i] = Math.random();
  }
  const prog = createProgram(gl, VS, FS);
  gl.useProgram(prog);
  gl.bindVertexArray(gl.createVertexArray());
  attribute(gl, prog, "aPos", pos, 3);
  attribute(gl, prog, "aSeed", seed, 1);
  const u = uniforms(gl, prog, ["uTime", "uScatter", "uAspect", "uSize", "uDark", "uLight", "uAlpha"] as const);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const setColors = () => {
    gl.useProgram(prog);
    const dark = currentTheme() === "dark" || document.documentElement.dataset.surface === "ink";
    // Matte charcoal stone (ref): soft shadow to mid-grey light side.
    gl.uniform3fv(u.uDark, dark ? rgb("#2a2a2e") : rgb("#1a1a1c"));
    gl.uniform3fv(u.uLight, dark ? rgb("#9a9a9e") : rgb("#6e6e72"));
  };
  setColors();
  const offTheme = onThemeChange(setColors);

  const scatter = { value: 0, velocity: 0 };
  let target = 0;
  // Hit-test by position: the visual sits behind the header's text layer, so it never receives hover events.
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = hoverEl.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    target = Math.hypot(e.clientX - cx, e.clientY - cy) < r.width * 0.42 ? 1 : 0;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  // touch: tap toggles
  const onTap = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const r = hoverEl.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) target = target ? 0 : 1;
  };
  window.addEventListener("pointerdown", onTap, { passive: true });

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  let alpha = 0;
  const stop = onFrame((t, dt) => {
    if (!visible) return;
    fitCanvas(canvas, 1.5);
    gl.viewport(0, 0, canvas.width, canvas.height);
    spring(scatter, target, dt, 6, 5); // slow, soft spring: scatters and returns slowly
    alpha = Math.min(1, alpha + dt / 1.2);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uScatter, Math.max(0, scatter.value));
    gl.uniform1f(u.uAspect, canvas.width / canvas.height);
    gl.uniform1f(u.uSize, canvas.height / 260);
    gl.uniform1f(u.uAlpha, alpha);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, N);
  });
  return () => {
    stop();
    offTheme();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onTap);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
