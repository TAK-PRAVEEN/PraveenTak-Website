/**
 * One requestAnimationFrame loop shared by every animated island
 * (portrait, orb cursor, …). Stops itself when nothing is subscribed or the
 * tab is hidden, so idle pages cost nothing.
 */
export type FrameCallback = (time: number, delta: number) => void;

const subscribers = new Set<FrameCallback>();
let rafId = 0;
let last = 0;

function tick(now: number) {
  const t = now / 1000;
  const dt = last ? Math.min(t - last, 1 / 20) : 1 / 60;
  last = t;
  for (const cb of subscribers) cb(t, dt);
  rafId = subscribers.size && !document.hidden ? requestAnimationFrame(tick) : 0;
}

function start() {
  if (!rafId && subscribers.size && !document.hidden) {
    last = 0;
    rafId = requestAnimationFrame(tick);
  }
}

document.addEventListener("visibilitychange", start);

/** Subscribe to the shared loop. Returns an unsubscribe function. */
export function onFrame(cb: FrameCallback): () => void {
  subscribers.add(cb);
  start();
  return () => {
    subscribers.delete(cb);
  };
}

/** Critically-damped-ish spring for a single scalar. Cheap enough for per-frame JS. */
export function spring(state: { value: number; velocity: number }, target: number, dt: number, stiffness = 120, damping = 18) {
  const force = (target - state.value) * stiffness - state.velocity * damping;
  state.velocity += force * dt;
  state.value += state.velocity * dt;
  return state.value;
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
