// @ts-check
import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Placeholder origin until the domain is chosen (see DESIGN.md §12 / src/config/site.ts).
  site: "https://praveentak.dev",
  // Static-first: every page is prerendered; API routes opt out with `prerender = false` (Phase 5).
  output: "static",
  // Emit about.html (not about/index.html) so /about is served without a redirect.
  build: { format: "file" },
  trailingSlash: "never",
  adapter: cloudflare({
    // Optimise images at build time — no Cloudflare Images binding needed.
    imageService: "compile",
  }),
  // No feature uses sessions yet; avoid auto-provisioning a KV namespace on deploy.
  session: { driver: sessionDrivers.lruCache() },
  // Internal tools (the font/background playground) never go in the sitemap.
  integrations: [
    // Internal font/background playground: available at /playground in `astro dev` only,
    // never built for production (the file is _playground.astro, so it isn't routed by default).
    {
      name: "dev-only-playground",
      hooks: {
        "astro:config:setup": ({ command, injectRoute }) => {
          if (command === "dev") injectRoute({ pattern: "/playground", entrypoint: "./src/pages/_playground.astro" });
        },
      },
    },
    sitemap({ filter: (page) => !page.includes("/playground") && !page.includes("/offline") }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
