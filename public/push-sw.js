self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === "string" ? data.title : "SchoolDB Admissions";
  const body = typeof data.body === "string" ? data.body : "You have an admission reminder.";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/pwa-icon/192",
    badge: "/pwa-icon/192",
    tag: typeof data.tag === "string" ? data.tag : "schooldb-admissions",
    data: { url: "/admissions" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL("/admissions", self.location.origin).href;
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const windowClient of windows) {
      if (windowClient.url.startsWith(self.location.origin)) {
        await windowClient.focus();
        await windowClient.navigate(url);
        return;
      }
    }
    await clients.openWindow(url);
  })());
});
