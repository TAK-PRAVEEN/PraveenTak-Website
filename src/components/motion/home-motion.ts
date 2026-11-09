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

  const cleanups: (() => void)[] = [];
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    cleanups.push(windowScene(), stackedWork(), bigNumbers());
  });
  // The sideways strip only pins on wide screens; phones keep a native swipe row.
  mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
    cleanups.push(chapterStrip());
  });
  ScrollTrigger.refresh();

  return () => {
    cleanups.splice(0).forEach((c) => c());
    mm.revert();
    document.documentElement.classList.remove("win-ready");
  };
}

/* ---------------------------------------------------------------------------
 * Scene: through the window → scroll-rotating sculpture (90-frame sequence).
 * ------------------------------------------------------------------------- */
function windowScene(): () => void {
  const sec = document.querySelector<HTMLElement>("[data-win]");
  const pane = sec?.querySelector<HTMLElement>("[data-win-pane]");
  const canvas = sec?.querySelector<HTMLCanvasElement>("[data-win-canvas]");
  if (!sec || !pane || !canvas) return () => {};
  const ctx = canvas.getContext("2d")!;
  const rot = sec.querySelector<HTMLElement>("[data-win-rot]");
  const frameOut = sec.querySelector<HTMLElement>("[data-win-frame]");
  const before = sec.querySelector<HTMLElement>("[data-win-before]");

  // Looping Blender sequence: wavy glass orb with glowing filaments inside.
  const TOTAL = 90;
  const small = window.matchMedia("(max-width: 767px)").matches;
  const stepBy = small ? 2 : 1; // phones load every 2nd frame
  const seq = (name: string) => ({ name, frames: new Array<HTMLImageElement | null>(TOTAL).fill(null) });
  const outside = seq("orb-glass");
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    for (const s of [outside])
      for (let i = 0; i < TOTAL; i += stepBy) {
        const img = new Image();
        img.decoding = "async";
        img.src = `/media/turntable/${s.name}-${String(i).padStart(2, "0")}.webp`;
        img.onload = () => {
          s.frames[i] = img;
          if (s === outside && i === 0) document.documentElement.classList.add("win-ready");
        };
      }
  };
  const nearest = (s: ReturnType<typeof seq>, i: number) => {
    for (let d = 0; d < TOTAL; d++) {
      const a = s.frames[(i + d) % TOTAL] ?? s.frames[(i - d + TOTAL) % TOTAL];
      if (a) return a;
    }
    return null;
  };

  // State: frame position advances on its own (idle spin), scroll adds to it; dive = 0 outside .. 1 inside.
  const st = { pos: 0, dive: 0, scrollVel: 0 };
  const draw = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const i = ((Math.floor(st.pos) % TOTAL) + TOTAL) % TOTAL;
    ctx.clearRect(0, 0, w, h);
    // The orb drifts toward you as you scroll in (no fade: it stays the hero of the scene).
    const out = nearest(outside, i);
    if (out) {
      const sc = 1 + st.dive * 0.22;
      ctx.drawImage(out, (w - w * sc) / 2, (h - h * sc) / 2, w * sc, h * sc);
    }
    ctx.globalAlpha = 1;
    canvas.style.setProperty("--dive-scale", (1 + st.dive * 0.12).toFixed(3));
    if (rot) rot.textContent = String(Math.round((i / TOTAL) * 360)).padStart(3, "0");
    if (frameOut) frameOut.textContent = String(i).padStart(2, "0");
  };

  // Preload the frames only as the scene approaches, so they never compete with the hero portrait.
  const pre = ScrollTrigger.create({ trigger: sec, start: "top 160%", once: true, onEnter: load });

  // Scroll: opens the window (desktop) and dives inside; scroll speed adds spin.
  const tl = gsap.timeline({
    scrollTrigger: {
      ...(small ? { trigger: sec, start: "top 60%", end: "bottom 40%" } : { trigger: sec, start: "top top", end: "bottom bottom" }),
      scrub: 0.6,
      onUpdate: (self) => (st.scrollVel += self.getVelocity() / 900),
    },
  });
  if (!small) {
    tl.fromTo(pane, { clipPath: "inset(24% 6% 24% 54% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 0.3 }, 0).to(
      before,
      { opacity: 0, y: -20, duration: 0.12 },
      0,
    );
  }
  tl.to(st, { dive: 1, ease: "power1.inOut", duration: 0.55 }, small ? 0.2 : 0.4).to(st, { duration: 0.15 });

  // Idle loop: ~18 fps of sequence playback while the scene is on screen; scroll velocity boosts it.
  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(sec);
  const tick = (_t: number, dt: number) => {
    if (!visible) return;
    st.scrollVel *= 0.9;
    st.pos += (dt / 1000) * 8 + Math.max(-6, Math.min(6, st.scrollVel));
    draw();
  };
  gsap.ticker.add(tick);

  const onResize = () => draw();
  window.addEventListener("resize", onResize);
  return () => {
    pre.kill();
    io.disconnect();
    gsap.ticker.remove(tick);
    tl.scrollTrigger?.kill();
    tl.kill();
    window.removeEventListener("resize", onResize);
  };
}

/* Scene: stacked work cards — each card recedes as the next slides over it. */
function stackedWork(): () => void {
  const items = gsap.utils.toArray<HTMLElement>("[data-stack-item]");
  const triggers = items.slice(0, -1).map((item, i) => {
    const card = item.querySelector<HTMLElement>("[data-stack-card]");
    return gsap.to(card, {
      scale: 0.92,
      "--shade": 1,
      ease: "none",
      scrollTrigger: { trigger: items[i + 1], start: "top bottom", end: "top 20%", scrub: true },
    });
  });
  return () => triggers.forEach((t) => (t.scrollTrigger?.kill(), t.kill()));
}

/* Scene: sideways strip — chapters travel horizontally while the page scrolls. */
function chapterStrip(): () => void {
  const sec = document.querySelector<HTMLElement>("[data-strip]");
  const sticky = sec?.querySelector<HTMLElement>(".strip-sticky");
  const track = sec?.querySelector<HTMLElement>("[data-strip-track]");
  if (!sec || !sticky || !track) return () => {};
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const tw = gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: { trigger: sticky, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  return () => {
    tw.scrollTrigger?.kill();
    tw.kill();
    gsap.set(track, { clearProps: "transform" });
  };
}

/* Scene: big numbers count up to their sourced values. */
function bigNumbers(): () => void {
  const els = gsap.utils.toArray<HTMLElement>("[data-count]");
  const tweens = els.map((el) => {
    const raw = el.dataset.count ?? el.textContent ?? "";
    const m = raw.match(/[\d,]+(?:\.\d+)?/);
    if (!m) return null;
    const target = parseFloat(m[0].replace(/,/g, ""));
    const decimals = (m[0].split(".")[1] ?? "").length;
    const grouped = m[0].includes(",");
    const fmt = (n: number) => {
      const s = n.toFixed(decimals);
      return grouped ? Number(s).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
    };
    const obj = { n: 0 };
    return gsap.to(obj, {
      n: target,
      duration: 1.6,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
      onStart: () => el.setAttribute("aria-label", raw),
      onUpdate: () => (el.textContent = raw.replace(m[0], fmt(obj.n))),
      onComplete: () => (el.textContent = raw),
    });
  });
  return () => tweens.forEach((t) => (t?.scrollTrigger?.kill(), t?.kill()));
}
