/**
 * Ink page transition. Clicking an internal link drops ink at the click point:
 * it bursts out fast, then soaks across the paper slowly until the page is
 * covered; the next page loads underneath; then the stain slowly shrinks back
 * to the click point, revealing the new page.
 *
 * The edge uses the same fibre-torn SVG noise mask as the theme switch.
 * Hooked into Astro's ClientRouter via astro:before-preparation (the loader
 * waits for the ink to cover the page). Off under reduced motion.
 */
import { maskSvg, type Drop } from "./ink-transition";
import { EXPERIENCES } from "../config/site";

const SCALE = 0.25;
const COVER_MS = 950;
const REVEAL_MS = 1250;

let last = { x: window.innerWidth / 2, y: window.innerHeight / 2, t: 0 };
let active: { x: number; y: number; drops: Drop[]; seed: number } | null = null;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Fast burst, long slow soak (like ink hitting wet paper).
const soak = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function overlay() {
  return {
    root: document.querySelector<HTMLElement>("[data-ink-nav]"),
    core: document.querySelector<HTMLElement>("[data-ink-nav-core]"),
    fringe: document.querySelector<HTMLElement>("[data-ink-nav-fringe]"),
  };
}

function paint(r: number) {
  const { core, fringe } = overlay();
  if (!core || !fringe || !active) return;
  const W = window.innerWidth * SCALE;
  const H = window.innerHeight * SCALE;
  const cx = active.x * SCALE;
  const cy = active.y * SCALE;
  const url = (rr: number) => `url("data:image/svg+xml,${encodeURIComponent(maskSvg(W, H, cx, cy, rr * SCALE, active!.drops, active!.seed))}")`;
  const c = url(r);
  const f = url(r * 1.07 + 10);
  for (const [el, m] of [[core, c], [fringe, f]] as const) {
    el.style.setProperty("-webkit-mask-image", m);
    el.style.setProperty("mask-image", m);
  }
}

function animate(from: number, to: number, ms: number, ease: (t: number) => number) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      paint(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

const maxRadius = (x: number, y: number) => Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) * 1.15;

function accentFor(url: URL) {
  const path = "/" + (url.pathname.split("/")[1] ?? "");
  const accent = EXPERIENCES.find((e) => e.href === path)?.accent ?? "orange";
  return accent === "mono" ? "orange" : accent;
}

export function initInkNav() {
  // Remember where the visitor clicked (keyboard / palette navigation falls back to the centre).
  document.addEventListener(
    "pointerdown",
    (e) => (last = { x: e.clientX, y: e.clientY, t: performance.now() }),
    { capture: true, passive: true },
  );

  document.addEventListener("astro:before-preparation", (ev) => {
    const e = ev as Event & { loader: () => Promise<void>; to: URL; from: URL; navigationType: string };
    if (reduced() || e.navigationType === "traverse") return; // back/forward: stay instant
    const { root, fringe } = overlay();
    if (!root || !fringe) return;
    const recent = performance.now() - last.t < 1500;
    const x = recent ? last.x : window.innerWidth / 2;
    const y = recent ? last.y : window.innerHeight / 2;
    active = {
      x,
      y,
      seed: Math.floor(Math.random() * 1000),
      drops: Array.from({ length: 8 }, () => ({
        angle: Math.random() * Math.PI * 2,
        dist: 0.9 + Math.random() * 0.6,
        size: 0.06 + Math.random() * 0.14,
        delay: Math.random() * 0.1,
      })),
    };
    fringe.style.background = `var(--${accentFor(e.to)})`;
    paint(0);
    root.classList.add("on");
    document.documentElement.classList.add("ink-nav");
    const original = e.loader;
    const cover = animate(0, maxRadius(x, y), COVER_MS, soak);
    e.loader = async () => {
      await Promise.all([cover, original()]);
    };
  });

  document.addEventListener("astro:page-load", async () => {
    const { root } = overlay();
    if (!active || !root?.classList.contains("on")) return;
    await new Promise((r) => setTimeout(r, 80));
    await animate(maxRadius(active.x, active.y), 0, REVEAL_MS, easeInOut);
    root.classList.remove("on");
    document.documentElement.classList.remove("ink-nav");
    active = null;
  });
}
