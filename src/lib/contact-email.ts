/**
 * HTML + plain-text email for contact-form messages (sent to Praveen).
 *
 * Email-client safe: table layout, inline styles only, system fonts (no web
 * fonts or external images), 600 px max width. Brand: paper #F0F0EE,
 * ink #080809, orange #FF5A1F. Works in Gmail (light & dark), Outlook, Apple Mail.
 */

export interface ContactMail {
  name: string;
  email: string;
  message: string;
  /** Page the form was sent from, e.g. "praveentak.dev/contact". */
  site: string;
  /** When it was received. */
  date: Date;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const istTime = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(d) + " IST";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

export function contactEmail(m: ContactMail): { subject: string; html: string; text: string } {
  const subject = `New message from ${m.name} — praveentak.dev`;
  const when = istTime(m.date);
  const replyHref = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message on praveentak.dev")}`;
  const words = m.message.trim().split(/\s+/).length;
  const preheader = m.message.replace(/\s+/g, " ").slice(0, 110);
  // paragraphs + line breaks, escaped
  const body = esc(m.message.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const label = (t: string) =>
    `<td style="padding:0 0 4px 0;font-family:${MONO};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6b6b70;">${t}</td>`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#e9e9e6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e9e9e6;">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#f0f0ee;border:1px solid #d6d6d2;">

    <!-- header: PT monogram + label -->
    <tr><td style="padding:22px 28px;border-bottom:1px solid #080809;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="vertical-align:middle;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
            <td style="white-space:nowrap;border:1.5px solid #080809;padding:6px 9px;font-family:${FONT};font-size:15px;font-weight:700;color:#080809;line-height:1;">PT<span style="display:inline-block;width:5px;height:5px;background:#ff5a1f;vertical-align:top;margin-left:1px;"></span></td>
            <td style="padding-left:12px;white-space:nowrap;font-family:${MONO};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#080809;">Contact form</td>
          </tr></table>
        </td>
        <td align="right" style="vertical-align:middle;white-space:nowrap;font-family:${MONO};font-size:11px;letter-spacing:1px;color:#6b6b70;">praveentak.dev</td>
      </tr></table>
    </td></tr>

    <!-- title -->
    <tr><td style="padding:30px 28px 6px 28px;">
      <div style="font-family:${MONO};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#ff5a1f;">● New message <span style="color:#6b6b70;">· ${esc(when)}</span></div>
      <h1 style="margin:10px 0 0 0;font-family:${FONT};font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-0.6px;color:#080809;">${esc(m.name)} wrote to you</h1>
    </td></tr>

    <!-- sender details -->
    <tr><td style="padding:22px 28px 6px 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="50%" style="vertical-align:top;padding:0 12px 14px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>${label("From")}</tr>
              <tr><td style="font-family:${FONT};font-size:16px;font-weight:600;color:#080809;">${esc(m.name)}</td></tr></table>
          </td>
          <td width="50%" style="vertical-align:top;padding:0 0 14px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>${label("Email")}</tr>
              <tr><td style="font-family:${FONT};font-size:16px;"><a href="mailto:${esc(m.email)}" style="color:#080809;text-decoration:underline;text-decoration-color:#ff5a1f;">${esc(m.email)}</a></td></tr></table>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- message -->
    <tr><td style="padding:4px 28px 0 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>${label(`Message · ${words} word${words === 1 ? "" : "s"}`)}</tr>
        <tr><td style="background:#ffffff;border-left:3px solid #ff5a1f;padding:18px 20px 6px 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#1d1d20;">${body}</td></tr>
      </table>
    </td></tr>

    <!-- reply button -->
    <tr><td style="padding:26px 28px 30px 28px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="background:#080809;">
          <a href="${replyHref}" style="display:inline-block;padding:14px 22px;font-family:${MONO};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#f0f0ee;text-decoration:none;">Reply to ${esc(m.name.split(" ")[0] || m.name)} &rarr;</a>
        </td>
      </tr></table>
      <div style="margin-top:10px;font-family:${FONT};font-size:12px;color:#6b6b70;">Or just hit reply — this email's reply-to is ${esc(m.email)}.</div>
    </td></tr>

    <!-- footer -->
    <tr><td style="padding:16px 28px;background:#080809;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="font-family:${MONO};font-size:11px;letter-spacing:1px;color:#a3a3a6;">Sent from the contact form on <a href="https://${esc(m.site)}" style="color:#f0f0ee;text-decoration:none;">${esc(m.site)}</a></td>
        <td align="right" style="white-space:nowrap;padding-left:12px;font-family:${MONO};font-size:11px;letter-spacing:1px;color:#ff5a1f;">Jodhpur · IN</td>
      </tr></table>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;

  const text = [
    `New message from your portfolio (${m.site})`,
    `${when}`,
    "",
    `From:  ${m.name}`,
    `Email: ${m.email}`,
    "",
    m.message.trim(),
    "",
    "—",
    `Reply directly to this email to answer ${m.name}.`,
  ].join("\n");

  return { subject, html, text };
}
