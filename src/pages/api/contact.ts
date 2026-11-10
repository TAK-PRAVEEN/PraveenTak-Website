/**
 * POST /api/contact — contact form → email to Praveen.
 *
 *  1. Validates the fields (and drops bots that fill the hidden "website" field).
 *  2. Verifies the Cloudflare Turnstile token server-side (Siteverify).
 *  3. Sends the message through Cloudflare Email Service (binding "EMAIL",
 *     locked to Praveen's address in wrangler.jsonc), with Reply-To = the visitor.
 *
 * Until the domain is onboarded to Email Service (CONTACT_FROM unset) or when
 * sending fails, it answers { ok: false, fallback: "mailto" } and the page opens
 * the visitor's mail app instead, so no message is ever silently lost.
 *
 * Body (JSON): { name, email, message, token, website }
 */
import type { APIRoute } from "astro";

export const prerender = false;

type Env = {
  EMAIL?: { send: (m: Record<string, unknown>) => Promise<{ messageId: string }> };
  TURNSTILE_SECRET?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
};

const LIMITS = { name: 100, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
// Strip CR/LF so nothing can be smuggled into header-like fields (subject, names).
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const out = (await r.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ ok: false, error: "Bad request." }, 415);

  let data: Record<string, unknown>;
  try {
    data = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Bad request." }, 400);
  }
  const name = oneLine(String(data.name ?? "")).slice(0, LIMITS.name + 1);
  const email = String(data.email ?? "").trim().slice(0, LIMITS.email + 1);
  const message = String(data.message ?? "").trim().slice(0, LIMITS.message + 1);
  const token = String(data.token ?? "");

  // Honeypot: real people never see this field. Pretend it worked.
  if (String(data.website ?? "").trim()) return json({ ok: true });

  if (!name || name.length > LIMITS.name) return json({ ok: false, error: "Please add your name." }, 422);
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) return json({ ok: false, error: "Please add a valid email." }, 422);
  if (message.length < 10) return json({ ok: false, error: "Please write a little more (10+ characters)." }, 422);
  if (message.length > LIMITS.message) return json({ ok: false, error: "That message is a bit long (5,000 characters max)." }, 422);

  const { env } = (await import("cloudflare:workers")) as unknown as { env: Env };

  // Not set up yet (no secret / no sender domain / no binding): hand over to mailto.
  if (!env.TURNSTILE_SECRET || !env.CONTACT_FROM || !env.CONTACT_TO || !env.EMAIL) return json({ ok: false, fallback: "mailto" }, 503);

  if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, request.headers.get("cf-connecting-ip")))) {
    return json({ ok: false, error: "Couldn't verify you're human. Please try again." }, 403);
  }

  const text = `${message}\n\n— ${name} <${email}>\nSent from the portfolio contact form.`;
  const html =
    `<p style="white-space:pre-wrap;font:15px/1.5 system-ui,sans-serif">${escapeHtml(message)}</p>` +
    `<p style="font:13px system-ui,sans-serif;color:#555">— ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>Sent from the portfolio contact form.</p>`;

  try {
    // The binding's destination_address only allows Praveen's inbox anyway.
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: env.CONTACT_FROM, name: "Portfolio contact" },
      replyTo: { email, name },
      subject: `Portfolio: message from ${name}`,
      text,
      html,
    });
    return json({ ok: true });
  } catch (e) {
    console.error("contact send failed", (e as { code?: string }).code, (e as Error).message);
    return json({ ok: false, fallback: "mailto" }, 502);
  }
};

export const ALL: APIRoute = () => json({ ok: false, error: "Method not allowed." }, 405);
