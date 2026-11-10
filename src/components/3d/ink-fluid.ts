/**
 * Ink-in-water background: a GPU stable-fluids simulation (advection,
 * vorticity confinement, Jacobi pressure solve) stirred by the pointer.
 * Dye colours cycle through the site accents. On Paper the dye stains the
 * paper; on Ink it glows. Runs on the shared frame loop, at low resolution.
 *
 * Technique after Jos Stam "Stable Fluids" (1999) and the well-known WebGL
 * fluid demos; written for this site in WebGL2.
 */
import { createPrograms, rgb } from "../../lib/gl";
import { onFrame } from "../../lib/frame";
import { currentTheme, onThemeChange } from "../../lib/theme";

const VS = /* glsl */ `#version 300 es
in vec2 aPos;
uniform vec2 texel;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0); vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y); vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const head = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 o;
`;

const FS = {
  splat: head + `uniform sampler2D uTarget; uniform float aspect, radius; uniform vec3 color; uniform vec2 point;
    void main() { vec2 p = vUv - point; p.x *= aspect; vec3 s = exp(-dot(p, p) / radius) * color;
      o = vec4(texture(uTarget, vUv).xyz + s, 1.0); }`,
  advect: head + `uniform sampler2D uVelocity, uSource; uniform vec2 simTexel; uniform float dt, dissipation;
    void main() { vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
      o = texture(uSource, coord) / (1.0 + dissipation * dt); }`,
  divergence: head + `uniform sampler2D uVelocity;
    void main() { float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x, T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
      vec2 C = texture(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
      o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0); }`,
  curl: head + `uniform sampler2D uVelocity;
    void main() { float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y, T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
      o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0); }`,
  vorticity: head + `uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
    void main() { float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
      vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 1e-4; f *= curl * C; f.y *= -1.0;
      vec2 v = texture(uVelocity, vUv).xy + f * dt; o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0); }`,
  pressure: head + `uniform sampler2D uPressure, uDivergence;
    void main() { float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0); }`,
  gradient: head + `uniform sampler2D uPressure, uVelocity;
    void main() { float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B); o = vec4(v, 0.0, 1.0); }`,
  clear: head + `uniform sampler2D uTexture; uniform float value; void main() { o = value * texture(uTexture, vUv); }`,
  // Paper soaks the ink up: the stain keeps the strongest dye that passed, then slowly dries/lightens.
  absorb: head + `uniform sampler2D uStain, uDye; uniform float dt, fade;
    void main() { vec3 st = texture(uStain, vUv).rgb * (1.0 - fade * dt); vec3 d = texture(uDye, vUv).rgb;
      o = vec4(max(st, d * 0.6), 1.0); }`,
  display: head + `uniform sampler2D uDye, uStain; uniform vec3 uBg, uInkBg; uniform float uStrength, uDark, uPaper, uTime;
    // Dark sections on paper pages (rounded rects in px, gl coords): true black + neon ink inside.
    uniform vec4 uRect[4]; uniform float uRad[4]; uniform int uCount;
    float sdRound(vec2 p, vec4 r, float rad) { vec2 c = (r.xy + r.zw) * 0.5, b = (r.zw - r.xy) * 0.5 - rad;
      vec2 q = abs(p - c) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad; }
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { s += a * vn(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
    void main() {
      // ---- liquid layer (water) ----
      vec3 c = texture(uDye, vUv).rgb * uStrength;
      float a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
      vec3 tint = c / max(a, 1e-3);
      vec3 paper = mix(uBg, tint, min(a, 0.38));
      vec3 night = uBg + c * 0.75;
      vec3 liquid = mix(paper, night, uDark);

      // ---- paper-bleed layer: ink absorbed into paper fibres ----
      vec3 sc = texture(uStain, vUv).rgb;
      float amt = max(sc.r, max(sc.g, sc.b));
      vec3 stint = sc / max(amt, 1e-3);
      vec2 px = gl_FragCoord.xy;
      // Fibres: long, mostly-horizontal streaks + fine grain — they make the edge feather.
      float fib = fbm(px * vec2(0.035, 0.11)) * 0.65 + fbm(px * 0.22) * 0.35;
      float edge = 0.075 + 0.13 * fib;
      float body = smoothstep(edge, edge + 0.14, amt);
      // Darker "tide line" where the wet edge dried (coffee-ring effect).
      float rim = smoothstep(edge, edge + 0.03, amt) * (1.0 - smoothstep(edge + 0.03, edge + 0.12, amt));
      float mottle = 0.85 + 0.3 * fbm(px * 0.06);
      float alpha = min(0.32, (body * 0.2 * mottle + rim * 0.2));
      vec3 bleedPaper = mix(uBg, stint * 0.88, alpha);
      vec3 bleedNight = uBg + stint * (body * 0.22 + rim * 0.18);
      vec3 bleed = mix(bleedPaper, bleedNight, uDark);
      // A faint wet sheen of the moving water stays on top of the stains.
      bleed = mix(bleed, liquid, 0.25);

      vec3 lit = mix(liquid, bleed, uPaper);

      // ---- neon on black: dark pages / dark-mode and dark sections ----
      float inDark = 0.0;
      for (int k = 0; k < 4; k++) { if (k >= uCount) break;
        inDark = max(inDark, 1.0 - smoothstep(-1.0, 1.0, sdRound(gl_FragCoord.xy, uRect[k], uRad[k]))); }
      vec3 dyeRaw = texture(uDye, vUv).rgb;
      // Faded, light washes on black (same softness as on paper): desaturate + lighten.
      vec3 dyeSoft = mix(dyeRaw, vec3(dot(dyeRaw, vec3(0.333))), 0.35);
      vec3 stSoft = mix(sc, vec3(dot(sc, vec3(0.333))), 0.35);
      vec3 neon = uInkBg + dyeSoft * 0.3 + stSoft * 0.2 * (body * 0.8 + rim) * uPaper;
      // Cosmic layer on black (refs: stardust galaxy, plasma glow): drifting nebula + twinkling dust.
      vec2 q = gl_FragCoord.xy / 900.0 + vec2(uTime * 0.004, -uTime * 0.002);
      float neb = fbm(q * 2.2 + fbm(q * 3.0 + uTime * 0.01));
      vec3 nebCol = mix(vec3(0.18, 0.22, 0.55), vec3(0.42, 0.3, 0.7), fbm(q * 1.3 + 7.0));
      neon += nebCol * smoothstep(0.45, 0.85, neb) * 0.09;
      vec2 cell = floor(gl_FragCoord.xy / 3.0);
      float star = step(0.9975, h(cell));
      float tw = 0.5 + 0.5 * sin(uTime * (0.6 + 2.0 * h(cell + 3.1)) + h(cell) * 40.0);
      neon += vec3(0.85, 0.88, 1.0) * star * tw * (0.35 + 0.65 * smoothstep(0.4, 0.8, neb));
      o = vec4(mix(lit, neon, max(uDark, inDark)), 1.0);
    }`,
};

