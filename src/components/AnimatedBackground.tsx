// Site-wide flowing dark gradient background + interactive dot-grid.
// Sits behind all content (fixed, -z-10) and is purely decorative.
import { useEffect, useRef } from "react";

// ---- Interactive graph-paper dot grid --------------------------------
// Small square dots on a regular grid. Dots near the cursor scatter away
// (spring physics) and glow brighter, then settle back into the grid.
const SPACING = 32; // px between dots
const RADIUS = 130; // cursor influence radius (px)
const FORCE = 22; // max scatter push (px)
const SPRING = 0.085; // return-to-grid stiffness
const DAMP = 0.86; // velocity damping

interface Dot {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

const DotGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dots: Dot[] = [];
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const build = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = SPACING / 2; x < w; x += SPACING) {
          dots.push({ x, y, ox: 0, oy: 0, vx: 0, vy: 0 });
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    // Tap/click → an immediate outward burst near the point (tactile on touch,
    // and a fun pop on desktop clicks too).
    const burst = (px: number, py: number) => {
      for (const d of dots) {
        const dx = d.x + d.ox - px;
        const dy = d.y + d.oy - py;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const f = (1 - dist / RADIUS) * FORCE * 1.6;
          d.vx += (dx / dist) * f;
          d.vy += (dy / dist) * f;
        }
      }
    };
    const onDown = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      burst(e.clientX, e.clientY);
    };
    // On touch, settle the grid once the finger lifts (mouse keeps following).
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") onLeave();
    };

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        // Scatter away from the cursor with a soft falloff.
        const dx = d.x + d.ox - mouse.x;
        const dy = d.y + d.oy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const f = (1 - dist / RADIUS) * FORCE;
          d.vx += (dx / dist) * f * 0.12;
          d.vy += (dy / dist) * f * 0.12;
        }
        // Spring back to the grid position.
        d.vx += -d.ox * SPRING;
        d.vy += -d.oy * SPRING;
        d.vx *= DAMP;
        d.vy *= DAMP;
        d.ox += d.vx;
        d.oy += d.vy;

        // Displaced dots grow + glow ("come out"), resting dots stay subtle.
        const disp = Math.min(1, Math.hypot(d.ox, d.oy) / FORCE);
        const size = 2 + disp * 2.5;
        const alpha = 0.08 + disp * 0.5;
        ctx.fillStyle = `rgba(151, 168, 255, ${alpha})`;
        ctx.fillRect(d.x + d.ox - size / 2, d.y + d.oy - size / 2, size, size);
      }

      raf = requestAnimationFrame(tick);
    };

    build();
    window.addEventListener("resize", build);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />;
};

const AnimatedBackground = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden animated-gradient-bg"
    >
      {/* Soft floating colour blobs for depth and motion (gradient stays) */}
      <span className="bg-blob blob-1" />
      <span className="bg-blob blob-2" />
      <span className="bg-blob blob-3" />

      {/* Interactive graph dot-grid — scatters away from the cursor */}
      <DotGrid />

      {/* Subtle grain/vignette so content stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/60" />
    </div>
  );
};

export default AnimatedBackground;
