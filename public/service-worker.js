const CACHE = "training-4-life-v5";
const ICONS = [
  "block-up-overs.png", "plank-to-rotation.png", "scapular-push-up.png", "overhead-press.png", "i-t-y.png", "face-pulls.png",
  "swimmers.png", "open-book.png", "banded-7s.png", "windmill.png", "kb-waiter.png", "crossovers.png", "push-ups.png",
  "bench-press.png", "hollow-body-hold.png", "wall-slide.png", "dead-hang.png", "balance.png", "farmers-carry.png", "side-plank.png", "walking.png",
].map((file) => `./exercise-icons/${file}`);
const SHELL = ["./", "./manifest.webmanifest", "./og.png", "./favicon.svg", ...ICONS];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Always let the browser check for a newer worker script. Returning a
  // cached service-worker.js can strand an installed home-screen app on an
  // older release indefinitely.
  if (new URL(event.request.url).pathname.endsWith("/service-worker.js")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./"))),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        }),
    ),
  );
});
