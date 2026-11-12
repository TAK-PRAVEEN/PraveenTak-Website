/**
 * Glass folders: tilt toward the pointer and "lift" (paper slides out) on hover / focus.
 * Also injects the SVG refraction filter used by the "clear" glass recipe (Chromium only; others fall back to blur).
 */
function ensureRefract() {
  if (document.getElementById("gf-refract")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.innerHTML = `<filter id="gf-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="1" seed="4" result="n"/>
    <feGaussianBlur in="n" stdDeviation="3" result="nb"/>
    <feDisplacementMap in="SourceGraphic" in2="nb" scale="16" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
  document.body.appendChild(svg);
}

export function mountGlassFolders() {
  ensureRefract();
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = [...document.querySelectorAll<HTMLElement>("[data-gf]")];
  const offs: (() => void)[] = [];
  for (const el of cards) {
    const set = (rx: number, ry: number, lift: number) => {
      el.style.setProperty("--rx", `${rx}deg`); el.style.setProperty("--ry", `${ry}deg`); el.style.setProperty("--lift", String(lift));
    };
    const move = (e: PointerEvent) => {
      if (!fine) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      set(reduce ? 0 : -y * 14, reduce ? 0 : x * 16, 1);
    };
    const leave = () => set(0, 0, 0);
    const focus = () => set(-4, 6, 1);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focusin", focus);
    el.addEventListener("focusout", leave);
    offs.push(() => {
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focusin", focus); el.removeEventListener("focusout", leave);
    });
  }
  return () => offs.forEach((f) => f());
}
