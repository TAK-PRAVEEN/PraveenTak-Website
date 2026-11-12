/**
 * HUD dial runtime: a WebGL Earth (real day/night for "now", Jaipur centred), live clocks,
 * and click-and-hold spin of the dial in its own plane (inertia; double-click resets).
 */
const JAIPUR = { lat: 26.9124, lon: 75.7873 };
const rad = Math.PI / 180;

// ---------- astronomy (NOAA approximations, accurate to ~1 min) ----------
function julian(d: Date) { return d.getTime() / 86400000 + 2440587.5; }
function sun(d: Date) {
  const n = julian(d) - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const gmst = (280.46061837 + 360.98564736629 * n) % 360; // Earth rotation angle (deg)
  // subsolar longitude = RA - GMST
  let lon = ra / rad - gmst;
  lon = ((lon + 540) % 360) - 180;
  return { lat: decl / rad, lon, gmst: ((gmst % 360) + 360) % 360, decl };
}
function sunTimes(d: Date, lat: number, lon: number) {
  // NOAA sunrise equation for the local calendar day (IST)
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
  const n = Math.round(julian(day) - 2451545.0 + 0.0008);
  const Js = n - lon / 360;
  const M = ((357.5291 + 0.98560028 * Js) % 360) * rad;
  const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
  const lam = ((M / rad + C + 180 + 102.9372) % 360) * rad;
  const Jt = 2451545.0 + Js + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * lam);
  const dec = Math.asin(Math.sin(lam) * Math.sin(23.44 * rad));
  const w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec)));
  const toDate = (J: number) => new Date((J - 2440587.5) * 86400000);
  return { rise: toDate(Jt - w / (2 * Math.PI)), set: toDate(Jt + w / (2 * Math.PI)) };
}
const fmt = (d: Date, tz: string, sec = true) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", ...(sec ? { second: "2-digit" } : {}), hour12: false, timeZone: tz }).format(d);

// ---------- WebGL globe ----------
const VS = `attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}`;
const FS = `precision highp float;varying vec2 v;
uniform sampler2D day,night;uniform float lat0,lon0,slat,slon,dark;
const float PI=3.14159265;
void main(){
  float r=length(v);
  if(r>1.0){ float a=smoothstep(1.08,1.0,r)*0.55; gl_FragColor=vec4(vec3(0.35,0.6,1.0)*a,a); return; }
  float c=asin(min(r,1.0));
  float la0=radians(lat0);
  float lat=asin(cos(c)*sin(la0)+(r>0.0? v.y*sin(c)*cos(la0)/r:0.0));
  float lon=radians(lon0)+atan(v.x*sin(c), r*cos(c)*cos(la0)-v.y*sin(c)*sin(la0));
  vec2 uv=vec2(fract((lon+PI)/(2.0*PI)), (PI*0.5-lat)/PI);
  vec3 n=vec3(cos(lat)*cos(lon),cos(lat)*sin(lon),sin(lat));
  float sl=radians(slat), so=radians(slon);
  vec3 s=vec3(cos(sl)*cos(so),cos(sl)*sin(so),sin(sl));
  float d=dot(n,s);
  vec3 dc=texture2D(day,uv).rgb*(0.35+0.85*max(d,0.0));
  vec3 nc=texture2D(night,uv).rgb*1.35+vec3(0.0,0.008,0.02);
  vec3 col=mix(nc,dc,smoothstep(-0.12,0.10,d));
  float limb=pow(r,6.0);
  col=mix(col,vec3(0.45,0.7,1.0),limb*0.35*smoothstep(-0.2,0.3,d));
  col*=1.0-0.25*pow(r,3.0);
  float edge=smoothstep(1.0,0.985,r);
  gl_FragColor=vec4(col*edge,edge);
}`;

function initGlobe(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.1, -1.1, 1.1, -1.1, -1.1, 1.1, 1.1, 1.1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  let ready = 0;
  const tex = (unit: number, src: string, name: string) => {
    const t = gl.createTexture(); const img = new Image(); img.crossOrigin = "anonymous"; img.decoding = "async";
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U(name), unit); ready++; draw.last = "";
    };
    img.src = src;
  };
  tex(0, "/media/earth/day-2048.jpg", "day"); tex(1, "/media/earth/night-2048.jpg", "night");
  function draw(lat0: number, lon0: number, s: { lat: number; lon: number }) {
    if (ready < 2) return;
    const key = `${lat0.toFixed(2)},${lon0.toFixed(2)},${s.lat.toFixed(3)},${s.lon.toFixed(3)},${canvas.width}`;
    if (key === draw.last) return; draw.last = key;
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.uniform1f(U("lat0"), lat0); gl!.uniform1f(U("lon0"), lon0); gl!.uniform1f(U("slat"), s.lat); gl!.uniform1f(U("slon"), s.lon);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }
  draw.last = "";
  return draw;
}

