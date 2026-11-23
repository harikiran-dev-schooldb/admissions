import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ALERT_OPTIONS, canReceiveAlert, getAlertOptions, indiaDayWindow } from "../lib/notifications/catalog.ts";

const source = (path) => readFileSync(path, "utf8");

test("all eight new admission alert types and existing follow-up types are configurable", () => {
  const types = ALERT_OPTIONS.map((entry) => entry.type);
  for (const type of ["NEW_ENQUIRY", "APPLICATION_SUBMITTED", "ENTRANCE_SCHEDULED",
    "INTERVIEW_SCHEDULED", "STUDENT_ADMITTED", "ADMISSION_CANCELLED",
    "FOLLOW_UP_COMPLETED", "DAILY_SUMMARY", "FOLLOW_UP_ASSIGNED", "FOLLOW_UP_DUE", "FOLLOW_UP_OVERDUE"]) {
    assert.ok(types.includes(type), type);
  }
  assert.ok(getAlertOptions("admin").length > getAlertOptions("staff").length);
  assert.equal(canReceiveAlert("staff", "DAILY_SUMMARY"), false);
  assert.equal(canReceiveAlert("staff", "STUDENT_ADMITTED"), false);
  assert.equal(canReceiveAlert("staff", "ENTRANCE_SCHEDULED"), true);
});

test("daily summary counts the completed IST day, not the future date", () => {
  const { start, end, label } = indiaDayWindow(new Date("2026-11-23T03:00:00.000Z"));
  assert.equal(start.toISOString(), "2026-11-21T18:30:00.000Z");
  assert.equal(end.toISOString(), "2026-11-22T18:30:00.000Z");
  assert.equal(label, "2026-11-22");
});

test("non-destructive migration persists alerts, preferences and actual exam/interview appointment timestamps", () => {
  const schema = source("prisma/schema.prisma");
  const migration = source("prisma/migrations/20261123083000_full_admission_notifications/migration.sql");
  for (const column of ["entranceScheduledAt", "interviewScheduledAt", "entranceAssignedEmail", "interviewAssignedEmail"]) {
    assert.ok(schema.includes(column), column);
    assert.ok(migration.includes(column), column);
  }
  for (const model of ["NotificationEvent", "NotificationPreference"]) {
    assert.ok(schema.includes(`model ${model}`));
    assert.ok(migration.includes(`CREATE TABLE "${model}"`));
  }
  assert.ok(schema.includes("@@unique([email, eventKey])"));
  assert.ok(schema.includes("@@unique([email, type])"));
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM|TRUNCATE TABLE/);
});

test("each business event records scoped notifications inside the successful transaction", () => {
  const create = source("app/api/admissions/route.ts");
  const stages = source("app/api/admissions/stages/route.ts");
  const complete = source("app/api/follow-ups/[id]/route.ts");
  const schedule = source("app/api/admissions/[id]/schedule/route.ts");
  const dispatch = source("lib/notifications/events.ts");
  assert.ok(create.includes('type: "NEW_ENQUIRY"'));
  assert.ok(stages.includes('"APPLICATION_SUBMITTED" as const'));
  assert.ok(stages.includes('"STUDENT_ADMITTED" as const'));
  assert.ok(stages.includes('"ADMISSION_CANCELLED" as const'));
  assert.ok(complete.includes('type: "FOLLOW_UP_COMPLETED"'));
  assert.ok(schedule.includes('type: kind'));
  for (const handler of [create, stages, complete, schedule]) assert.ok(handler.includes("after(() => dispatchForRecipients("));
  assert.ok(dispatch.includes("skipDuplicates: true"));
  assert.ok(dispatch.includes("pushClaimedAt: now"));
  assert.ok(dispatch.includes("canReceiveAlert(role, event.type)"));
});

test("schedule endpoint validates real time, permissions, active staff and saved appointment", () => {
  const api = source("app/api/admissions/[id]/schedule/route.ts");
  const ui = source("components/admissions/AdmissionSchedulePanel.tsx");
  const profile = source("components/admissions/AdmissionDetailModal.tsx");
  assert.ok(api.includes('requireAuditActor("workflow")'));
  assert.ok(api.includes('resolveAccessRole('));
  assert.ok(api.includes('actor.role !== "admin" && assignedEmail !== actor.email'));
  assert.ok(api.includes('previous.finalAdmission !== "PENDING"'));
  assert.ok(api.includes('time.getTime() < Date.now()'));
  assert.ok(api.includes('timeZone: "Asia/Kolkata"'));
  assert.ok(ui.includes('type="datetime-local"'));
  assert.ok(ui.includes("/schedule"));
  assert.ok(profile.includes("<AdmissionSchedulePanel"));
});

test("bell stores read acknowledgements and role-specific independent app/push preferences", () => {
  const bell = source("components/notifications/NotificationBell.tsx");
  const notifications = source("app/api/notifications/route.ts");
  const api = source("app/api/notifications/preferences/route.ts");
  const prefs = source("components/notifications/NotificationPreferences.tsx");
  assert.ok(bell.includes("NotificationPreferences"));
  assert.ok(bell.includes("toast.info("));
  assert.ok(bell.includes('method: "PATCH"'));
  assert.ok(notifications.includes('email: authz.actor.email, readAt: null'));
  assert.ok(notifications.includes("canReceiveAlert(authz.actor.role, event.type)"));
  assert.ok(api.includes('requireAuditActor("read")'));
  assert.ok(api.includes("canReceiveAlert(authz.actor.role, parsed.data.type)"));
  assert.ok(api.includes("notificationPreference.upsert"));
  assert.ok(prefs.includes('inAppEnabled'));
  assert.ok(prefs.includes('pushEnabled'));
  assert.ok(prefs.includes('type="checkbox"'));
});

test("daily cron issues a single previous-day summary and honors notification preferences", () => {
  const cron = source("app/api/cron/push-reminders/route.ts");
  const followUps = source("app/api/follow-ups/route.ts");
  assert.ok(cron.includes('indiaDayWindow(now)'));
  assert.ok(cron.includes('type: "DAILY_SUMMARY"'));
  assert.ok(cron.includes('eventKey: `daily-admissions:${label}`'));
  assert.ok(cron.includes("dispatchPendingAlerts()"));
  assert.ok(cron.includes('prefs.get('));
  assert.ok(followUps.includes('type: "FOLLOW_UP_ASSIGNED"'));
  assert.ok(followUps.includes('pref?.pushEnabled === false'));
});
