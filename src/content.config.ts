/**
 * Content layer. Every collection here is what the future /studio dashboard
 * will edit (backed by D1 instead of files). Keep schemas strict.
 *
 * Content rule: only facts supplied by Praveen. Unknown values are left
 * optional/empty — never invented.
 */
import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const link = z.object({ label: z.string(), href: z.url() });
/** The Keystatic dashboard saves empty fields as "" (text) or null (url/number): treat both as "not set". */
const unset = (v: unknown) => (v === "" || v === null ? undefined : v);
const optStr = z.preprocess(unset, z.string().optional());
const optUrl = z.preprocess(unset, z.url().optional());
const optNum = z.preprocess(unset, z.number().optional());

const profile = defineCollection({
  // A single object (edited as a Keystatic singleton), exposed as entry "main".
  loader: file("src/content/profile.json", { parser: (text) => [{ id: "main", ...JSON.parse(text) }] }),
  schema: z.object({
    name: z.string(),
    roles: z.array(z.string()).min(1),
    intro: z.string(),
    statement: optStr,
    location: z.object({ city: z.string(), region: z.string(), country: z.string(), coords: z.string() }),
    availability: z.object({ open: z.boolean(), label: z.string() }),
    contact: z.object({ email: z.email(), phone: optStr }),
    socials: z.array(link),
    resume: optStr,
    skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
    achievements: z.array(z.string()),
    activities: z.array(z.string()),
    interests: z.array(z.string()),
  }),
});

const experience = defineCollection({
  // One JSON file per entry (file name = id), edited in Keystatic.
  loader: glob({ pattern: "*.json", base: "./src/content/experience" }),
  schema: z.object({
    kind: z.enum(["work", "education"]),
    title: z.string(),
    org: z.string(),
    location: optStr,
    start: z.string().regex(/^\d{4}-\d{2}$/),
    /** "" (or null) = current role. */
    end: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^\d{4}-\d{2}$/).nullable()),
    highlights: z.array(z.string()),
    stack: z.array(z.string()).default([]),
  }),
});

const certifications = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/certifications" }),
  schema: z.object({
    name: z.string(),
    provider: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}$/),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      order: z.number(),
      featured: z.boolean().default(false),
      /** Work page grouping. */
      category: z.enum(["client", "product", "ml"]).default("ml"),
      /** Client or brand, when the work was done for someone. */
      client: optStr,
      /** Public, factual status line, e.g. "Live — wholeway.org". */
      status: optStr,
      year: optNum,
      role: optStr,
      stack: z.array(z.string()),
      /** Key numbers shown as a spec list — only real, sourced metrics. */
      metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      links: z.object({ demo: optUrl, code: optUrl }).default({}),
      cover: image().optional(),
      coverAlt: optStr,
      gallery: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      /**
       * Parts of a larger system (e.g. RTCOM's apps), each with a media slot:
       * `video` (a file in /public, e.g. "/media/work/rtcom-plant.mp4") plays when set;
       * otherwise `poster` shows; with neither, a "walkthrough coming soon" frame.
       */
      modules: z
        .array(
          z.object({
            name: z.string(),
            kind: z.string(),
            summary: z.string(),
            points: z.array(z.string()).default([]),
            status: optStr,
            video: optStr,
            poster: image().optional(),
            posterAlt: optStr,
            /** "phone" posters are tall app screens; "wide" are desktop screens. */
            frame: z.enum(["phone", "wide"]).default("wide"),
          }),
        )
        .default([]),
    }),
});

/** AI/ML Lab and Experiments are empty until Praveen supplies entries. */
const lab = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lab" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string(),
    area: z.enum(["generative", "vision", "llm-agents", "research", "other"]),
    /** "YYYY-MM" — when the work was done. */
    date: z.string().regex(/^\d{4}-\d{2}$/),
    order: z.number(),
    /** Context line, e.g. "Independent research" or "DRDO, Jodhpur". */
    context: optStr,
    stack: z.array(z.string()).default([]),
    metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    links: z.array(link).default([]),
    /** Optional figure shown above the write-up (faces must be blurred). */
    figure: image().optional(),
    figureAlt: optStr,
    figureCaption: optStr,
  }),
});

const experiments = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experiments" }),
  schema: z.object({
    title: z.string(),
    medium: z.enum(["blender", "shader", "generative", "typography", "motion", "prototype"]),
    date: z.string(),
    cover: z.string().optional(),
  }),
});

export const collections = { profile, experience, certifications, projects, lab, experiments };
