/**
 * Renders the app icons and the social share image with the site's own fonts.
 * Run once after changing the design:  node scripts/make-brand-assets.mjs
 * Outputs (committed): public/icons/*.png, public/og.png
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
`;

/** PT monogram tile. `pad` = share of the tile kept clear (maskable icons need ~20%). */
const icon = (pad) => `<!doctype html><html><head><style>${fonts}
html, body { width: 100%; height: 100%; background: #171719; }
.t { position: absolute; inset: ${pad * 100}%; display: grid; place-items: center; }
.pt { font: 600 calc(${(1 - 2 * pad) * 46}vmin) / 1 "Inter Tight"; color: #f0f0ee; letter-spacing: -0.04em; }
.dot { position: absolute; right: 8%; top: 8%; width: 13%; aspect-ratio: 1; background: #ff5a1f; }
</style></head><body><div class="t"><span class="pt">PT</span><i class="dot"></i></div></body></html>`;

const og = `<!doctype html><html><head><style>${fonts}
html, body { width: 1200px; height: 630px; background: #f0f0ee; color: #080809; overflow: hidden; }
.wrap { position: relative; height: 100%; padding: 64px 72px; display: flex; flex-direction: column; justify-content: space-between; }
.top { display: flex; justify-content: space-between; align-items: center; font: 15px "Space Mono"; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1.5px solid #080809; padding-bottom: 14px; width: 640px; }
.mono { display: inline-flex; align-items: center; gap: 14px; }
.mark { position: relative; width: 40px; height: 40px; border: 1.5px solid #080809; display: grid; place-items: center; font: 600 17px "Inter Tight"; }
.mark i { position: absolute; right: 3px; top: 3px; width: 7px; height: 7px; background: #ff5a1f; }
h1 { font: 700 104px/0.92 "Inter Tight"; letter-spacing: -0.045em; }
.role { margin-top: 26px; font: 34px "Valorant"; letter-spacing: 0.05em; }
.roles { margin-top: 18px; font: 15px "Space Mono"; letter-spacing: 0.06em; text-transform: uppercase; color: #555; }
.roles b { color: #ff5a1f; font-weight: 400; margin-right: 8px; }
.moon { position: absolute; right: -110px; top: 50%; transform: translateY(-50%); width: 520px; height: 520px; border-radius: 50%; background: #080809; display: grid; place-items: center; }
.moon img { width: 78%; }
.foot { font: 15px "Space Mono"; letter-spacing: 0.08em; text-transform: uppercase; color: #555; }
.foot b { color: #080809; font-weight: 400; }
</style></head><body><div class="wrap">
  <div class="top"><span class="mono"><span class="mark">PT<i></i></span>Portfolio 2026</span><span>Jaipur, India</span></div>
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
  await p.screenshot({ path: resolve(root, "public", out) });
  await p.close();
  console.log("wrote", out);
};
await shoot(icon(0.08), 512, 512, "icons/icon-512.png");
await shoot(icon(0.08), 192, 192, "icons/icon-192.png");
await shoot(icon(0.2), 512, 512, "icons/maskable-512.png");
await shoot(icon(0.08), 180, 180, "icons/apple-touch-icon.png");
await shoot(og, 1200, 630, "og.png");
await browser.close();
rmSync(tmp, { recursive: true, force: true });
