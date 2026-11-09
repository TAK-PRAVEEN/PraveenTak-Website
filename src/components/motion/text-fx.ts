/**
 * Site-wide text effects (opt-in via data attributes):
 *
 *   data-decode          scrambled 0/1 + symbols → real text, when scrolled into view
 *   data-decode-hover    re-decodes on pointer hover / keyboard focus (links, labels)
 *   data-reveal-lines    each line slides up out of an invisible slot (masked)
 *
 * The real text is always in the DOM before and after; screen readers get an
 * aria-label so they never hear the scramble. Nothing runs under reduced motion.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const CHARS = "01<>/\\|#*+=_01";

function decode(el: HTMLElement, duration?: number) {
  const text = el.dataset.decodeText ?? el.textContent ?? "";
  el.dataset.decodeText = text;
  if (!el.hasAttribute("aria-label") && !el.querySelector("*")) el.setAttribute("aria-label", text.trim());
  gsap.killTweensOf(el);
  return gsap.to(el, {
    duration: duration ?? Math.min(1.6, 0.4 + text.length * 0.035),
    scrambleText: { text, chars: CHARS, revealDelay: 0.15, speed: 0.6, tweenLength: false },
    ease: "none",
  });
}

export function initTextFx(): () => void {
  const mm = gsap.matchMedia();
  const cleanups: (() => void)[] = [];

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Decode on enter.
    gsap.utils.toArray<HTMLElement>("[data-decode]").forEach((el) => {
      // Only leaf text nodes: never scramble elements that contain markup.
      if (el.children.length) return;
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: () => decode(el) });
    });

    // Decode on hover / focus.
    gsap.utils.toArray<HTMLElement>("[data-decode-hover]").forEach((host) => {
      const target = host.querySelector<HTMLElement>("[data-decode-target]") ?? host;
      if (target.children.length) return;
      const run = () => decode(target, 0.45);
      host.addEventListener("pointerenter", run);
      host.addEventListener("focus", run);
      cleanups.push(() => {
        host.removeEventListener("pointerenter", run);
        host.removeEventListener("focus", run);
      });
    });

    // Masked line reveals.
    gsap.utils.toArray<HTMLElement>("[data-reveal-lines]").forEach((el) => {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        aria: "auto",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.05,
            ease: "expo.out",
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        },
      });
    });
  });

  return () => {
    cleanups.forEach((c) => c());
    mm.revert();
  };
}
