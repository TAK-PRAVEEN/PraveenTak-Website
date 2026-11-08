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

const profile = defineCollection({
  loader: file("src/content/profile.json"),
  schema: z.object({
    name: z.string(),
    roles: z.array(z.string()).min(1),
    intro: z.string(),
    statement: z.string().optional(),
    location: z.object({ city: z.string(), region: z.string(), country: z.string(), coords: z.string() }),
    availability: z.object({ open: z.boolean(), label: z.string() }),
    contact: z.object({ email: z.email(), phone: z.string().optional() }),
    socials: z.array(link),
    resume: z.string().optional(),
    skills: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
    achievements: z.array(z.string()),
    activities: z.array(z.string()),
    interests: z.array(z.string()),
  }),
});

const experience = defineCollection({
  loader: file("src/content/experience.json"),
  schema: z.object({
    kind: z.enum(["work", "education"]),
    title: z.string(),
    org: z.string(),
    location: z.string().optional(),
    start: z.string().regex(/^\d{4}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
    highlights: z.array(z.string()),
    stack: z.array(z.string()).default([]),
  }),
});

const certifications = defineCollection({
  loader: file("src/content/certifications.json"),
  schema: z.object({
    name: z.string(),
    provider: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}$/),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    featured: z.boolean().default(false),
    year: z.number().optional(),
    role: z.string().optional(),
    stack: z.array(z.string()),
    /** Key numbers shown as a spec list — only real, sourced metrics. */
    metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    links: z.object({ demo: z.url().optional(), code: z.url().optional() }).default({}),
    cover: z.string().optional(),
  }),
});

/** AI/ML Lab and Experiments are empty until Praveen supplies entries. */
const lab = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/lab" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    area: z.enum(["generative", "vision", "llm-agents", "research", "other"]),
    date: z.string(),
    links: z.array(link).default([]),
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
