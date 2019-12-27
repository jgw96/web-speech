importScripts("workbox-v4.3.1/workbox-sw.js");

self.addEventListener("message", ({ data }) => {
  if (data === "skipWaiting") {
    self.skipWaiting();
  }
});

workbox.routing.registerRoute(
  new RegExp('/build/svg/'),
  new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.registerRoute(
  new RegExp('/assets/'),
  new workbox.strategies.StaleWhileRevalidate()
);

self.workbox.precaching.precacheAndRoute([]);