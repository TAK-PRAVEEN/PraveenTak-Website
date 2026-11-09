/**
 * Binary particle portrait — DESIGN.md §6A, decisions D1 (reconstruct on load)
 * and D2 (hover disintegrates, scroll dollies through).
 *
 * Data: public/media/portrait.bin, baked offline by scripts/bake-portrait.py.
 * Rendering: one WebGL2 point-sprite draw; every particle effect lives in the
 * vertex shader. JS only updates a handful of uniforms per frame.
 */
import { attribute, createContext, createProgram, fitCanvas, glyphAtlas, rgb, uniforms } from "../../lib/gl";
import { onFrame, spring } from "../../lib/frame";

const VS = /* glsl */ `#version 300 es
precision highp float;
in vec3 aPos;
in float aTone;   // 0 = darkest ink, 1 = lightest
in float aSeed;   // per-particle random 0..1

uniform float uTime, uIntro, uHover, uPointerOn, uScroll, uAspect, uCamZ, uSize, uYaw, uPitch;
uniform vec2 uPointer; // NDC

out float vAlpha;
out float vGlyph;
out float vAccent;

const float FOCAL = 3.7320508; // 1 / tan(15deg) — 30deg vertical field of view

float hash(float n) { return fract(sin(n) * 43758.5453123); }
vec3 hash3(float n) { return vec3(hash(n), hash(n + 17.13), hash(n + 41.71)) * 2.0 - 1.0; }

void main() {
  float s = aSeed;
  vec3 p = aPos;

  // D1 — reconstruct: each particle flies in from a scattered start, staggered by seed.
  float k = clamp(uIntro * 1.8 - s * 0.8, 0.0, 1.0);
  k = 1.0 - pow(1.0 - k, 3.0);
  vec3 scatter = normalize(hash3(s * 97.0) + 1e-3) * (1.6 + s * 1.6);
  p = mix(p + scatter, p, k);

  // D2 — hover: drift apart and let the glyphs fall, like code raining off the face.
  vec3 drift = vec3(
    sin(p.y * 3.1 + uTime * 0.7 + s * 6.3),
    sin(p.z * 2.7 + uTime * 0.6 + s * 4.1) * 0.6 - 0.6 - s * 0.9,
    cos(p.x * 2.9 + uTime * 0.5 + s * 5.2)
  );
  p += drift * uHover * (0.08 + 0.24 * s);

  // Rotation: gentle breathing + pointer tilt.
  float cy = cos(uYaw), sy = sin(uYaw), cp = cos(uPitch), sp = sin(uPitch);
  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);
  p = vec3(p.x, cp * p.y - sp * p.z, sp * p.y + cp * p.z);

  float w = uCamZ - p.z; // distance in front of the camera
  if (w < 0.08) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }

  vec4 clip = vec4(p.x * FOCAL / uAspect, p.y * FOCAL, 0.0, w);

  // Pointer repulsion, computed in screen space so it feels local to the cursor.
  vec2 ndc = clip.xy / w;
  vec2 d = ndc - uPointer;
  d.x *= uAspect;
  float dist = length(d);
  float push = uPointerOn * smoothstep(0.32, 0.0, dist) * 0.09;
  vec2 dir = dist > 1e-4 ? d / dist : vec2(0.0);
  dir.x /= uAspect;
  ndc += dir * push;
  gl_Position = vec4(ndc * w, 0.0, w);

  float dark = 1.0 - aTone;
  gl_PointSize = uSize * (0.42 + 0.95 * dark) * (4.0 / w);

  // Glyphs flip 0 <-> 1 at their own slow rate.
  vGlyph = step(0.5, hash(s * 91.7 + floor(uTime * (0.12 + s * 0.55))));
  vAccent = step(0.985, s);
  float fadeIn = smoothstep(0.0, 0.35, k);
  float fadeScroll = 1.0 - smoothstep(0.55, 1.0, uScroll);
  // Far-travelling glyphs fade out while disintegrated, so nothing hits the canvas edge.
  float fadeHover = 1.0 - uHover * smoothstep(0.35, 1.0, s) * 0.75;
  vAlpha = (0.26 + 0.74 * dark) * fadeIn * fadeScroll * fadeHover;
}`;

const FS = /* glsl */ `#version 300 es
precision mediump float;
uniform sampler2D uAtlas;
uniform vec3 uInk, uAccentColor;
in float vAlpha;
in float vGlyph;
in float vAccent;
out vec4 outColor;
void main() {
  vec2 uv = vec2((gl_PointCoord.x + vGlyph) * 0.5, gl_PointCoord.y);
  float a = texture(uAtlas, uv).a * vAlpha;
  if (a < 0.01) discard;
  vec3 c = mix(uInk, uAccentColor, vAccent);
  outColor = vec4(c * a, a); // premultiplied
}`;

const U = ["uTime", "uIntro", "uHover", "uPointerOn", "uScroll", "uAspect", "uCamZ", "uSize", "uYaw", "uPitch", "uPointer", "uAtlas", "uInk", "uAccentColor"] as const;

interface PortraitData {
  count: number;
  pos: Float32Array;
  tone: Float32Array;
  seed: Float32Array;
}

