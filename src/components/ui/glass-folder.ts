/**
 * Glass folders: tilt toward the pointer and "lift" (paper slides out) on hover / focus.
 */
export function mountGlassFolders() {
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
      const k = el.classList.contains("gf-wide") ? 0.45 : 1;
      set(reduce ? 0 : -y * 14 * k, reduce ? 0 : x * 16 * k, 1);
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
