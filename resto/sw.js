// DropBy service worker: shows push notifications and opens the app when one is tapped.
// Served next to the page (/app/sw.js and /resto/sw.js).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "DropBy", body: e.data ? e.data.text() : "" }; }
  // an order waiting for the restaurant (sent with the /resto/ link, also reminded every minute by SQL v31):
  // long vibration, and the notification stays on screen until it is tapped
  const forVendor = /\/resto\//.test(d.url || "");
  // tapping opens this worker's own place: the app for a manager who turned notifications on in the app,
  // DropBy Resto for one who turned them on in Resto
  const scope = self.registration.scope,
    target = d.url && new URL(d.url, self.location.origin).href.startsWith(scope) ? d.url : scope;
  e.waitUntil(self.registration.showNotification(d.title || "DropBy", {
    body: d.body || "",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    requireInteraction: forVendor,
    icon: "/icon-192.png",
    badge: "/favicon-96x96.png",
    vibrate: forVendor ? [500, 200, 500, 200, 500, 200, 900] : [180, 80, 180],
    data: { url: target }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || self.registration.scope, self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) if (w.url.startsWith(self.registration.scope)) { await w.focus(); return; }
    await self.clients.openWindow(url);
  })());
});
