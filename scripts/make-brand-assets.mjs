/**
 * Renders the app icons and the social share image with the site's own fonts.
 * Run once after changing the design:  node scripts/make-brand-assets.mjs
 * Outputs (committed): public/icons/*.png (incl. favicon frames), public/og.png
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const pub = (p) => pathToFileURL(resolve(root, "public", p)).href;
mkdirSync(resolve(root, "public/icons"), { recursive: true });

const fonts = `
@font-face { font-family: "Inter Tight"; src: url("${pub("fonts/inter-tight-var.woff2")}") format("woff2"); font-weight: 100 900; }
@font-face { font-family: "Space Mono"; src: url("${pub("fonts/space-mono-400.woff2")}") format("woff2"); }
@font-face { font-family: "Valorant"; src: url("${pub("fonts/valorant.woff2")}") format("woff2"); }
@font-face { font-family: "IBM Plex Sans"; src: url("${pub("fonts/ibm-plex-sans-400.woff2")}") format("woff2"); }
* { margin: 0; box-sizing: border-box; }
/* PT monogram — same construction as the nav (Nav.astro): the tip of the T's top bar
   is cut out and replaced by an orange square of the bar's thickness, after a thin gap. */
.pt { --bar-top: 0.135em; --bar: 0.127em; --rsb: 0.021em; --gap: 0.02em; display: inline-flex; line-height: 1; }
.pt-p { margin-right: 0.07em; }
.pt-t { position: relative; }
.pt-tg { display: block; clip-path: polygon(0 0, calc(100% - var(--rsb) - var(--bar) - var(--gap)) 0, calc(100% - var(--rsb) - var(--bar) - var(--gap)) calc(var(--bar-top) + var(--bar) + 0.02em), 100% calc(var(--bar-top) + var(--bar) + 0.02em), 100% 100%, 0 100%); }
.pt-sq { position: absolute; right: var(--rsb); top: var(--bar-top); width: var(--bar); height: var(--bar); background: #ff5a1f; }
`;
const MONO = `<span class="pt"><span class="pt-p">P</span><span class="pt-t"><span class="pt-tg">T</span><i class="pt-sq"></i></span></span>`;

/** PT monogram tile. `pad` = share kept clear (maskable icons need ~20%); `square` = show the orange tip. */
const icon = (pad, square = true, radius = 0, tile = true) => `<!doctype html><html><head><style>${fonts}
html, body { width: 100%; height: 100%; background: transparent; }
.tile { position: absolute; inset: 0; background: #171719; border-radius: ${radius}%; display: ${tile ? "block" : "none"}; }
.t { position: absolute; inset: ${pad * 100}%; display: grid; place-items: center; will-change: transform; /* own layer: greyscale text smoothing */ }
.t .pt { font: 700 calc(${(1 - 2 * pad) * 58}vmin) / 1 "Inter Tight"; color: #f0f0ee; }
${square ? "" : ".pt-sq { display: none; }"}
</style></head><body><div class="tile"></div><div class="t">${MONO}</div></body></html>`;

const og = `<!doctype html><html><head><style>${fonts}
html, body { width: 1200px; height: 630px; background: #f0f0ee; color: #080809; overflow: hidden; }
.wrap { position: relative; height: 100%; padding: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
.top { display: flex; justify-content: space-between; align-items: center; font: 15px "Space Mono"; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1.5px solid #080809; padding-bottom: 14px; width: 640px; }
.mono { display: inline-flex; align-items: center; gap: 14px; }
.mark { width: 46px; height: 40px; border: 1.5px solid #080809; display: grid; place-items: center; font: 700 18px "Inter Tight"; }
h1 { font: 700 104px/0.92 "Inter Tight"; letter-spacing: -0.045em; }
.role { margin-top: 26px; font: 34px "Valorant"; letter-spacing: 0.05em; }
.roles { margin-top: 18px; font: 15px "Space Mono"; letter-spacing: 0.06em; text-transform: uppercase; color: #555; }
.roles b { color: #ff5a1f; font-weight: 400; margin-right: 8px; }
.moon { position: absolute; right: -110px; top: 50%; transform: translateY(-50%); width: 520px; height: 520px; border-radius: 50%; background: #080809; display: grid; place-items: center; }
.moon img { width: 78%; }
.foot { font: 15px "Space Mono"; letter-spacing: 0.08em; text-transform: uppercase; color: #555; }
.foot b { color: #080809; font-weight: 400; }
</style></head><body><div class="wrap">
  <div class="top"><span class="mono"><span class="mark">${MONO}</span>Portfolio 2026</span><span>Jaipur, India</span></div>
  <div><h1>Praveen<br/>Tak</h1><p class="role">AI / ML ENGINEER</p>
  <p class="roles"><b>01</b>AI/ML engineering &nbsp; <b>02</b>Full-stack systems &nbsp; <b>03</b>Creative technology</p></div>
  <p class="foot"><b>Open to AI / ML roles</b></p>
  <div class="moon"><img src="${pub("media/ref/moon-000.webp")}" /></div>
</div></body></html>`;

const tmp = mkdtempSync(join(tmpdir(), "pt-brand-"));
const browser = await chromium.launch({ channel: "msedge" });
const shoot = async (html, w, h, out) => {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  // A file:// page (not setContent's about:blank) may load the local fonts and images.
  const file = join(tmp, "page.html");
  writeFileSync(file, html);
  await p.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: resolve(root, "public", out), omitBackground: true });
  await p.close();
  console.log("wrote", out);
};
await shoot(icon(0.06, true, 18), 48, 48, "icons/favicon-48.png");
// letters only (no tile, no square), 4x: the animated favicon reveals these along the pen path
await shoot(icon(0.06, false, 0, false), 256, 256, "icons/favicon-glyph.png");
await shoot(icon(0.08), 512, 512, "icons/icon-512.png");
await shoot(icon(0.08), 192, 192, "icons/icon-192.png");
await shoot(icon(0.2), 512, 512, "icons/maskable-512.png");
await shoot(icon(0.08), 180, 180, "icons/apple-touch-icon.png");
await shoot(og, 1200, 630, "og.png");
await browser.close();
rmSync(tmp, { recursive: true, force: true });
