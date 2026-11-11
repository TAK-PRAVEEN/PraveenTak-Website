// Share-card layout (1200x630 @2x): bold PORTFOLIO type, orange glow, the Blender laptop render. See scripts/og-laptop.py.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const S = process.argv[2], OUT = process.argv[3];
const b64 = (p) => readFileSync(p).toString("base64");
const F = "public/fonts/";
const html = `<!doctype html><html><head><style>
@font-face{font-family:IT;src:url(data:font/woff2;base64,${b64(F+"inter-tight-var.woff2")});font-weight:100 900}
@font-face{font-family:SM;src:url(data:font/woff2;base64,${b64(F+"space-mono-400.woff2")})}
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;background:#e7e5e0;font-family:IT;color:#080809}
.glow{position:absolute;inset:0;background:
  radial-gradient(60% 75% at 30% 78%, #ff5a1f 0%, rgba(255,90,31,.85) 28%, rgba(255,120,60,.35) 55%, rgba(231,229,224,0) 78%),
  radial-gradient(40% 50% at 78% 70%, rgba(255,90,31,.45), rgba(255,90,31,0) 70%)}
.grain{position:absolute;inset:0;opacity:.18;mix-blend-mode:multiply;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.m{font-family:SM;font-size:13px;letter-spacing:2px;text-transform:uppercase}
.top{position:absolute;top:30px;left:48px;right:48px;display:flex;justify-content:space-between}
.name{position:absolute;left:44px;top:74px;font-weight:700;font-size:78px;letter-spacing:-3px;line-height:1}
.name i{font-style:normal;color:#ff5a1f}
.big{position:absolute;left:36px;top:142px;font-weight:900;font-size:206px;letter-spacing:-10px;line-height:.9;
  background:linear-gradient(180deg,#fff 0%,#fff 45%,rgba(255,255,255,0) 96%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lap{position:absolute;left:372px;top:58px;width:880px;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 16%);mask-image:linear-gradient(90deg,transparent 0%,#000 16%)}
.list{position:absolute;left:48px;top:392px;font-size:20px;font-weight:600;line-height:1.35;color:#fff}
.list span{display:block}.list span:nth-child(2){padding-left:28px}.list span:nth-child(3){padding-left:56px}
.bot{position:absolute;left:48px;bottom:30px;color:#fff}
.url{position:absolute;right:48px;bottom:26px;background:#080809;color:#fff;padding:9px 16px;border-radius:999px}
</style></head><body>
<div class="glow"></div><div class="grain"></div>
<div class="top m"><span>Praveen Tak® — 2026</span><span>Websites · AI · Creative tech</span></div>
<div class="name">Praveen Tak<i>.</i></div>
<div class="big">PORTFOLIO</div>
<img class="lap" src="data:image/png;base64,${b64(S+"/lap-final.png")}">
<div class="list"><span>Websites that feel alive</span><span>AI / ML systems</span><span>Branding &amp; motion</span></div>
<div class="bot m">Jaipur · India</div>
<div class="url m">praveentak.dev →</div>
</body></html>`;
const b = await chromium.launch({ channel: "msedge" });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: OUT });
await b.close();
