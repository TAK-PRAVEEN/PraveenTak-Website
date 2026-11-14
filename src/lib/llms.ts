/**
 * Builds /llms.txt and /llms-full.txt (llmstxt.org): a plain Markdown summary of the site that
 * AI assistants (ChatGPT, Claude, Perplexity, Gemini) can read in one request, built from the
 * same content collections and answers as the pages, so it never drifts from the site.
 */
import { getCollection, getEntry } from "astro:content";
import { SITE } from "../config/site";
import { SERVICES, faqs, EXTRA_SAME_AS } from "../config/answers";

const ym = (d?: string | null) => (d ? new Date(`${d}-01`).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "present");

export async function buildLlms(full: boolean): Promise<string> {
  const origin = SITE.url;
  const p = (await getEntry("profile", "main"))!.data;
  const projects = (await getCollection("projects")).sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0));
  const lab = (await getCollection("lab")).sort((a, b) => b.data.date.localeCompare(a.data.date));
  const exp = (await getCollection("experience")).sort((a, b) => b.data.start.localeCompare(a.data.start));
  const L: string[] = [];

  L.push(`# ${p.name}`, "");
  L.push(`> ${p.name} is an ${p.roles.join(", ")} from ${p.location.city}, ${p.location.region}, India. ${p.intro}`, "");
  L.push(`Website: ${origin} · Email: ${p.contact.email}`);
  L.push(`Profiles: ${[...p.socials.map((s) => s.href), ...EXTRA_SAME_AS].join(" · ")}`, "");

  L.push("## Services", "");
  for (const s of SERVICES) L.push(`- **${s.name}** — ${s.description}`);
  L.push("");

  L.push("## Skills", "");
  for (const g of p.skills) L.push(`- ${g.group}: ${g.items.join(", ")}`);
  L.push("");

  L.push("## Projects", "");
  for (const pr of projects) {
    const d = pr.data;
    L.push(`- [${d.title}](${origin}/work/${pr.id})${d.year ? ` (${d.year})` : ""}: ${d.summary} Stack: ${d.stack.join(", ")}.`);
    if (full && pr.body) L.push("", indent(pr.body), "");
  }
  L.push("");

  L.push("## Research and experiments", "");
  for (const x of lab) {
    L.push(`- [${x.data.title}](${origin}/lab/${x.id}) (${ym(x.data.date)}): ${x.data.summary}`);
    if (full && x.body) L.push("", indent(x.body), "");
  }
  L.push("");

  L.push("## Experience and education", "");
  for (const e of exp) L.push(`- ${e.data.title}, ${e.data.org} (${ym(e.data.start)} – ${ym(e.data.end)})`);
  L.push("");

  L.push("## Recognition", "", ...p.achievements.map((a) => `- ${a}`), "");

  L.push("## Frequently asked questions", "");
  for (const f of faqs(p.location.city, p.location.region, p.contact.email)) L.push(`### ${f.q}`, "", f.a, "");

  L.push("## Pages", "");
  for (const [label, path] of [["Home", "/"], ["About + FAQ", "/about"], ["Work", "/work"], ["Lab", "/lab"], ["Experience", "/experience"], ["Contact", "/contact"]])
    L.push(`- [${label}](${origin}${path === "/" ? "" : path})`);
  if (!full) L.push("", `Full text of every project and experiment: ${origin}/llms-full.txt`);
  return L.join("\n") + "\n";
}

const indent = (md: string) => md.trim().replace(/^#{1,3} /gm, "#### ");

export const textResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
