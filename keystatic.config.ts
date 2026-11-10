/**
 * Keystatic — the editing dashboard at /keystatic.
 *
 * Every field mirrors the schemas in src/content.config.ts. Saves are commits to GitHub
 * (TAK-PRAVEEN/PraveenTak-Website, branch main); Cloudflare Workers Builds then redeploys.
 * Secrets (Worker): KEYSTATIC_GITHUB_CLIENT_ID, KEYSTATIC_GITHUB_CLIENT_SECRET, KEYSTATIC_SECRET.
 * Build variable: PUBLIC_KEYSTATIC_GITHUB_APP_SLUG.
 *
 * Content rule: only real facts. Numbers must come from Praveen's own work.
 */
import { collection, config, fields, singleton } from "@keystatic/core";

const ym = (label: string, description?: string) =>
  fields.text({ label, description: description ?? "Format YYYY-MM, e.g. 2026-08", validation: { isRequired: true, pattern: { regex: /^\d{4}-\d{2}$/, message: "Use YYYY-MM" } } });

const metricList = (label = "Key numbers") =>
  fields.array(fields.object({ label: fields.text({ label: "Label" }), value: fields.text({ label: "Value" }) }), {
    label,
    description: "Only real, sourced numbers.",
    itemLabel: (p) => `${p.fields.value.value} — ${p.fields.label.value}`,
  });

const tags = (label: string) => fields.array(fields.text({ label: "Item" }), { label, itemLabel: (p) => p.value });

const workImage = (label: string) => fields.image({ label, directory: "src/assets/work", publicPath: "../../assets/work/" });