export function mountHudDial(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-hud-3d]")!;
  const canvas = root.querySelector<HTMLCanvasElement>("[data-hud-globe]")!;
  const secRing = root.querySelector<SVGGElement>("[data-hud-sec]");
  const minRing = root.querySelector<SVGGElement>("[data-hud-min]");
  const spinRing = root.querySelector<SVGGElement>("[data-hud-spin]");
  const secBar = root.querySelector<HTMLElement>("[data-hud-secbar]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw = initGlobe(canvas);

  // size the globe canvas to its box (crisp on retina)
  const ro = new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.max(64, Math.round(r.width * dpr)); canvas.height = Math.max(64, Math.round(r.height * dpr));
    if (draw) draw.last = "";
  });
  ro.observe(canvas);

  // ---- Spin: click-and-hold and drag around the centre turns the dial in its own plane (like a
  // rotary dial), with inertia. The tilt stays fixed; double-click / Home resets.
  const TILT_X = -12, TILT_Y = 14;
  let spin = 0, vel = 0, dragging = false, lastAng = 0;
  const angleAt = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e: PointerEvent) => {
    dragging = true; lastAng = angleAt(e); vel = 0;
    root.setPointerCapture(e.pointerId); root.classList.add("is-grab");
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const a = angleAt(e);
    let d = a - lastAng;
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    lastAng = a; spin += d; vel = d;
  };
  const onUp = () => { dragging = false; root.classList.remove("is-grab"); };
  const onDbl = () => { spin = 0; vel = 0; };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); spin -= 10; }
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); spin += 10; }
    if (e.key === "Home") onDbl();
  };
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp); root.addEventListener("pointercancel", onUp);
  root.addEventListener("dblclick", onDbl);
  root.addEventListener("keydown", onKey);

  let visible = true, raf = 0, lastSec = -1;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); });
  io.observe(root);

  function tick(now: number) {
    raf = 0;
    if (!visible) return;
    const d = new Date();
    if (!dragging) { spin += vel; vel *= 0.95; if (Math.abs(vel) < 0.01) vel = 0; }
    const sway = reduce ? 0 : Math.sin(now / 3000) * 3;
    stage.style.transform = `rotateX(${TILT_X + sway * 0.5}deg) rotateY(${TILT_Y + sway}deg) rotateZ(${spin}deg)`;
    stage.style.setProperty("--spin", `${spin}deg`); // the Earth and the info cards stay upright

    const s = sun(d);
    draw?.(JAIPUR.lat, JAIPUR.lon, s);
    const ms = d.getMilliseconds(), sec = d.getSeconds() + ms / 1000;
    secRing?.setAttribute("transform", `rotate(${sec * 6} 500 500)`);
    minRing?.setAttribute("transform", `rotate(${(d.getMinutes() + sec / 60) * 6} 500 500)`);
    spinRing?.setAttribute("transform", `rotate(${-s.gmst} 500 500)`);
    if (secBar) secBar.style.width = `${(sec / 60) * 100}%`;
    if (d.getSeconds() !== lastSec) {
      lastSec = d.getSeconds();
      const ist = fmt(d, "Asia/Kolkata");
      const t = sunTimes(d, JAIPUR.lat, JAIPUR.lon);
      const set = (k: string, v: string) => root.querySelectorAll<HTMLElement>(`[data-hud="${k}"]`).forEach((el) => { if (el.textContent !== v) el.textContent = v; });
      set("ist", ist); set("ist-hm", ist.slice(0, 5)); set("ist-s", ist.slice(6));
      set("dom", new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: "Asia/Kolkata" }).format(d));
      // top-tab gauges: hour of day, minute, second (as % of a full turn)
      const [hh, mm, ss] = ist.split(":").map(Number);
      const g = { h: ((hh + mm / 60) / 24) * 100, m: ((mm + ss / 60) / 60) * 100, s: (ss / 60) * 100 };
      root.querySelectorAll<SVGCircleElement>("[data-gauge]").forEach((c) => c.setAttribute("stroke-dasharray", `${g[c.dataset.gauge as "h" | "m" | "s"].toFixed(1)} 100`));
      set("utc", fmt(d, "UTC"));
      set("gmst", s.gmst.toFixed(2) + "°");
      set("rise", fmt(t.rise, "Asia/Kolkata", false)); set("set", fmt(t.set, "Asia/Kolkata", false));
      set("decl", (s.decl / rad).toFixed(1) + "°");
      const daylight = d > t.rise && d < t.set;
      set("phase", daylight ? "Daylight" : "Night side");
      const dayLen = (t.set.getTime() - t.rise.getTime()) / 3600000;
      set("daylen", `${Math.floor(dayLen)}h ${Math.round((dayLen % 1) * 60)}m`);
    }
    if (!reduce || dragging) raf = requestAnimationFrame(tick);
    else setTimeout(() => { if (!raf) raf = requestAnimationFrame(tick); }, 1000);
  }
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf); raf = 0; visible = false; ro.disconnect(); io.disconnect();
    root.removeEventListener("pointerdown", onDown); root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerup", onUp); root.removeEventListener("pointercancel", onUp);
    root.removeEventListener("dblclick", onDbl); root.removeEventListener("keydown", onKey);
  };
}
