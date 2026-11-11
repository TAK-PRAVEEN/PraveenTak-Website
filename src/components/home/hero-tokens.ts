/**
 * Hero background: a "token stream". Rows of ML tokens drift left at different depths,
 * with a few in orange, while one line is typed out like a model generating text.
 * Plain 2D canvas; pauses off-screen; one still frame for reduced motion.
 */
const ORANGE = "#ff5a1f";
const FONT = "'Space Mono', monospace";

const VOCAB = (
  "attention softmax ∇L embed relu <bos> <eos> 0.9821 logits token q·kᵀ/√d layer_norm dropout(0.1) " +
  "argmax 1e-4 batch=32 epoch 12 adam β₁ loss↓ yolo11 bbox conf=0.91 opencv flutter supabase rls 16/16 pads " +
  "jaipur praveen tak ai/ml engineer forward() backward() grad ∑ σ(x) tanh conv2d 3×3 stride=2 → ✓ #ff5a1f"
).split(" ");
const LINES = [
  "praveen.generate(prompt) → AI systems that ship",
  "detect(pads=16) → reading 16/16 · conf 0.97",
  "deploy --edge → praveentak.dev ✓",
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

type Row = { y: number; size: number; speed: number; x: number; a: number; words: { s: string; hot: boolean }[] };

/** Mount the token stream into `canvas`, sized to `host`; returns a cleanup function. */
export function mountHeroTokens(canvas: HTMLCanvasElement, host: HTMLElement) {
  const g = canvas.getContext("2d");
  if (!g) return () => {};
  const small = matchMedia("(max-width: 767px)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0, h = 0, anchorY = 0; // anchorY: phone — just below the hero buttons (free space for the typed line)
  let rows: Row[] = [];
  let mx = 0, tx = 0, t = 0, last = performance.now();
  let li = 0, typed = 0, pause = 0;
  let visible = true, raf = 0;

  const build = () => {
    rows = [];
    for (let y = 20; y < h; ) {
      const depth = Math.random();
      const size = small ? 9 + depth * 4 : 10 + depth * 7;
      rows.push({
        y, size, speed: 12 + depth * 40, x: rand(-400, 0),
        a: small ? 0.03 + depth * 0.06 : 0.035 + depth * 0.09,
        words: Array.from({ length: 60 }, () => ({ s: VOCAB[(Math.random() * VOCAB.length) | 0], hot: Math.random() < 0.015 })),
      });
      y += size * 1.9;
    }
  };
  const resize = () => {
    const r = host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    const changed = r.width !== w || r.height !== h;
    w = r.width; h = r.height;
    const a = host.querySelector(".hero-actions")?.getBoundingClientRect();
    anchorY = a ? a.bottom - r.top : h * 0.6;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (changed) build();
    if (reduce) draw(0);
  };

  function draw(dt: number) {
    t += dt;
    mx += (tx - mx) * 0.05;
    const fg = document.documentElement.dataset.theme === "dark" ? "#f0f0ee" : "#080809";
    const paper = fg === "#080809" ? "#f0f0ee" : "#080809";
    g!.clearRect(0, 0, w, h);

    for (const r of rows) {
      r.x -= r.speed * dt * (1 + mx * 0.4);
      g!.font = `${r.size}px ${FONT}`;
      let x = r.x;
      for (let i = 0; x < w; i = (i + 1) % r.words.length) {
        const word = r.words[i], tw = g!.measureText(word.s).width;
        if (x + tw > 0) {
          g!.fillStyle = word.hot ? rgba(ORANGE, 0.55) : rgba(fg, r.a);
          g!.fillText(word.s, x, r.y);
        }
        x += tw + r.size;
      }
      // Once the first word has left the screen, move it to the end of the row.
      const fw = g!.measureText(r.words[0].s).width + r.size;
      if (r.x < -fw) { r.x += fw; r.words.push(r.words.shift()!); }
    }

    // The typed line: top-right on laptops; on phones shrunk to fit, under the buttons.
    const s = LINES[li];
    if (reduce) typed = s.length;
    else if (typed < s.length) typed += dt * 22;
    else if ((pause += dt) > 2.2) { li = (li + 1) % LINES.length; typed = 0; pause = 0; }
    const shown = s.slice(0, Math.floor(typed));
    let size = small ? 13 : 17;
    g!.font = `${size}px ${FONT}`;
    let tw = g!.measureText(s).width;
    if (small && tw > w - 32) {
      size = Math.max(9, Math.floor((size * (w - 32)) / tw));
      g!.font = `${size}px ${FONT}`;
      tw = g!.measureText(s).width;
    }
    const x = small ? 16 : w - tw - 48, y = small ? anchorY + 44 : 150;
    if (small) { g!.fillStyle = rgba(paper, 0.85); g!.fillRect(x - 6, y - size - 4, tw + size + 14, size + 12); }
    g!.fillStyle = rgba(fg, 0.85);
    g!.fillText(shown, x, y);
    if (reduce || Math.floor(t * 2) % 2 === 0) {
      g!.fillStyle = ORANGE;
      g!.fillRect(x + g!.measureText(shown).width + 3, y - size + 3, size * 0.55, size);
    }
  }

  function loop(now: number) {
    raf = 0;
    if (!visible) return;
    draw(Math.min(0.05, (now - last) / 1000));
    last = now;
    raf = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  io.observe(host);
  const move = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
  };
  // Clicking empty hero space lights up a handful of tokens.
  const click = (e: MouseEvent) => {
    if ((e.target as Element).closest("a,button")) return;
    rows.forEach((r) => r.words.forEach((wd) => (wd.hot = Math.random() < 0.12)));
    if (reduce) draw(0);
  };
  addEventListener("pointermove", move, { passive: true });
  host.addEventListener("click", click);
  if (reduce) draw(0);

  return () => {
    cancelAnimationFrame(raf); raf = 0; visible = false;
    ro.disconnect(); io.disconnect();
    removeEventListener("pointermove", move);
    host.removeEventListener("click", click);
  };
}
