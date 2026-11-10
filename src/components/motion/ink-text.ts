/**
 * Ink text — hovering a link inside the site lets the page's accent soak into
 * the letters like ink into paper (or a symbiote creeping over skin): it starts
 * at the bottom-left corner, sends ragged tendrils ahead of a wet, paler bleed,
 * rushes at first and then slowly soaks in. Leaving dries it back the same way.
 *
 * How: each hovered text element gets its own SVG filter (created on demand,
 * removed once dry, so nothing runs at rest):
 *   field  = corner gradient (feImage) + fractal noise (feTurbulence)
 *   ink    = steep threshold of the field  -> solid ink with a torn edge
 *   bleed  = soft threshold slightly ahead  -> paler wet fringe
 *   result = text + (accent clipped to the text glyphs, masked by ink/bleed)
 * GSAP animates the threshold. Reduced motion: colour switches instantly.
 *
 * Targets: `.ink-text` inside a hovered link, or the link itself when it is a
 * link within the site with no `.ink-text` inside (see SELF).
 */
import { gsap } from "gsap";

const NS = "http://www.w3.org/2000/svg";
const SELF_EXCLUDE = ".card, .project, .entry, .chapter, .dial-item, .dial-core, .brand, .skip-link";
// Corner-to-far-corner gradient, stretched to the element (white = bottom-left).
const GRAD =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><defs><radialGradient id='g' cx='0' cy='1' r='1.42'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#000'/></radialGradient></defs><rect width='100' height='100' fill='url(#g)'/></svg>",
  );
// Ink edge sharpness (solid) and the wet fringe ahead of it.
const SHARP = 16;
const SOFT = 5;
// Threshold sweep: field values run roughly -0.15..0.9.
const T_EMPTY = 1.0;
const T_FULL = -0.3;

type Ink = { el: HTMLElement; filter: SVGFilterElement; p: number; tween?: gsap.core.Tween; filterRef: string };
const inks = new WeakMap<HTMLElement, Ink>();
let defs: SVGSVGElement | null = null;
let uid = 0;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  parent?.appendChild(n);
  return n;
}

function getDefs(): SVGSVGElement {
  if (defs && document.body.contains(defs)) return defs;
  defs = svg("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute;width:0;height:0;overflow:hidden" });
  document.body.appendChild(defs);
  return defs;
}