export async function loadPortrait(url: string, maxPoints: number): Promise<PortraitData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`portrait data ${res.status}`);
  const buf = await res.arrayBuffer();
  const view = new DataView(buf);
  if (String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)) !== "BPT1") {
    throw new Error("portrait data: bad magic");
  }
  const total = view.getUint32(4, true);
  const sx = view.getFloat32(8, true) / 32767;
  const sy = view.getFloat32(12, true) / 32767;
  const sz = view.getFloat32(16, true) / 32767;
  const count = Math.min(total, maxPoints); // points are stored in random order: any prefix works
  const pos = new Float32Array(count * 3);
  const tone = new Float32Array(count);
  const seed = new Float32Array(count);
  for (let i = 0, o = 20; i < count; i++, o += 8) {
    pos[i * 3] = view.getInt16(o, true) * sx;
    pos[i * 3 + 1] = view.getInt16(o + 2, true) * sy;
    pos[i * 3 + 2] = view.getInt16(o + 4, true) * sz;
    tone[i] = view.getUint16(o + 6, true) / 65535;
    const h = Math.sin((i + 1) * 12.9898) * 43758.5453;
    seed[i] = h - Math.floor(h);
  }
  return { count, pos, tone, seed };
}

export interface PortraitOptions {
  dataUrl: string;
  /** Element whose scroll position drives the camera dolly (the hero section). */
  scrollTarget: HTMLElement;
  onReady?: () => void;
}

/** Mounts the portrait into `canvas`. Resolves to a cleanup function. Throws if WebGL2 is unavailable. */
export async function mountPortrait(canvas: HTMLCanvasElement, opts: PortraitOptions): Promise<() => void> {
  const gl = createContext(canvas);
  if (!gl) throw new Error("WebGL2 unavailable");

  const small = window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  const data = await loadPortrait(opts.dataUrl, small ? 9000 : 24000);

  const program = createProgram(gl, VS, FS);
  gl.useProgram(program);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  attribute(gl, program, "aPos", data.pos, 3);
  attribute(gl, program, "aTone", data.tone, 1);
  attribute(gl, program, "aSeed", data.seed, 1);
  const u = uniforms(gl, program, U);

  const atlas = await glyphAtlas(gl);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  gl.uniform1i(u.uAtlas, 0);

  const css = getComputedStyle(document.documentElement);
  gl.uniform3fv(u.uInk, rgb(css.getPropertyValue("--charcoal") || "#171719"));
  gl.uniform3fv(u.uAccentColor, rgb(css.getPropertyValue("--orange") || "#ff5a1f"));

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  // ---- Interaction state (all springs, so every transition settles physically) ----
  const hover = { value: 0, velocity: 0 };
  const pointerOn = { value: 0, velocity: 0 };
  const tilt = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0, inside: false, near: false };
  let hoverTarget = 0;
  let tapUntil = 0;
  let intro = 0;
  let visible = true;
  let lost = false;

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointer.near = Math.abs(pointer.x) < 1.3 && Math.abs(pointer.y) < 1.3;
    // Hover = over the figure itself (central band of the frame), mouse only.
    pointer.inside = e.pointerType === "mouse" && Math.abs(pointer.x) < 0.62 && Math.abs(pointer.y) < 0.9;
  };
  const onLeave = () => {
    pointer.inside = false;
    pointer.near = false;
  };
  // Touch: a tap shatters the face briefly, then it rebuilds.
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") tapUntil = performance.now() + 900;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown);

  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: "120px" });
  io.observe(canvas);

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
  });

  let readyFired = false;
  const stop = onFrame((t, dt) => {
    if (!visible || lost) return;
    fitCanvas(canvas, 1.5);
    gl.viewport(0, 0, canvas.width, canvas.height);

    intro = Math.min(1, intro + dt / 1.7); // D1: ~1.7 s reconstruction
    hoverTarget = pointer.inside || performance.now() < tapUntil ? 1 : 0;
    spring(hover, hoverTarget, dt, 60, 11);
    spring(pointerOn, pointer.near ? 1 : 0, dt, 90, 16);
    tilt.x += (pointer.near ? pointer.x : 0) * 0.5 * dt * 4 - tilt.x * dt * 2;
    tilt.y += (pointer.near ? pointer.y : 0) * 0.5 * dt * 4 - tilt.y * dt * 2;

    // D2: scroll progress through the hero → camera dollies into the face.
    const r = opts.scrollTarget.getBoundingClientRect();
    const scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.85)));
    const camZ = 4.0 - Math.pow(scroll, 1.15) * 3.2;

    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uIntro, intro);
    gl.uniform1f(u.uHover, Math.max(0, hover.value));
    gl.uniform1f(u.uPointerOn, Math.max(0, pointerOn.value));
    gl.uniform2f(u.uPointer, pointer.x, pointer.y);
    gl.uniform1f(u.uScroll, scroll);
    gl.uniform1f(u.uAspect, canvas.width / canvas.height);
    gl.uniform1f(u.uCamZ, camZ);
    gl.uniform1f(u.uSize, canvas.height / 100);
    gl.uniform1f(u.uYaw, Math.sin(t * 0.35) * 0.1 + tilt.x * 0.25);
    gl.uniform1f(u.uPitch, Math.sin(t * 0.27) * 0.035 - tilt.y * 0.12);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, data.count);

    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
  });

  return () => {
    stop();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("pointerdown", onDown);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