export default config({
  // GitHub mode everywhere: the site runs on Cloudflare Workers (also in `astro dev`), where
  // Keystatic's local file mode can't run. Saves commit to `main`, which redeploys the site.
  storage: { kind: "github", repo: "TAK-PRAVEEN/PraveenTak-Website" },
  ui: {
    brand: { name: "praveentak.dev" },
    navigation: {
      About: ["profile"],
      Work: ["projects"],
      Research: ["lab", "experiments"],
      Career: ["experience", "certifications"],
    },
  },

  singletons: {
    profile: singleton({
      label: "Profile",
      path: "src/content/profile",
      format: { data: "json" },
      schema: {
        name: fields.text({ label: "Name", validation: { isRequired: true } }),
        roles: tags("Roles"),
        intro: fields.text({ label: "Intro", multiline: true }),
        statement: fields.text({ label: "Home statement", description: "Shown in the black band on the home page." }),
        location: fields.object(
          {
            city: fields.text({ label: "City" }),
            region: fields.text({ label: "Region / state" }),
            country: fields.text({ label: "Country" }),
            coords: fields.text({ label: "Coordinates line", description: "e.g. N 26°54′ / E 75°47′" }),
          },
          { label: "Location" },
        ),
        availability: fields.object(
          {
            open: fields.checkbox({ label: "Open to opportunities (shows the orange dot)" }),
            label: fields.text({ label: "Availability text" }),
          },
          { label: "Availability" },
        ),
        contact: fields.object(
          {
            email: fields.text({ label: "Public email", validation: { isRequired: true } }),
            phone: fields.text({ label: "Phone (optional)" }),
          },
          { label: "Contact" },
        ),
        socials: fields.array(fields.object({ label: fields.text({ label: "Label" }), href: fields.url({ label: "URL", validation: { isRequired: true } }) }), {
          label: "Social links",
          itemLabel: (p) => p.fields.label.value,
        }),
        resume: fields.text({ label: "Résumé link (optional)" }),
        skills: fields.array(fields.object({ group: fields.text({ label: "Group" }), items: tags("Skills") }), {
          label: "Skills",
          itemLabel: (p) => p.fields.group.value,
        }),
        achievements: tags("Achievements"),
        activities: tags("Activities"),
        interests: tags("Interests"),
      },
    }),
  },

  collections: {
    projects: collection({
      label: "Projects",
      path: "src/content/projects/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "category", "order"],
      schema: {
        title: fields.slug({ name: { label: "Title", validation: { isRequired: true } } }),
        summary: fields.text({ label: "Summary", multiline: true, validation: { isRequired: true } }),
        order: fields.number({ label: "Order", description: "Lower comes first (decimals allowed, e.g. 5.5).", validation: { isRequired: true } }),
        featured: fields.checkbox({ label: "Featured on the home page" }),
        category: fields.select({
          label: "Group on the Work page",
          options: [
            { label: "Client systems", value: "client" },
            { label: "Products", value: "product" },
            { label: "AI / ML projects", value: "ml" },
          ],
          defaultValue: "ml",
        }),
        client: fields.text({ label: "Client / brand" }),
        status: fields.text({ label: "Status line", description: 'e.g. "Live — wholeway.org"' }),
        year: fields.integer({ label: "Year" }),
        role: fields.text({ label: "Your role" }),
        stack: tags("Tech stack"),
        metrics: metricList(),
        links: fields.object({ demo: fields.url({ label: "Live / demo URL" }), code: fields.url({ label: "Code URL" }) }, { label: "Links" }),
        cover: workImage("Cover image"),
        coverAlt: fields.text({ label: "Cover description (for screen readers)" }),
        gallery: fields.array(fields.object({ src: workImage("Image"), alt: fields.text({ label: "Caption / description" }) }), {
          label: "Gallery",
          itemLabel: (p) => p.fields.alt.value || "Image",
        }),
        modules: fields.array(
          fields.object({
            name: fields.text({ label: "Name" }),
            kind: fields.text({ label: "Kind", description: 'e.g. "Android app · plant floor"' }),
            summary: fields.text({ label: "Summary", multiline: true }),
            points: tags("Points"),
            status: fields.text({ label: "Status", description: 'e.g. "In daily use"' }),
            video: fields.text({ label: "Walkthrough video path", description: 'A file in public/, e.g. "/media/work/rtcom-plant.mp4". Leave empty for "coming soon".' }),
            poster: workImage("Screenshot / poster"),
            posterAlt: fields.text({ label: "Screenshot description" }),
            frame: fields.select({
              label: "Frame",
              options: [
                { label: "Wide (desktop screen)", value: "wide" },
                { label: "Phone (tall app screen)", value: "phone" },
              ],
              defaultValue: "wide",
            }),
          }),
          { label: "System parts (with video slots)", itemLabel: (p) => p.fields.name.value },
        ),
        content: fields.markdoc({ label: "Case study", extension: "md" }),
      },
    }),

    lab: collection({
      label: "AI / ML Lab",
      path: "src/content/lab/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["title", "date"],
      schema: {
        title: fields.slug({ name: { label: "Title", validation: { isRequired: true } } }),
        summary: fields.text({ label: "Summary", multiline: true, validation: { isRequired: true } }),
        area: fields.select({
          label: "Area",
          options: [
            { label: "Generative models", value: "generative" },
            { label: "Computer vision", value: "vision" },
            { label: "LLMs & agents", value: "llm-agents" },
            { label: "Research", value: "research" },
            { label: "Other", value: "other" },
          ],
          defaultValue: "vision",
        }),
        date: ym("Date"),
        order: fields.number({ label: "Order", description: "Lower comes first.", validation: { isRequired: true } }),
        context: fields.text({ label: "Context line", description: 'e.g. "DESIGO® Milk — R&D (in progress)"' }),
        stack: tags("Stack"),
        metrics: metricList(),
        links: fields.array(fields.object({ label: fields.text({ label: "Label" }), href: fields.url({ label: "URL", validation: { isRequired: true } }) }), {
          label: "Links",
          itemLabel: (p) => p.fields.label.value,
        }),
        figure: fields.image({ label: "Figure (blur any faces first)", directory: "src/assets/lab", publicPath: "../../assets/lab/" }),
        figureAlt: fields.text({ label: "Figure description" }),
        figureCaption: fields.text({ label: "Figure caption" }),
        content: fields.markdoc({ label: "Write-up", extension: "md" }),
      },
    }),

    experiments: collection({
      label: "Experiments",
      path: "src/content/experiments/*",
      slugField: "title",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title", validation: { isRequired: true } } }),
        medium: fields.select({
          label: "Medium",
          options: ["blender", "shader", "generative", "typography", "motion", "prototype"].map((v) => ({ label: v, value: v })),
          defaultValue: "prototype",
        }),
        date: fields.text({ label: "Date" }),
        cover: fields.text({ label: "Cover image path (optional)" }),
        content: fields.markdoc({ label: "Notes", extension: "md" }),
      },
    }),

    experience: collection({
      label: "Experience & education",
      path: "src/content/experience/*",
      slugField: "org",
      format: { data: "json" },
      columns: ["org", "title", "start"],
      schema: {
        kind: fields.select({
          label: "Type",
          options: [
            { label: "Work", value: "work" },
            { label: "Education", value: "education" },
          ],
          defaultValue: "work",
        }),
        title: fields.text({ label: "Title / degree", validation: { isRequired: true } }),
        org: fields.slug({ name: { label: "Organisation", validation: { isRequired: true } } }),
        location: fields.text({ label: "Location" }),
        start: ym("Start"),
        end: fields.text({ label: "End", description: "YYYY-MM — leave empty if this is your current role.", validation: { pattern: { regex: /^(\d{4}-\d{2})?$/, message: "Use YYYY-MM or leave empty" } } }),
        highlights: tags("Highlights"),
        stack: tags("Stack"),
      },
    }),

    certifications: collection({
      label: "Certifications",
      path: "src/content/certifications/*",
      slugField: "name",
      format: { data: "json" },
      columns: ["name", "provider", "date"],
      schema: {
        name: fields.slug({ name: { label: "Name", validation: { isRequired: true } } }),
        provider: fields.text({ label: "Provider", validation: { isRequired: true } }),
        date: ym("Date"),
      },
    }),
  },
});
