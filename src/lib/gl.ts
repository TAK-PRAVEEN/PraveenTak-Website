/**
 * Minimal WebGL2 helpers for the point-sprite signatures. Deliberately tiny:
 * both effects are a single draw call, so a full 3D engine is not needed on
 * the home page (DESIGN.md §8 — budgets).
 */

export function createContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  return canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  });
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return sh;
}

export function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Program link failed: ${gl.getProgramInfoLog(p)}`);
  return p;
}

/** Upload a Float32Array as an attribute of `size` components. */
export function attribute(gl: WebGL2RenderingContext, program: WebGLProgram, name: string, data: Float32Array, size: number) {
  const loc = gl.getAttribLocation(program, name);
  if (loc < 0) return;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}

export function uniforms<K extends string>(gl: WebGL2RenderingContext, program: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)])) as Record<K, WebGLUniformLocation | null>;
}

/**
 * Two-cell glyph atlas: "0" | "1", white on transparent, in Space Mono Bold.
 * Falls back to the system monospace if the webfont is unavailable.
 */
export async function glyphAtlas(gl: WebGL2RenderingContext, cell = 64): Promise<WebGLTexture> {
  try {
    await document.fonts.load(`700 ${cell}px "Space Mono"`);
  } catch {
    /* fall back silently */
  }
  const c = document.createElement("canvas");
  c.width = cell * 2;
  c.height = cell;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${cell * 0.92}px "Space Mono", ui-monospace, monospace`;
  ctx.fillText("0", cell * 0.5, cell * 0.54);
  ctx.fillText("1", cell * 1.5, cell * 0.54);

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** CSS hex (#rrggbb) → normalised RGB triple. */
export function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.trim().replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Resize the drawing buffer to the element's CSS size × capped DPR. Returns true if changed. */
export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 1.5): boolean {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}
