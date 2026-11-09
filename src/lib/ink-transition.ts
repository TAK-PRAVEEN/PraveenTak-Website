/**
 * Ink-drop theme transition.
 *
 * The new theme is revealed through a mask shaped like ink bleeding into
 * paper: a growing drop whose edge is torn into fibres by fractal noise
 * (feTurbulence + feDisplacementMap), with satellite droplets that merge into
 * the main stain. Fast at first, slowing as it soaks out — like real ink.
 *
 * Mechanism: View Transitions API. The browser snapshots the old page; we
 * switch the theme; the new page is shown through an SVG mask that we redraw
 * every frame. The mask is rendered at ¼ resolution (cheap turbulence) and
 * scaled up, which also softens the edge into a wet bleed.
 *
 * Falls back to an instant switch without View Transitions or under reduced motion.
 */

const SCALE = 0.25; // mask resolution relative to the viewport
const DURATION = 1250; // ms

export interface Drop {
  angle: number;
  dist: number; // relative to main radius
  size: number; // relative to main radius
  delay: number; // 0..1 of the timeline
}

export function maskSvg(w: number, h: number, cx: number, cy: number, r: number, drops: Drop[], seed: number): string {
  const disp = Math.min(16, 3 + r * 0.18); // fibre tearing grows with the stain, then caps
  let shapes = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/>`;
  for (const d of drops) {
    const k = Math.max(0, Math.min(1, (r / (Math.hypot(w, h) || 1) - d.delay) * 4));
    if (k <= 0) continue;
    const dr = r * d.dist;
    const sx = cx + Math.cos(d.angle) * dr;
    const sy = cy + Math.sin(d.angle) * dr;
    shapes += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(r * d.size * k).toFixed(1)}"/>`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" preserveAspectRatio="none">` +
    `<filter id="i" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="${disp.toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
    `<feGaussianBlur in="d" stdDeviation="0.45"/>` +
    `</filter>` +
    `<g fill="#fff" filter="url(#i)">${shapes}</g></svg>`
  );
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3.2);

export async function inkTransition(origin: HTMLElement | null, change: () => void): Promise<void> {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  if (reduced || !doc.startViewTransition) {
    change();
    return;
  }

  const W = window.innerWidth;
  const H = window.innerHeight;
  const box = origin?.getBoundingClientRect();
  const ox = box ? box.left + box.width / 2 : W / 2;
  const oy = box ? box.top + box.height / 2 : H / 2;
  // Radius that reaches the farthest corner, plus margin for the torn edge.
  const maxR = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) * 1.12;

  const w = W * SCALE;
  const h = H * SCALE;
  const cx = ox * SCALE;
  const cy = oy * SCALE;
  const seed = Math.floor(Math.random() * 1000);
  const drops: Drop[] = Array.from({ length: 9 }, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: 0.95 + Math.random() * 0.55,
    size: 0.08 + Math.random() * 0.16,
    delay: Math.random() * 0.12,
  }));

  const style = document.createElement("style");
  document.head.append(style);
  const root = document.documentElement;
  root.classList.add("ink-transition");

  const setMask = (r: number) => {
    const url = `url("data:image/svg+xml,${encodeURIComponent(maskSvg(w, h, cx, cy, r, drops, seed))}")`;
    style.textContent = `::view-transition-new(root){-webkit-mask-image:${url};mask-image:${url};}`;
  };
  setMask(0);

  const vt = doc.startViewTransition(change);
  try {
    await vt.ready;
  } catch {
    style.remove();
    root.classList.remove("ink-transition");
    return;
  }

  const start = performance.now();
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setMask(easeOut(t) * maxR * SCALE);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });

  // Stain complete: drop the mask so the new page is fully, crisply shown.
  style.textContent = "::view-transition-new(root){-webkit-mask-image:none;mask-image:none;}";
  await vt.finished.catch(() => {});
  style.remove();
  root.classList.remove("ink-transition");
}
