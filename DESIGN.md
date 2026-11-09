# Praveen Tak — Portfolio 2026 · Phase 0 Specification

**Swiss Futurism / Digital Matter.** Editorial precision × computational art × cinematic 3D.

Status: **Phase 3 in progress — 09 Nov 2026.** Work (11 projects incl. client systems) and Lab (2 entries) populated from GitHub + résumé; light/dark theme toggle added. Pending from Praveen: font combinations, one-liner quote, experiments media. Branch: `feature/redesign-2026`.
Source brief: `Portfolio.pdf` (09 Nov 2026) and 14 reference images. This document adopts that
brief and records where Phase 0 inspection changes or tightens it (marked **▲ change**).

---

## 1. Inspection findings

### Repository
| Item | State |
|---|---|
| Working branch | `feature/redesign-2026` (3 commits ahead of `main`, not pushed) |
| Old site | `backup/pre-redesign-2026-11-09` — untouched |
| Tracked files | `.gitignore`, `reference/**`, this file |
| Tooling | Node 22.19, npm 10.9, Wrangler 4.125, ffmpeg 9, Python 3.11 (no torch) |

### Name animation — `reference/images/Name.gif`
- 1920×1080, **35.2 s, 1057 frames @ 30 fps, transparent background (BGRA)**, 18 MB.
- A handwritten "Praveen Tak" signature that writes itself repeatedly in **4 script styles and
  4 colours**: peach-orange → pink → lavender → teal.
- Old site placed it on a blue gradient band under "Hi, I'm".
- **Conflict:** the pastel pink/teal/lavender cycle is outside the new palette. Per the brief
  ("do not redesign without approval") this was put to you: **approved recolour to charcoal** (D3).
- Plan regardless of D3: keep the GIF untouched in `reference/`; ship an encoded copy
  (WebM VP9 with alpha + HEVC-alpha MP4 for Safari, animated AVIF fallback). Expected
  ~1–3 MB instead of 18 MB with identical frames and timing.

### Portrait — `reference/images/portrait-source.png`
- 1824×2346, three-quarter profile, dark knit sweater, **blue-sky background**.
- **Has a Gemini sparkle watermark** bottom-right, and is identical to
  `Gemini_Generated_Image_pcfaawpcfaawpcfa.png` (AI-edited image).
- Good for the binary face: strong side lighting, clear jaw/beard/hair silhouette.
- Needs: background removal → depth map → baked point data. See §6A and Decision D4.

### Installed agent skills — ⚠ not visible to Claude Code
`npx skills add …` installed `astro`, 8× `gsap-*`, `web-design-guidelines` into
`~/.agents/skills/` (the "Universal" target). **Claude Code reads `~/.claude/skills/` and
was not ticked**, so none of them load here. Fix: re-run each command and tick
**Claude Code (.claude/skills)**, or let me copy the folders into `~/.claude/skills/`.

### Old content available for migration (no invention)
`reference/data/chatbotKnowledge.ts` and `reference/old-pages/*` contain your previous bio,
education, experience, skills and awards (e.g. Sandhaanam 2025). Only this material, plus what
you send, will be used. Missing facts become visible `TODO` placeholders, never made-up text.

---

## 2. Design principles

1. **Two signatures, everything else supports them** — the binary portrait and the particle-orb
   cursor. No other element competes for that level of motion.
2. **Quiet ↔ loud rhythm.** Editorial Swiss sections (still, typographic, gridded) alternate with
   intense experiences (3D, particles). Never two loud sections back-to-back.
3. **Paper and Ink.** The site has two surfaces, taken directly from the references:
   - *Paper* (`#F0F0EE`) — Swiss posters, Braun editorial, Polymer 48. Home, About, Projects,
     Experience, Contact.
   - *Ink* (`#080809`) — space UI, matrix portrait, dark dial. AI/ML Lab, Experiments, the
     chatbot, and the hero's dark "transition" moment.
4. **One accent per experience.** Accents are signals, not decoration.
5. **Information as ornament.** Micro-labels, coordinates, index numbers, spec lists and
   barcodes (Braun, Polymer, Warp references) carry real data: dates, stack, metrics, never
   lorem-style filler.

