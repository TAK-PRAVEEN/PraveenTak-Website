/**
 * Liquid interactions — DESIGN.md §5 "Glass and liquid (restrained)".
 *
 *  - Press ripple: any [data-liquid] element or link is briefly run through the shared
 *    SVG displacement filter (#liquid) and settles with an elastic squash.
 *    The filter is attached only for ~0.45 s, so it costs nothing at rest.
 *  - Nav blob: a glass pill that flows between desktop nav links, stretching
 *    like a droplet as it travels and settling on the current page.
 *
 * Skipped entirely under prefers-reduced-motion.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ripple(el: HTMLElement) {
  const turb = document.querySelector<SVGFETurbulenceElement>("#liquid feTurbulence");
  const disp = document.querySelector<SVGFEDisplacementMapElement>("#liquid feDisplacementMap");
  if (!turb || !disp) return;
  el.style.filter = `${el.dataset.inkFilter ?? ""} url(#liquid)`.trim();
  gsap.killTweensOf([turb, disp]);
  gsap.fromTo(turb, { attr: { baseFrequency: "0.03 0.08" } }, { attr: { baseFrequency: "0.008 0.02" }, duration: 0.45, ease: "power2.out" });
  gsap.fromTo(
    disp,
    { attr: { scale: 0 } },
    {
      attr: { scale: 18 },
      duration: 0.16,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // hand back to the hover ink if that link is inked (ink-text.ts)
        el.style.filter = el.dataset.inkFilter ?? "";
      },
    },
  );
  gsap.fromTo(el, { scaleX: 1.05, scaleY: 0.93 }, { scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1, 0.35)", clearProps: "transform" });
}

function initRipple(): () => void {
  const SEL = "[data-liquid], main a, footer a, .nav-desktop a";
  let lastType = "mouse";
  const onDown = (e: PointerEvent) => {
    lastType = e.pointerType;
    // Touch presses also start scrolls: wait for a real tap (click) instead.
    if (e.pointerType !== "mouse" || e.button !== 0 || reduced()) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>(SEL);
    if (el) ripple(el);
  };
  const onClick = (e: MouseEvent) => {
    if (lastType === "mouse" || reduced()) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>(SEL);
    if (el) ripple(el);
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("click", onClick, { capture: true, passive: true });
  return () => {
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("click", onClick, { capture: true });
  };
}

/** Glass droplet under the current page's nav link; flows to the new link on navigation. */
function initNavBlob(): () => void {
  const list = document.querySelector<HTMLElement>("[data-nav-list]");
  const blob = document.querySelector<HTMLElement>("[data-nav-blob]");
  if (!list || !blob) return () => {};

  const place = (link: HTMLElement | null, animate: boolean) => {
    if (!link) {
      gsap.to(blob, { opacity: 0, duration: 0.25 });
      return;
    }
    const lr = link.getBoundingClientRect();
    const pr = list.getBoundingClientRect();
    const x = lr.left - pr.left - 12;
    const width = lr.width + 24;
    if (!animate || reduced()) {
      gsap.set(blob, { x, width, opacity: 1 });
      return;
    }
    const distance = Math.abs((gsap.getProperty(blob, "x") as number) - x);
    gsap.to(blob, { x, width, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.7)", overwrite: "auto" });
    // Droplet stretch: thinner while travelling, proportional to the distance.
    if (distance > 4) {
      gsap.fromTo(blob, { scaleY: Math.max(0.62, 1 - distance / 600) }, { scaleY: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
    }
  };

  // Marks the current page only; hovering a link changes its text colour (ink-text), not this.
  const current = () => list.querySelector<HTMLElement>('a[aria-current="page"]');

  const settle = () => place(current(), true);
  const onResize = () => place(current(), false);
  document.addEventListener("astro:after-swap", settle);
  window.addEventListener("resize", onResize);
  // Fonts change link widths: re-measure once they are ready.
  void document.fonts.ready.then(() => place(current(), false));
  place(current(), false);

  return () => {
    document.removeEventListener("astro:after-swap", settle);
    window.removeEventListener("resize", onResize);
  };
}

let started = false;
/** Idempotent: the nav and filter are persisted, so this runs once per full page load. */
export function initLiquid() {
  if (started) return;
  started = true;
  initRipple();
  initNavBlob();
  initRemeasure();
}

/**
 * Scroll effects measure where sections sit when a page loads. On phones the layout
 * keeps shifting afterwards (fonts, images, canvases, the address bar), which made
 * effects fire late. Re-measure whenever the page height really changes.
 */
function initRemeasure() {
  let timer = 0;
  let lastH = document.documentElement.scrollHeight;
  // re-measuring is costly (forces layout for every trigger): debounce generously
  const refresh = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 300);
  };
  new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - lastH) > 24) {
      lastH = h;
      refresh();
    }
  }).observe(document.body);
  // (ScrollTrigger already re-measures on load itself; only real height changes need more.)
}

/** Mobile menu: the panel spills open from the toggle like ink, and drains back. */
export function animatePanel(panel: HTMLElement, origin: HTMLElement, open: boolean): Promise<void> {
  const r = origin.getBoundingClientRect();
  const at = `${r.left + r.width / 2}px ${r.top + r.height / 2 - panel.getBoundingClientRect().top}px`;
  if (reduced()) return Promise.resolve();
  // Interrupting (e.g. Close tapped while opening) cancels the running animation.
  gsap.killTweensOf(panel);
  return new Promise((resolve) => {
    gsap.fromTo(
      panel,
      { clipPath: `circle(${open ? 0 : 150}% at ${at})` },
      {
        clipPath: `circle(${open ? 150 : 0}% at ${at})`,
        duration: open ? 0.75 : 0.45,
        ease: open ? "expo.out" : "power3.in",
        onComplete: () => {
          gsap.set(panel, { clearProps: "clipPath" });
          resolve();
        },
      },
    );
    if (open) {
      // Items are positioned by the dial's own transforms: animate the dial as a whole.
      gsap.fromTo(panel.querySelector("[data-dial]"), { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out", delay: 0.05 });
    }
  });
}