function buildFilter(el: HTMLElement): SVGFilterElement {
  const id = `ink-text-${++uid}`;
  const f = svg("filter", { id, x: "-6%", y: "-30%", width: "112%", height: "170%", "color-interpolation-filters": "sRGB" }, getDefs());
  const r = el.getBoundingClientRect();
  const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
  // Tendril size follows the type size: ~half an em per feature, stretched sideways.
  const bf = Math.min(0.2, Math.max(0.006, 1 / (fs * 0.55)));
  svg("feImage", { href: GRAD, x: 0, y: 0, width: r.width, height: r.height, preserveAspectRatio: "none", result: "grad" }, f);
  svg("feTurbulence", { type: "fractalNoise", baseFrequency: `${bf * 0.7} ${bf}`, numOctaves: 4, seed: (uid * 13) % 97, result: "noise" }, f);
  // field = 0.75*gradient + 0.55*(noise - 0.5)
  svg("feComposite", { in: "grad", in2: "noise", operator: "arithmetic", k1: 0, k2: 0.75, k3: 0.55, k4: -0.275, result: "field" }, f);
  // move the field into alpha
  svg("feColorMatrix", { in: "field", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0", result: "fa" }, f);
  const sharp = svg("feComponentTransfer", { in: "fa", result: "solid" }, f);
  svg("feFuncA", { type: "linear", slope: SHARP, intercept: -SHARP * T_EMPTY, "data-k": "sharp" }, sharp);
  const soft = svg("feComponentTransfer", { in: "fa", result: "wet" }, f);
  svg("feFuncA", { type: "linear", slope: SOFT, intercept: -SOFT * T_EMPTY, "data-k": "soft" }, soft);
  // the wet fringe is paler than the ink itself
  const pale = svg("feComponentTransfer", { in: "wet", result: "wetPale" }, f);
  svg("feFuncA", { type: "linear", slope: 0.4, intercept: 0 }, pale);
  svg("feMerge", { result: "mask" }, f).append(svg("feMergeNode", { in: "wetPale" }), svg("feMergeNode", { in: "solid" }));
  svg("feFlood", { "flood-color": "#000", result: "accent", "data-k": "flood" }, f);
  svg("feComposite", { in: "accent", in2: "mask", operator: "in", result: "inkFill" }, f);
  svg("feComposite", { in: "inkFill", in2: "SourceAlpha", operator: "in", result: "inkText" }, f);
  svg("feMerge", {}, f).append(svg("feMergeNode", { in: "SourceGraphic" }), svg("feMergeNode", { in: "inkText" }));
  return f;
}

function setProgress(ink: Ink) {
  const t = T_EMPTY + (T_FULL - T_EMPTY) * ink.p;
  ink.filter.querySelector('[data-k="sharp"]')!.setAttribute("intercept", String(-SHARP * t));
  // the wet fringe runs a little ahead of the solid ink
  ink.filter.querySelector('[data-k="soft"]')!.setAttribute("intercept", String(-SOFT * (t - 0.12)));
}

function attach(el: HTMLElement): Ink {
  let ink = inks.get(el);
  if (!ink || !ink.filter.isConnected) {
    const filter = buildFilter(el);
    ink = { el, filter, p: 0, filterRef: `url(#${filter.id})` };
    inks.set(el, ink);
    setProgress(ink);
  }
  const accent = getComputedStyle(el).getPropertyValue("--accent").trim() || "#ff5a1f";
  ink.filter.querySelector('[data-k="flood"]')!.setAttribute("flood-color", accent);
  el.style.filter = ink.filterRef;
  el.dataset.inkFilter = ink.filterRef; // lets the click ripple restore it
  return ink;
}

function detach(ink: Ink) {
  if (ink.el.style.filter === ink.filterRef) ink.el.style.filter = "";
  delete ink.el.dataset.inkFilter;
  ink.filter.remove();
  inks.delete(ink.el);
}

function spread(el: HTMLElement) {
  if (reduced()) {
    el.style.color = "var(--accent-as-text)";
    return;
  }
  const ink = attach(el);
  ink.tween?.kill();
  // rushes out, then slowly soaks in
  ink.tween = gsap.to(ink, { p: 1, duration: 3.2 * (1 - ink.p) + 0.3, ease: "power2.out", onUpdate: () => setProgress(ink) });
}

function dry(el: HTMLElement) {
  if (reduced()) {
    el.style.color = "";
    return;
  }
  const ink = inks.get(el);
  if (!ink) return;
  ink.tween?.kill();
  // dries quickly at first, the last of it lingers
  ink.tween = gsap.to(ink, { p: 0, duration: 2.2 * ink.p + 0.2, ease: "power2.out", onUpdate: () => setProgress(ink), onComplete: () => detach(ink) });
}

/** The text elements a link should ink: its .ink-text children, or itself. */
function targets(a: HTMLAnchorElement): HTMLElement[] {
  const inner = Array.from(a.querySelectorAll<HTMLElement>(".ink-text"));
  if (inner.length) return inner;
  const internal = (a.getAttribute("href") ?? "").startsWith("/");
  if (internal && a.closest("main, footer") && !a.matches(SELF_EXCLUDE)) return [a];
  return [];
}

let started = false;
export function initInkText() {
  if (started) return;
  started = true;
  const link = (n: EventTarget | null) => (n instanceof Element ? n.closest<HTMLAnchorElement>("a[href]") : null);
  const enter = (e: Event & { relatedTarget: EventTarget | null }) => {
    const a = link(e.target);
    if (!a || (e.relatedTarget instanceof Node && a.contains(e.relatedTarget))) return;
    targets(a).forEach(spread);
  };
  const leave = (e: Event & { relatedTarget: EventTarget | null }) => {
    const a = link(e.target);
    if (!a || (e.relatedTarget instanceof Node && a.contains(e.relatedTarget))) return;
    if (a.matches(":focus-visible") && e.type === "pointerout") return;
    targets(a).forEach(dry);
  };
  document.addEventListener("pointerover", (e) => e.pointerType === "mouse" && enter(e));
  document.addEventListener("pointerout", (e) => e.pointerType === "mouse" && leave(e));
  document.addEventListener("focusin", enter);
  document.addEventListener("focusout", leave);
  // touch: a press inks the link (it is navigating away anyway)
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const a = link(e.target);
    if (a) targets(a).forEach(spread);
  });
}