---

## 3. Colour system

### Core
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F0F0EE` | Light surface (never pure white) |
| `--mist` | `#D8D8D6` | Rules, dividers, card fills on paper |
| `--concrete` | `#858587` | Decorative grey, large meta, borders. **▲ not for small text on paper (3.2:1)** |
| `--graphite` **▲ new** | `#5E5E61` | Secondary text on paper (5.7:1 ✓) |
| `--charcoal` | `#171719` | Primary text on paper (15.7:1), raised panels on ink |
| `--ink` | `#080809` | Dark surface |

### Accents and allocation
| Accent | Hex | Experience | On paper | On ink |
|---|---|---|---|---|
| Neon orange | `#FF5A1F` | Home / Hero, Contact | Shapes, blocks, cursor orb, ≥24 px display only (2.7:1) | Text OK (6.4:1) |
| Electric lime | `#C8FF00` | Projects | **Fill only** with charcoal text on it (15.1:1), like the Braun "1976" tags. Never lime text on paper (1.04:1) | Text OK (16.9:1) |
| Electric blue | `#386BFF` | AI / ML Lab | Large display only (3.9:1) | Use `#5B86FF` for text (6.0:1) **▲** |
| Neon lavender | `#A78BFA` | Experiments | Fill only | Text OK (7.4:1) |

About and Experience stay monochrome. Contact = monochrome + orange.
Accents are switched by one attribute on `<body>`/section (`data-accent="lime"`), so the
future `/studio` dashboard can reassign them without code changes.

**Avoid:** pure white, purple→blue "AI" gradients, more than one accent per viewport.
Gradients appear only as blurred light/heat inside the hero (Warp Gradients reference: orange →
charcoal on paper) and as grain on dark sections (Sonnet posters reference).

---

## 4. Typography

| Role | Family | Format | Use |
|---|---|---|---|
| Display | **Space Grotesk** (variable 300–700) | WOFF2 | Name, section titles, giant numerals (Polymer "48", "19 / 26") |
| Editorial | **Instrument Serif** (regular + italic) | WOFF2 | One statement per page at most, e.g. *"Ideas become experiences."* |
| Technical | **Space Mono** (400, 700) | WOFF2 | Labels, coordinates, timestamps, spec lists, **and the 0/1 glyphs of the portrait** |
| Interface / body | **Manrope** (variable 200–800) | WOFF2 | Body copy, nav, buttons, forms |
| Experimental | ~~Bangers~~ **▲ dropped from the main site** | — | Its comic style breaks the Swiss system. Optional, only inside individual Experiments pieces |

- All self-hosted from `public/fonts/` with `@font-face`, licences (`OFL.txt`) kept beside them,
  subset to Latin + needed symbols, `font-display: swap`, and the two first-paint fonts
  (Space Grotesk, Manrope) preloaded.
- Scale (fluid `clamp()`): micro 11 px mono caps (+8% tracking) · body 16–18 · lead 20–24 ·
  h3 28–36 · h2 48–80 · display 96–280 (tight −4% tracking, 0.85 line-height).
- Labels follow the reference pattern: `01 — PROJECTS`, `N 26°55′ / E 75°47′`, `SYS_2026`.

---

## 5. Grid, layout, components

- **12-column grid**, 24 px gutter desktop / 16 px mobile, 1440 px max content with full-bleed
  art allowed. A visible 1 px hairline grid is used on Paper sections (Polymer, Warp references).
- Spacing scale 4-based: 4 8 12 16 24 32 48 64 96 128 192.
- Radius: **0** for editorial blocks; 16–24 px only for "device" UI (glass panels, chatbot,
  bento cards in the Fahim reference). Two radii, never more.
- Core components: `MicroLabel`, `IndexNumber`, `Rule`, `SpecList` (Braun mono list),
  `TagBlock` (accent fill + charcoal text), `Barcode` (decorative, built from real data),
  `GiantNumeral`, `ProjectCover`, `Timeline`, `GlassPanel`, `LiquidButton`, `StatusDot`
  (availability), `Nav`.
