/**
 * Home scroll choreography — DESIGN.md §2 (quiet ↔ loud) and §7 (Home: Paper → Ink).
 *
 *  1. Hero exit: copy drifts up and dims while the portrait dollies (portrait has its own loop).
 *  2. Ink wipe: the statement band's ink layer opens from a rounded, inset "drop"
 *     to full bleed — the liquid moment between Paper and Ink.
 *  3. Statement: words light up one by one as they scroll through.
 *
 * Everything is scrubbed to scroll (no autoplay), and nothing runs under
 * prefers-reduced-motion — the band is simply dark and fully legible.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initHomeMotion(): () => void {
  const hero = document.querySelector<HTMLElement>("#hero");
  const band = document.querySelector<HTMLElement>("[data-band]");
  if (!hero || !band) return () => {};

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // 1 — Hero exit.
    const exit = gsap.timeline({
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
    });
    exit.to(hero.querySelectorAll("[data-hero-fade]"), { yPercent: -18, opacity: 0.1, ease: "none", stagger: 0.04 }, 0);
    exit.to(hero.querySelector("[data-hero-name]"), { y: -60, opacity: 0.25, ease: "none" }, 0);

    // 2 — Ink wipe: a rounded drop of ink that spreads to full bleed.
    const ink = band.querySelector<HTMLElement>("[data-band-ink]");
    if (ink) {
      gsap.fromTo(
        ink,
        { clipPath: "inset(22% 9% 22% 9% round 48px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "power2.inOut",
          scrollTrigger: { trigger: band, start: "top bottom", end: "top 15%", scrub: 0.8 },
        },
      );
    }

    // Band content (light-on-dark) appears only once enough ink is behind it.
    gsap.fromTo(
      band.querySelector("[data-band-inner]"),
      { opacity: 0 },
      { opacity: 1, ease: "none", scrollTrigger: { trigger: band, start: "top 55%", end: "top 20%", scrub: 0.6 } },
    );

    // 3 — Statement words light up.
    const statement = band.querySelector<HTMLElement>("[data-band-statement]");
    if (statement) {
      SplitText.create(statement, {
        type: "words",
        aria: "auto",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.12, y: 24 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
            },
          );
        },
      });
    }

    gsap.from(band.querySelectorAll(".band-pillars li"), {
      opacity: 0,
      y: 16,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: { trigger: band, start: "center 75%", end: "bottom bottom", scrub: 0.6 },
    });
  });

  return () => mm.revert();
}