type FBO = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };

export type InkAccent = "orange" | "blue" | "lime" | "lavender";
/** Live controls (used by the /playground page; production uses the defaults). */
export interface InkController {
  /** Which accent inks are dropped (default: all four). */
  setPalette(accents: InkAccent[]): void;
  /** Fast scrolling drags the ink in streaks. */
  setScrollReactive(on: boolean): void;
  /** A burst of colour wherever the visitor clicks. */
  setClickDrops(on: boolean): void;
  /** "paper": ink soaks into paper fibres and leaves stains; "liquid": ink only swirls in water. */
  setMode(mode: "paper" | "liquid"): void;
  /** Show / hide (and pause) the simulation. */
  setEnabled(on: boolean): void;
  destroy(): void;
}
type Double = { read: FBO; write: FBO; swap(): void };

export async function mountInkFluid(canvas: HTMLCanvasElement, opts: { mode?: "paper" | "liquid"; clickDrops?: boolean } = {}): Promise<InkController> {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: false });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) throw new Error("float render targets unavailable");

  const small = window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4;
  const SIM = small ? 96 : 128;
  const DYE = small ? 320 : 640;
  const ITER = small ? 10 : 18;

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

  // Shaders compile in the background (no main-thread freeze).
  const names = Object.keys(FS) as (keyof typeof FS)[];
  const compiled = await createPrograms(gl, names.map((k) => [VS, FS[k]]));
  const progs = Object.fromEntries(
    names.map((k, i) => {
      const p = compiled[i];
      const loc = gl.getAttribLocation(p, "aPos");
      return [k, { p, loc, u: (n: string) => gl.getUniformLocation(p, n) }];
    }),
  ) as Record<keyof typeof FS, { p: WebGLProgram; loc: number; u: (n: string) => WebGLUniformLocation | null }>;

  const fbo = (w: number, h: number): FBO => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h };
  };
  const double = (w: number, h: number): Double => {
    const d = { read: fbo(w, h), write: fbo(w, h), swap() { const t = d.read; d.read = d.write; d.write = t; } };
    return d;
  };
  const dims = (res: number) => {
    const a = window.innerWidth / window.innerHeight;
    return a > 1 ? { w: Math.round(res * a), h: res } : { w: res, h: Math.round(res / a) };
  };

  let s = dims(SIM);
  let d = dims(DYE);
  let velocity = double(s.w, s.h);
  let dye = double(d.w, d.h);
  let stain = double(d.w, d.h);
  let pressure = double(s.w, s.h);
  let divergence = fbo(s.w, s.h);
  let curlFbo = fbo(s.w, s.h);

  const run = (name: keyof typeof FS, target: FBO | null, set: (u: (n: string) => WebGLUniformLocation | null) => void, texel: [number, number]) => {
    const { p, loc, u } = progs[name];
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(u("texel"), texel[0], texel[1]);
    set(u);
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  };
  let unit = 0;
  const bindTex = (tex: WebGLTexture) => {
    const i = unit++ % 8;
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return i;
  };

  // ---------- palette & theme ----------
  const css = getComputedStyle(document.documentElement);
  const ACCENTS: Record<InkAccent, [number, number, number]> = {
    orange: rgb(css.getPropertyValue("--orange") || "#ff5a1f"),
    blue: rgb(css.getPropertyValue("--blue") || "#386bff"),
    lime: rgb(css.getPropertyValue("--lime") || "#c8ff00"),
    lavender: rgb(css.getPropertyValue("--lavender") || "#a78bfa"),
  };
  let PALETTE = (["orange", "blue", "lime", "lavender"] as InkAccent[]).map((k) => ACCENTS[k]);
  let ci = 0;
  let enabled = true;
  let scrollReactive = false;
  let clickDrops = opts.clickDrops ?? false;
  let paperMode = opts.mode === "liquid" ? 0 : 1;
  const nextColor = (k: number) => {
    const c = PALETTE[ci++ % PALETTE.length];
    return [c[0] * k, c[1] * k, c[2] * k] as [number, number, number];
  };
  let bg = rgb("#f0f0ee");
  const inkBg = rgb(getComputedStyle(document.documentElement).getPropertyValue("--ink") || "#080809");
  // Elements that render as true black with neon ink (data-ink-dark); refreshed per page.
  let darkEls: HTMLElement[] = [];
  const collectDark = () => (darkEls = Array.from(document.querySelectorAll<HTMLElement>("[data-ink-dark]")));
  collectDark();
  document.addEventListener("astro:page-load", collectDark);
  /** clip-path: inset(t r b l round R) -> px [t, r, b, l, R]. */
  const parseInset = (cp: string, w: number, h: number) => {
    const m = cp && cp.match(/inset\(([^)]*)\)/);
    if (!m) return [0, 0, 0, 0, 0];
    const [box, round] = m[1].split("round");
    const v = box.trim().split(/\s+/).map((t, i) => (t.endsWith("%") ? (parseFloat(t) / 100) * (i % 2 ? w : h) : parseFloat(t) || 0));
    const [t, r = t, b = t, l = r] = v;
    return [t, r, b, l, round ? parseFloat(round) || 0 : 0];
  };
  let dark = 0;
  const applyTheme = () => {
    const isDark = currentTheme() === "dark" || document.documentElement.dataset.surface === "ink";
    dark = isDark ? 1 : 0;
    bg = rgb(getComputedStyle(document.documentElement).getPropertyValue(isDark ? "--ink" : "--paper") || "#f0f0ee");
  };
  applyTheme();
  const offTheme = onThemeChange(applyTheme);
  document.addEventListener("astro:after-swap", applyTheme);

  // ---------- splats ----------
  const splat = (x: number, y: number, dx: number, dy: number, color: [number, number, number], radius = 0.0022) => {
    const aspect = canvas.width / canvas.height;
    run("splat", velocity.write, (u) => {
      gl.uniform1i(u("uTarget"), bindTex(velocity.read.tex));
      gl.uniform1f(u("aspect"), aspect);
      gl.uniform2f(u("point"), x, y);
      gl.uniform3f(u("color"), dx, dy, 0);
      gl.uniform1f(u("radius"), radius);
    }, [1 / s.w, 1 / s.h]);
    velocity.swap();
    run("splat", dye.write, (u) => {
      gl.uniform1i(u("uTarget"), bindTex(dye.read.tex));
      gl.uniform1f(u("aspect"), aspect);
      gl.uniform2f(u("point"), x, y);
      gl.uniform3f(u("color"), ...color);
      gl.uniform1f(u("radius"), radius);
    }, [1 / d.w, 1 / d.h]);
    dye.swap();
  };

  const pointer = { x: 0, y: 0, px: 0, py: 0, moved: false, init: false };
  const onMove = (e: PointerEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight;
    if (!pointer.init) {
      pointer.px = x;
      pointer.py = y;
      pointer.init = true;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.moved = true;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  // Optional: click drops a burst of ink.
  const onDown = (e: PointerEvent) => {
    if (!clickDrops || !enabled) return;
    const x = e.clientX / window.innerWidth;
    const y = 1 - e.clientY / window.innerHeight;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      splat(x, y, Math.cos(a) * 1100, Math.sin(a) * 1100, nextColor(0.38), 0.0026);
    }
  };
  window.addEventListener("pointerdown", onDown, { passive: true });

  // Optional: scrolling drags the ink in vertical streaks.
  let lastScroll = window.scrollY;
  let scrollVel = 0;
  const onScrollInk = () => {
    scrollVel += window.scrollY - lastScroll;
    lastScroll = window.scrollY;
  };
  window.addEventListener("scroll", onScrollInk, { passive: true });

  // A few drops to start, so the water is never empty.
  const drop = () => {
    const a = Math.random() * Math.PI * 2;
    splat(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, Math.cos(a) * 900, Math.sin(a) * 900, nextColor(0.55), 0.004);
  };
  for (let i = 0; i < 4; i++) drop();
  let ambient = 0;
  let colorTimer = 0;
  let current = nextColor(0.24);

  const resize = () => {
    const w = Math.round(window.innerWidth);
    const h = Math.round(window.innerHeight);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };
  resize();
  window.addEventListener("resize", resize);

  const CURL = 22;
  const stop = onFrame((_t, dtRaw) => {
    if (!enabled) return;
    const dt = Math.min(dtRaw, 1 / 60);
    if (scrollReactive && Math.abs(scrollVel) > 2) {
      const v = Math.max(-80, Math.min(80, scrollVel));
      for (let i = 0; i < 2; i++) splat(Math.random(), 0.2 + Math.random() * 0.6, 0, v * 60, nextColor(0.3), 0.003);
    }
    scrollVel *= 0.5;
    resize();

    colorTimer += dt;
    if (colorTimer > 1.4) {
      colorTimer = 0;
      current = nextColor(0.24);
    }
    if (pointer.moved) {
      pointer.moved = false;
      const dx = (pointer.x - pointer.px) * 5200;
      const dy = (pointer.y - pointer.py) * 5200;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) splat(pointer.x, pointer.y, dx, dy, current);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
    }
    ambient += dt;
    if (ambient > 3.2) {
      ambient = 0;
      drop();
    }

    const sT: [number, number] = [1 / s.w, 1 / s.h];
    run("curl", curlFbo, (u) => gl.uniform1i(u("uVelocity"), bindTex(velocity.read.tex)), sT);
    run("vorticity", velocity.write, (u) => {
      gl.uniform1i(u("uVelocity"), bindTex(velocity.read.tex));
      gl.uniform1i(u("uCurl"), bindTex(curlFbo.tex));
      gl.uniform1f(u("curl"), CURL);
      gl.uniform1f(u("dt"), dt);
    }, sT);
    velocity.swap();
    run("divergence", divergence, (u) => gl.uniform1i(u("uVelocity"), bindTex(velocity.read.tex)), sT);
    run("clear", pressure.write, (u) => {
      gl.uniform1i(u("uTexture"), bindTex(pressure.read.tex));
      gl.uniform1f(u("value"), 0.8);
    }, sT);
    pressure.swap();
    for (let i = 0; i < ITER; i++) {
      run("pressure", pressure.write, (u) => {
        gl.uniform1i(u("uPressure"), bindTex(pressure.read.tex));
        gl.uniform1i(u("uDivergence"), bindTex(divergence.tex));
      }, sT);
      pressure.swap();
    }
    run("gradient", velocity.write, (u) => {
      gl.uniform1i(u("uPressure"), bindTex(pressure.read.tex));
      gl.uniform1i(u("uVelocity"), bindTex(velocity.read.tex));
    }, sT);
    velocity.swap();
    run("advect", velocity.write, (u) => {
      const t = bindTex(velocity.read.tex);
      gl.uniform1i(u("uVelocity"), t);
      gl.uniform1i(u("uSource"), t);
      gl.uniform2f(u("simTexel"), sT[0], sT[1]);
      gl.uniform1f(u("dt"), dt);
      gl.uniform1f(u("dissipation"), 0.25);
    }, sT);
    velocity.swap();
    run("advect", dye.write, (u) => {
      gl.uniform1i(u("uVelocity"), bindTex(velocity.read.tex));
      gl.uniform1i(u("uSource"), bindTex(dye.read.tex));
      gl.uniform2f(u("simTexel"), sT[0], sT[1]);
      gl.uniform1f(u("dt"), dt);
      gl.uniform1f(u("dissipation"), 0.55);
    }, [1 / d.w, 1 / d.h]);
    dye.swap();

    if (paperMode) {
      run("absorb", stain.write, (u) => {
        gl.uniform1i(u("uStain"), bindTex(stain.read.tex));
        gl.uniform1i(u("uDye"), bindTex(dye.read.tex));
        gl.uniform1f(u("dt"), dt);
        gl.uniform1f(u("fade"), 0.16); // stains dry out over ~6 s
      }, [1 / d.w, 1 / d.h]);
      stain.swap();
    }

    // Dark sections: rects (with their animated clip-path inset) in GL pixel coords.
    const rects: number[] = [];
    const rads: number[] = [];
    for (const el of darkEls) {
      if (rects.length >= 16) break;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) continue;
      const cp = getComputedStyle(el).clipPath;
      if (el.dataset.opening !== undefined || cp.startsWith("circle") || cp.startsWith("polygon")) continue; // still opening: it paints its own black
      const ins = parseInset(cp, r.width, r.height);
      const x0 = r.left + ins[3], x1 = r.right - ins[1];
      const y0 = window.innerHeight - (r.bottom - ins[2]), y1 = window.innerHeight - (r.top + ins[0]);
      if (x1 <= x0 || y1 <= y0) continue;
      rects.push(x0, y0, x1, y1);
      rads.push(Math.min(ins[4], (x1 - x0) / 2, (y1 - y0) / 2));
    }
    const count = rects.length / 4;
    while (rects.length < 16) rects.push(0, 0, 0, 0);
    while (rads.length < 4) rads.push(0);

    run("display", null, (u) => {
      gl.uniform4fv(u("uRect"), rects);
      gl.uniform1fv(u("uRad"), rads);
      gl.uniform1i(u("uCount"), count);
      gl.uniform3f(u("uInkBg"), inkBg[0], inkBg[1], inkBg[2]);
      gl.uniform1f(u("uTime"), performance.now() / 1000);
      gl.uniform1i(u("uDye"), bindTex(dye.read.tex));
      gl.uniform1i(u("uStain"), bindTex(stain.read.tex));
      gl.uniform1f(u("uPaper"), paperMode);
      gl.uniform3f(u("uBg"), bg[0], bg[1], bg[2]);
      gl.uniform1f(u("uStrength"), dark ? 0.5 : 0.32);
      gl.uniform1f(u("uDark"), dark);
    }, [1 / canvas.width, 1 / canvas.height]);
  });

  // Rebuild buffers when the aspect changes a lot (e.g. rotate a phone).
  let lastAspect = window.innerWidth / window.innerHeight;
  const onResizeSim = () => {
    const a = window.innerWidth / window.innerHeight;
    if (Math.abs(a - lastAspect) < 0.25) return;
    lastAspect = a;
    s = dims(SIM);
    d = dims(DYE);
    velocity = double(s.w, s.h);
    dye = double(d.w, d.h);
    pressure = double(s.w, s.h);
    divergence = fbo(s.w, s.h);
    curlFbo = fbo(s.w, s.h);
    stain = double(d.w, d.h);
  };
  window.addEventListener("resize", onResizeSim);

  const destroy = () => {
    stop();
    offTheme();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("scroll", onScrollInk);
    window.removeEventListener("resize", resize);
    window.removeEventListener("resize", onResizeSim);
    document.removeEventListener("astro:after-swap", applyTheme);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  return {
    setPalette(accents) {
      if (accents.length) PALETTE = accents.map((k) => ACCENTS[k]);
      current = nextColor(0.35);
    },
    setScrollReactive: (on) => void (scrollReactive = on),
    setClickDrops: (on) => void (clickDrops = on),
    setMode: (mode) => void (paperMode = mode === "paper" ? 1 : 0),
    setEnabled(on) {
      enabled = on;
      canvas.style.visibility = on ? "" : "hidden";
    },
    destroy,
  };
}
