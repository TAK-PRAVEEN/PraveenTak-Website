/**
 * "Save contact" for /card: a vCard built from the profile at build time.
 * Phones open it straight into "Add contact".
 */
import type { APIRoute } from "astro";
import { getEntry } from "astro:content";

export const prerender = true;

// vCard text escaping: backslash, comma, semicolon, newline.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

export const GET: APIRoute = async () => {
  const p = (await getEntry("profile", "main"))!.data;
  const [first, ...rest] = p.name.split(" ");
  const phone = p.contact.phone?.replace(/\s/g, "");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(rest.join(" "))};${esc(first)};;;`,
    `FN:${esc(p.name)}`,
    `TITLE:${esc(p.roles[0] ?? "AI / ML Engineer")}`,
    `EMAIL;TYPE=INTERNET,WORK:${p.contact.email}`,
    ...(phone ? [`TEL;TYPE=CELL:${phone}`] : []),
    "URL:https://praveentak.dev",
    `ADR;TYPE=WORK:;;;${esc(p.location.city)};${esc(p.location.region)};;${esc(p.location.country)}`,
    ...p.socials.map((s) => `X-SOCIALPROFILE;TYPE=${esc(s.label.toLowerCase())}:${s.href}`),
    `NOTE:${esc("Websites that feel alive · AI / ML systems · praveentak.dev")}`,
    "END:VCARD",
  ];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": 'attachment; filename="praveen-tak.vcf"' },
  });
};
