/**
 * Liquid-smooth scrolling (Lenis) driven by GSAP's ticker, so every
 * ScrollTrigger scene (window, sculpture rotation, stacked cards, strip)
 * glides with it. Off under reduced motion; touch devices keep native scroll.
 */
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

/** Scroll to a Y position, smoothly or instantly, whether or not Lenis is active. */
export function scrollToY(y: number, immediate = false) {
  if (lenis) lenis.scrollTo(y, { immediate });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

export function initSmoothScroll() {
  if (lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  if (document.documentElement.classList.contains("intro-on")) lenis.stop();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // New page (view transition): start at the top and re-measure.
  document.addEventListener("astro:after-swap", () => {
    lenis?.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => lenis?.resize());
  });
  // Modal open (palette / menu) stops the page underneath from scrolling.
  document.addEventListener("scroll-lock", (e) => ((e as CustomEvent<boolean>).detail ? lenis?.stop() : lenis?.start()));
}