- Icons: Lucide via `@lucide/astro` (▲ the brief's `lucide-astro` is the older community package).

### Glass and liquid (restrained)
| Where | Technique |
|---|---|
| Nav pill, chatbot panel, modals | CSS `backdrop-filter` blur + 1 px inner highlight + grain (BitTorrent / Huly references) |
| Click / open on nav, buttons, project overlay | SVG `feTurbulence` + `feDisplacementMap` animated by GSAP for ~400 ms, then removed (no constant cost) |
| Project cover → case study | WebGL displacement transition (one shared shader), desktop only |
Never more than one blurred layer stacked over another; no glass on body sections.

---

## 6. Signature experiences

### A. Binary particle portrait
**Pipeline (offline, at build time — not in the browser):**
1. Source photo → background matte (remove sky) → crop to head/shoulders.
2. Depth map with Depth-Anything-V2 (Python script, run once; installs torch locally ~2 GB) **or**
   a depth pass rendered in Blender if you prefer. See D4.
3. Sample ~**24k points** desktop / ~**8k** mobile, weighted by luminance and edge strength
   (eyes, beard, jaw and hair edges get density; flat sweater gets less).
4. Bake to a compact binary file `portrait.bin` (xyz + brightness + glyph id, ~300 KB) instead of
   shipping the 7 MB PNG.

**Rendering:** ▲ raw WebGL2 point sprites (`src/lib/gl.ts`) instead of Three.js — both signatures are a single draw call, so this saves ~120 KB gz on the home page (portrait + orb code ≈ 19 KB). Three.js arrives with Phase 4 GLB scenes, on the pages that use them. Each point samples a 2-glyph atlas
(`0`, `1` in Space Mono), so particles are real binary characters. Brightness → glyph size and
opacity, depth → parallax. Glyphs occasionally flip 0↔1 (cheap, in shader).

**Behaviour** (driven by uniforms only; no per-particle JS work per frame):
| State | Effect |
|---|---|
| Idle | Face fully formed, slow ±6° yaw breathing, glyph flicker |
| Pointer near | Local repulsion radius around pointer (GPU) |
| Hover | Disintegration: particles drift along curl noise, glyphs rain downward (matrix reference) |
| Leave | Spring back to home positions (~1.2 s) |
| Scroll | Camera dollies *through* the point cloud into section 02 |

**Fallbacks:** no WebGL / reduced motion → a pre-rendered still of the binary face (AVIF);
low-end → 8k points, DPR capped at 1.5, paused when off-screen.

### B. Particle-orb cursor
- ~1,500 points on a Fibonacci sphere in a **small fixed canvas (~200 px) that follows the
  pointer** — not a full-screen overlay, which would cost fill-rate on every frame.
- Three-axis rotation in the vertex shader, plus 2–3 thin orbital rings (Warp reference).
- On link/button hover: `uExplode` uniform springs 0→1 — particles push out along their normals
  while still rotating, ring expands; springs back on leave.
- **▲ Colour problem:** additive "glow" is invisible on light paper. On Paper the orb renders
  charcoal particles with an orange core; on Ink it switches to orange additive glow.
- Persists across page navigations (Astro `transition:persist`), hidden on touch / coarse pointers,
  native cursor kept for text inputs, disabled under reduced motion.

### C. Name animation
Placed as the hero's lead line ("Hi, I'm" + signature) exactly as authored, re-encoded only.
Recoloured to charcoal per D3.

---

## 7. Site structure

| # | Route | Surface / accent | Contents |
|---|---|---|---|
| 01 | `/` Home | Paper → Ink, orange | Name animation, binary portrait, one-line intro, availability `StatusDot`, scroll-dive into teaser strips for 02–07 |
| 02 | `/about` | Paper, mono | Bio, "AI engineer + full-stack + creative technologist", approach, education, portrait variations |
| 03 | `/work` + `/work/[slug]` | Paper, lime | Big covers, role, stack, problem → solution → result; case-study pages |
| 04 | `/lab` | Ink, blue | AI/ML experiments, CV, LLM/agentic systems, benchmarks |
| 05 | `/experiments` | Ink, lavender | Blender renders, shaders, generative/typography/motion pieces |
| 06 | `/experience` | Paper, mono | Interactive timeline: roles, internships, research, achievements |
| 07 | `/contact` | Paper, orange | Form, email, profiles, availability, chatbot entry |

Homepage teases; detail lives on the pages. The chatbot is a persistent launcher on every page.
Page transitions: Astro View Transitions (`ClientRouter`) with a short liquid wipe.

---

## 8. Technical architecture

```
Astro (static-first, TypeScript)  ──►  Cloudflare Workers (@astrojs/cloudflare adapter)
 ├─ Pages, layouts, SEO           prerendered HTML
 ├─ Content Collections           src/content/*  (zod schemas → future D1)
 ├─ Islands (client:visible)      portrait, cursor orb, liquid transitions, chatbot UI
 └─ API routes (on-demand)        /api/contact (Turnstile + email) · /api/chat (AI, secret in Worker)
```

```
src/
  content/        profile, projects, experience, experiments, lab  (+ content.config.ts)
  components/     3d/  motion/  layout/  ui/
  layouts/  pages/  styles/  lib/  config/
public/fonts/     scripts/   (portrait bake, video encode)   reference/  (kept, read-only)
```

- **React only where it helps** (chatbot UI, maybe the timeline). The portrait and orb are plain
  TypeScript + Three.js islands, so no React runtime on the home page for them.
- **Dashboard-ready:** every editable value (hero text, availability, accents, animation
  intensity, SEO) lives in `src/content/profile` + `src/config/site.ts`, never hardcoded in
  components. Later, `/studio` swaps the collection loader to D1 + R2 behind Cloudflare Access.

### Dependencies (to install in Phase 1, latest stable at that time)
| Need | Package | Note |
|---|---|---|
| Framework | `astro`, `@astrojs/cloudflare`, `@astrojs/sitemap` | |
| Styling | `tailwindcss` v4 (`@tailwindcss/vite`) | Tokens as CSS variables; Tailwind reads them |
| 3D | raw WebGL2 for signatures; `three` from Phase 4 | No R3F/Drei at first; add only if a React 3D scene needs it |
| Animation | `gsap` (incl. ScrollTrigger, SplitText — all free now) | |
| Smooth scroll | `lenis` — **only if native scroll feels wrong** | ▲ `@studio-freight/lenis` is deprecated, the package is now `lenis` |
| Icons | `@lucide/astro` | |
| Islands | `@astrojs/react`, `react` | For chatbot only |
| Dev | `wrangler`, `@playwright/test`, `@lhci/cli` | |

---

## 9. Performance and quality targets

Lighthouse Perf 90+ · A11y 95+ · SEO 95+ · LCP < 2.5 s · CLS < 0.1 · INP < 200 ms (targets).

Budgets: home page JS ≤ 180 KB gz before 3D; 3D chunk loads after first paint; fonts ≤ 160 KB;
hero media ≤ 1.5 MB. LCP element is the **HTML headline**, never the canvas.
Rules from the brief kept: lazy 3D, WebGL fallback, touch → no custom cursor, reduced-motion
support, AVIF/WebP, WebM/MP4, KTX2/Draco GLB, real-device testing.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Face not recognisable as particles | Edge-weighted sampling + depth; recognisability reviewed with you before anything else is built on top |
| Portrait source is AI-edited and watermarked | Use a real high-res photo if you have one (D4) |
| 18 MB GIF on the hero | Re-encode to alpha WebM/HEVC/AVIF |
| Pastel name colours vs palette | Your decision (D3) |
| Two WebGL contexts (portrait + orb) | Orb canvas is tiny; portrait pauses off-screen; both share one RAF loop |
| Glass/blur cost on mobile | Static fallback styles under `prefers-reduced-transparency` and on low-end devices |
| Safari: alpha video, `backdrop-filter`, WebGL quirks | HEVC-alpha path, tested in Playwright WebKit + a real iPhone |
| Scope (4–6 weeks) | Ship Phase 1–2 (foundation + hero) as the first reviewable milestone |

---

## 11. Roadmap

| Phase | Scope | Exit check |
|---|---|---|
| 0 | This spec | ✓ D1–D4 approved |
| 1 | ✓ Astro 7 + Cloudflare scaffold, tokens, fonts, grid, nav, layouts, content schemas, migrated old content | ✓ Builds + runs in local Workers runtime. Deploy + Lighthouse baseline wait for Cloudflare login |
| 2 | ✓ 2a: name animation (WebM/WebP, 18 MB → 0.47 MB), binary portrait (24k / 9k pts), orb cursor · ✓ 2b: Paper→Ink scroll band (GSAP ScrollTrigger + SplitText), liquid press ripple, glass nav blob, liquid mobile menu, surface-aware nav/orb · ▲ one visible name: signature is the h1 (text is sr-only) | ✓ Hero signed off (hover softened per review) |
| 3 | About, Work (+ case study), Lab, Experiments, Experience, Contact | All pages with real content |
| 4 | Blender assets → GLB, shaders, scroll 3D | Budgets still met |
| 5 | Contact API, chatbot, analytics, SEO/OG | End-to-end on preview |
| 6 | Cross-browser/device QA, a11y audit, production deploy | Your go-ahead to deploy |

No push and no production deploy without your explicit go-ahead.

---

## 12. Decisions (approved 09 Nov 2026)

- **D1 — Portrait first appearance:** starts as scattered 0/1 particles and **reconstructs** into the face (~1.5 s), covering 3D initialisation.
- **D2 — Portrait main interaction:** **hover and scroll** — hover disintegrates/rebuilds; scroll dollies the camera through the cloud.
- **D3 — Name animation colours:** **recolour to charcoal `#171719`**. Same frames, timing and lettering; only the colour changes (alpha-preserving recolour of the transparent GIF). Original GIF stays untouched in `reference/`.
- **D4 — Portrait source:** **use `portrait-source.png`** — sky matted out, watermark area excluded from sampling.

Still needed from you before Phase 3: project list with links and real outcomes, current role
and availability, résumé, social links, any Blender renders, chatbot AI provider, custom domain.

---

## 13. Sci-fi layer & home film (built 09 Nov 2026)

| Piece | Where | Notes |
|---|---|---|
| Michroma (HUD/numerals) | `--font-hud`, `.hud`, `.numeral` | Instrument details and big numbers only |
| Kaushan Script (script) | `--font-script`, `.script` | Confident brush — human counterpoint to the machine type |
| Decode text | `data-decode`, `data-decode-hover` | GSAP ScrambleText; aria-label keeps the real text |
| Masked line reveal | `data-reveal-lines` | SplitText `mask: "lines"` on page titles |
| Terminal caret | `.caret` | Blinking `_` after technical labels |
| Instrument nav | `Nav.astro` + `Hud.astro` | IST clock, chapter 0X/07, progress line |
| Side scale | `Hud.astro` | Tick rail + marker + % (desktop) |
| Command palette | `CommandPalette.astro` | Ctrl/⌘K — pages, work, lab, actions |
| Radial dial menu | `Nav.astro` (mobile) | Drag to spin, elastic snap, core opens |
| Ink-drop theme switch | `lib/ink-transition.ts` | View Transition + animated SVG noise mask |
| Home: window → sculpture | `home/WindowScene.astro` | 90-frame Blender turntable scrubbed by scroll |
| Home: stacked work | `home/StackedWork.astro` | Sticky cards that recede as the next arrives |
| Home: sideways index | `home/ChapterStrip.astro` | Pinned horizontal travel (desktop) / swipe (phone) |
| Home: big numbers | `home/BigNumbers.astro` | Count-up; every figure sourced from content |
| Home finale | `Footer.astro` (`showcase`) | Blender chrome "PT", pointer tilt |
| First-visit intro | `motion/Intro.astro` | Once per browser, skippable; code not video |
| Blender pipeline | `scripts/render-sculpture.py`, `prepare-renders.sh` | Cycles/OptiX on the RTX 4050 |
