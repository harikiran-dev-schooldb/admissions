import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(path, "utf8");

test("foreground due follow-ups surface a visible toast on iPhone and desktop", () => {
  const bell = source("components/notifications/NotificationBell.tsx");
  assert.ok(bell.includes("toast.warning("));
  assert.ok(bell.includes("newDue.length"));
  assert.ok(bell.includes('onClick: () => window.location.assign("/admissions")'));
  assert.ok(bell.includes("popupKey(email)"));
  assert.ok(bell.includes("read.includes(item.id)"));
  assert.ok(!bell.includes("new Notification("));
});

test("bell can send a real test push and reports errors or provider acceptance", () => {
  const bell = source("components/notifications/NotificationBell.tsx");
  const api = source("app/api/notifications/test/route.ts");
  const proxy = source("proxy.ts");
  assert.ok(bell.includes('fetch("/api/notifications/test"'));
  assert.ok(bell.includes("Send test pop-up"));
  assert.ok(bell.includes("setPushError("));
  assert.ok(api.includes('requireAuditActor("read")'));
  assert.ok(api.includes("deliverPushToEmail(authz.actor.email"));
  assert.ok(api.includes('status: 409'));
  assert.ok(api.includes('status: 502'));
  assert.ok(api.includes('Cache-Control'));
  assert.ok(proxy.includes('"/api/notifications/:path*"'));
});

test("follow-up creation triggers immediate best-effort push to the assigned account", () => {
  const create = source("app/api/follow-ups/route.ts");
  const delivery = source("lib/notifications/deliverToEmail.ts");
  assert.ok(create.includes("after(async () => {"));
  assert.ok(create.includes("deliverPushToEmail(assignedToEmail"));
  assert.ok(create.includes('title: "New admission follow-up assigned"'));
  assert.ok(create.includes('return NextResponse.json({ data: created }, { status: 201'));
  assert.ok(delivery.includes('where: { email: email.trim().toLowerCase() }'));
  assert.ok(delivery.includes("status === 404 || status === 410"));
  assert.ok(delivery.includes("status >= 200 && status < 300"));
  assert.ok(!delivery.includes("console.log(subscription)"));
});

test("only the visible responsive header mounts a notification bell", () => {
  const account = source("components/AccountMenu.tsx");
  const sidebar = source("components/AppSidebar.tsx");
  assert.ok(account.includes("window.matchMedia"));
  assert.ok(account.includes("showNotificationBell && <NotificationBell />"));
  assert.ok(account.includes("compact ? mobileViewport : !mobileViewport"));
  assert.ok(sidebar.includes("<AccountMenu compact />"));
});

test("service worker shows push notifications; cron remains authenticated", () => {
  const worker = source("public/push-sw.js");
  const cron = source("app/api/cron/push-reminders/route.ts");
  assert.ok(worker.includes('self.addEventListener("push"'));
  assert.ok(worker.includes("self.registration.showNotification("));
  assert.ok(worker.includes('self.addEventListener("notificationclick"'));
  assert.ok(cron.includes('request.headers.get("authorization")'));
  assert.ok(cron.includes("sendWebPush(device,"));
});
