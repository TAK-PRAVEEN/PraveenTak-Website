/**
 * QuantumCursor.tsx
 * ------------------------------------------------------------------
 * "Quantum" custom cursor:
 *   • centre dot ● with 10 tiny particles in constant orbit,
 *   • fast movement → particles stretch behind like a COMET tail
 *     (with motion streaks), and collapse back into orbit on stop,
 *   • hovering an interactive element → particles ALIGN into a stream
 *     pointing toward that element,
 *   • click → small expanding SHOCKWAVE ring.
 *
 * Canvas overlay, pointer-events: none (native cursor hidden globally).
 * Alternatives kept: EnergyOrbCursor.tsx, NeuralCursor.tsx, CustomCursor.tsx.
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";

const COUNT = 10; // 8–12 orbiting particles
const P_RGB = "150, 178, 255"; // cold blue particles
const CORE = "rgba(200, 218, 255, 0.95)";

const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, label, [data-cursor], .corner-lights, .cursor-pointer';

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  r: number;
}

interface Wave {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

const QuantumCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only skip on pure touch devices (no mouse/trackpad at all). Touchscreen
    // laptops / big touch monitors report `pointer: coarse` yet have a fine
    // pointer too — we still want the custom cursor there.
    if (!window.matchMedia("(any-pointer: fine)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -100, y: -100 };
    const vel = { x: 0, y: 0 }; // smoothed cursor velocity
    let prev = { x: -100, y: -100 };
    let hoverEl: Element | null = null;
    let t = 0;

    const waves: Wave[] = [];
    const parts: P[] = Array.from({ length: COUNT }, (_, i) => ({
      x: -100,
      y: -100,
      vx: 0,
      vy: 0,
      angle: (i / COUNT) * Math.PI * 2,
      speed: 1.4 + Math.random() * 1.2,
      r: 9 + Math.random() * 8,
    }));

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onOver = (e: Event) => {
      const el = e.target as Element | null;
      hoverEl = el?.closest?.(INTERACTIVE) ?? null;
    };
    const onDown = () => {
      waves.push({ x: mouse.x, y: mouse.y, r: 4, alpha: 0.55 });
    };

    const tick = () => {
      t += 0.016;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Smoothed velocity → comet factor (0 rest … 1 flying).
      vel.x += (mouse.x - prev.x - vel.x) * 0.25;
      vel.y += (mouse.y - prev.y - vel.y) * 0.25;
      prev = { x: mouse.x, y: mouse.y };
      const spd = Math.hypot(vel.x, vel.y);
      const comet = Math.min(1, spd / 26);
      const dir = spd > 0.01 ? { x: vel.x / spd, y: vel.y / spd } : { x: 1, y: 0 };

      // Direction toward the hovered element (for particle alignment).
      let alignDir: { x: number; y: number } | null = null;
      let alignDist = 0;
      if (hoverEl && document.contains(hoverEl)) {
        const rect = hoverEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mouse.x;
        const dy = cy - mouse.y;
        alignDist = Math.hypot(dx, dy);
        if (alignDist > 1) alignDir = { x: dx / alignDist, y: dy / alignDist };
      } else {
        hoverEl = null;
      }

      // --- Particle targets: orbit ⟷ comet tail ⟷ aligned stream -----
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.angle += p.speed * 0.016 * (1 - comet * 0.6);

        // Constant orbit (collapse-back state).
        let tx = mouse.x + Math.cos(p.angle) * p.r;
        let ty = mouse.y + Math.sin(p.angle) * p.r;

        if (alignDir) {
          // Align into a stream pointing at the hovered element.
          const reach = Math.min(alignDist, 56);
          const f = ((i + 1) / (COUNT + 1)) * reach;
          const wob = Math.sin(t * 4 + i * 1.7) * 2.5;
          tx = mouse.x + alignDir.x * f - alignDir.y * wob;
          ty = mouse.y + alignDir.y * f + alignDir.x * wob;
        } else if (comet > 0.05) {
          // Stretch behind the motion like a comet tail.
          const back = (4 + i * 3.4) * comet;
          const wob = Math.sin(t * 6 + i * 2.1) * 2 * comet;
          tx = mouse.x - dir.x * back - dir.y * wob + Math.cos(p.angle) * p.r * (1 - comet);
          ty = mouse.y - dir.y * back + dir.x * wob + Math.sin(p.angle) * p.r * (1 - comet);
        }

        // Spring toward target (snappy but soft).
        p.vx += (tx - p.x) * 0.22;
        p.vy += (ty - p.y) * 0.22;
        p.vx *= 0.68;
        p.vy *= 0.68;
        p.x += p.vx;
        p.y += p.vy;
      }

      // --- Draw ----------------------------------------------------------
      ctx.globalCompositeOperation = "lighter";

      // Shockwaves (click)
      for (let i = waves.length - 1; i >= 0; i--) {
        const wv = waves[i];
        wv.r += 3.2;
        wv.alpha *= 0.9;
        if (wv.alpha < 0.02) {
          waves.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(${P_RGB}, ${wv.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Particles — streaked when fast (comet), dots when settled.
      for (const p of parts) {
        const pspd = Math.hypot(p.vx, p.vy);
        const alpha = 0.5 + 0.4 * Math.min(1, pspd / 6);
        if (pspd > 2.2) {
          ctx.strokeStyle = `rgba(${P_RGB}, ${alpha})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${P_RGB}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";

      // --- Centre: Saturn-like ball with a tilted ring + orbiting stars ---
      const cx = mouse.x;
      const cy = mouse.y;
      const TILT = -0.5; // ring tilt (radians)
      const BALL_R = 5.5;

      // Soft glow behind the planet (bright enough to read on dark bg).
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
      glow.addColorStop(0, "rgba(180, 200, 255, 0.5)");
      glow.addColorStop(0.5, "rgba(139, 92, 246, 0.28)");
      glow.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Stars orbiting the planet (twinkling 4-point sparkles). Back-half
      // stars draw dimmer before the ball, front-half brighter after.
      const drawStar = (sx: number, sy: number, size: number, alpha: number) => {
        ctx.strokeStyle = `rgba(220, 230, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - size, sy);
        ctx.lineTo(sx + size, sy);
        ctx.moveTo(sx, sy - size);
        ctx.lineTo(sx, sy + size);
        ctx.stroke();
      };
      const starPos = (k: number) => {
        const a = t * 1.8 + (k * Math.PI * 2) / 3;
        const ex = Math.cos(a) * 12.5;
        const ey = Math.sin(a) * 4.6;
        return {
          x: cx + ex * Math.cos(TILT) - ey * Math.sin(TILT),
          y: cy + ex * Math.sin(TILT) + ey * Math.cos(TILT),
          front: Math.sin(a) > 0,
          tw: 0.55 + 0.45 * Math.sin(t * 5 + k * 2.1),
        };
      };
      const stars = [0, 1, 2].map(starPos);
      for (const s of stars) if (!s.front) drawStar(s.x, s.y, 1.5 * s.tw, 0.35 * s.tw);

      // Ring — back half (behind the ball), faint.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT);
      ctx.strokeStyle = "rgba(150, 178, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9.5, 3.4, 0, Math.PI, Math.PI * 2); // top half = back
      ctx.stroke();
      ctx.restore();

      // The planet ball (lit sphere: bright top-left → deep blue edge).
      const ball = ctx.createRadialGradient(cx - 1.3, cy - 1.3, 0.5, cx, cy, BALL_R);
      ball.addColorStop(0, "rgba(222, 233, 255, 1)");
      ball.addColorStop(0.5, "rgba(122, 152, 240, 0.95)");
      ball.addColorStop(1, "rgba(38, 58, 140, 0.92)");
      ctx.fillStyle = ball;
      ctx.beginPath();
      ctx.arc(cx, cy, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      // Ring — front half (passes over the ball), brighter.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(TILT);
      ctx.strokeStyle = "rgba(180, 200, 255, 0.9)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9.5, 3.4, 0, 0, Math.PI); // bottom half = front
      ctx.stroke();
      ctx.restore();

      for (const s of stars) if (s.front) drawStar(s.x, s.y, 1.7 * s.tw, 0.85 * s.tw);

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerover", onOver, true);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerover", onOver, true);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
};

export default QuantumCursor;
