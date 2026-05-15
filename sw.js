const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/index.html",
  "/app.js",
  "/css/base.css",
  "/css/layout.css",
  "/css/components.css",
  "/css/responsive.css",
];

const API_ROUTES = ["/api/database", "/api/health", "/api/uploads"];

// Install: pre-cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Determine caching strategy based on request URL.
 */
function getStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/index.html" || STATIC_ASSETS.includes(pathname)) {
    return "cache-first";
  }

  if (pathname.startsWith("/uploads/")) {
    return "cache-first";
  }

  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/uploads")
  ) {
    return "network-first";
  }

  if (pathname.startsWith("/client/")) {
    return "cache-first";
  }

  return "network-only";
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Fetch: route to appropriate strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests and non-http(s) schemes
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  const strategy = getStrategy(request);

  if (strategy === "cache-first") {
    event.respondWith(cacheFirst(request));
  } else if (strategy === "network-first") {
    event.respondWith(networkFirst(request));
  }
  // "network-only" falls through to default browser behavior
});

// Message handling: allow app to trigger update checks
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
