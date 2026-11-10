/**
 * Service worker — offline support for the portfolio.
 *  - Pages: network first (always fresh when online); a copy is kept so visited
 *    pages open offline; unknown pages offline show /offline.
 *  - Built assets (/_astro/, hashed names): cache first, they never change.
 *  - Fonts, icons, media: served from cache, refreshed in the background (capped).
 *  - /api/* and other origins: never touched (contact form, chat always hit the network).
 * Bump VERSION to drop old caches.
 */
const VERSION = "v1";
const CORE = `core-${VERSION}`;
const PAGES = `pages-${VERSION}`;
const MEDIA = `media-${VERSION}`;
const MEDIA_MAX = 600;
const PRECACHE = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/fonts/inter-tight-var.woff2",
  "/fonts/ibm-plex-sans-400.woff2",
  "/fonts/space-mono-400.woff2",
  "/fonts/valorant.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![CORE, PAGES, MEDIA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function page(request) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || (await caches.match("/offline")) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) (await caches.open(cacheName)).put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone()).then(() => trim(MEDIA, MEDIA_MAX));
      return res;
    })
    .catch(() => hit);
  return hit || fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") return event.respondWith(page(request));
  if (url.pathname.startsWith("/_astro/")) return event.respondWith(cacheFirst(request, CORE));
  if (/^\/(fonts|icons|media)\//.test(url.pathname) || url.pathname === "/og.png") return event.respondWith(staleWhileRevalidate(request));
});
