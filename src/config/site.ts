/**
 * Site-wide configuration.
 *
 * Everything that the future /studio dashboard should be able to change lives
 * here or in src/content — never hardcoded inside components (DESIGN.md §8).
 */

export type Surface = "paper" | "ink";
export type Accent = "orange" | "lime" | "blue" | "lavender" | "mono";

export interface Experience {
  /** Two-digit index shown in labels: "03 — WORK". */
  index: string;
  label: string;
  href: string;
  surface: Surface;
  accent: Accent;
  /** One-line purpose, used in teasers and meta descriptions. */
  summary: string;
}

export const SITE = {
  name: "Praveen Tak",
  title: "Praveen Tak — AI/ML Engineer & Creative Technologist",
  description:
    "Portfolio of Praveen Tak — AI/ML engineer, full-stack developer and creative technologist based in Jaipur, India.",
  /** Production origin. Replace once the domain is decided (see DESIGN.md). */
  url: "https://praveen-tak-portfolio.workers.dev",
  locale: "en_IN",
  year: 2026,
} as const;

/** The seven experiences, in reading order. Accent allocation: DESIGN.md §3. */
export const EXPERIENCES: Experience[] = [
  { index: "01", label: "Home", href: "/", surface: "paper", accent: "orange", summary: "Identity and signature." },
  { index: "02", label: "About", href: "/about", surface: "paper", accent: "mono", summary: "Who I am and how I work." },
  { index: "03", label: "Work", href: "/work", surface: "paper", accent: "lime", summary: "Selected projects and case studies." },
  { index: "04", label: "Lab", href: "/lab", surface: "ink", accent: "blue", summary: "AI / ML experiments and research." },
  { index: "05", label: "Experiments", href: "/experiments", surface: "ink", accent: "lavender", summary: "Creative technology: 3D, shaders, motion." },
  { index: "06", label: "Experience", href: "/experience", surface: "paper", accent: "mono", summary: "Roles, internships, education." },
  { index: "07", label: "Contact", href: "/contact", surface: "paper", accent: "orange", summary: "Start a conversation." },
];

export function experienceFor(href: string): Experience {
  return EXPERIENCES.find((e) => e.href === href) ?? EXPERIENCES[0];
}

/** Animation settings — later editable from /studio. */
export const MOTION = {
  /** 0 = off, 1 = full. Reduced-motion users always get 0. */
  intensity: 1,
  customCursor: true,
  binaryPortrait: true,
  /** Ink-in-water fluid background reacting to the cursor. */
  inkBackground: true,
} as const;
