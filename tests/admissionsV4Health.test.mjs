import test from "node:test";
import assert from "node:assert/strict";
import { portalText, localizedAge } from "../lib/admissions/portalLanguage.ts";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(p,"utf8");
test("bilingual portal keeps all consent and outcome translations",()=>{
 assert.deepEqual(Object.keys(portalText.en),Object.keys(portalText.te));assert.match(portalText.te.consent,/సమ్మతిస్తున్నాను/);assert.match(localizedAge({years:5,months:2,days:1},"te"),/5 సంవత్సరాలు 2 నెలలు 1 రోజులు/);
 assert.match(src("components/admissions/PublicEnquiryForm.tsx"),/lang=\{lang\}/);assert.match(src("app/enquire/page.tsx"),/if\(!portal\)return <ClosedParentPortal/);
});
test("weekly summary uses completed IST week, admin alerts, idempotent event keys",()=>{
 const report=src("lib/notifications/weeklySummary.ts"),cron=src("app/api/cron/push-reminders/route.ts");
 assert.match(report,/previousWeek\(now\)/);assert.match(report,/queueAdminAlert/);assert.match(report,/eventKey:"weekly-admissions:"\+week.from/);assert.match(cron,/await queueWeeklySummary\(now\)/);assert.match(cron,/health:reminderCron/);
});
test("health routes are admin-only and never expose secret values or restore production",()=>{
 const api=src("app/api/admissions/health/route.ts");
 assert.match(api,/requireAuditActor\("admin"\)/);assert.match(api,/SELECT 1/);assert.match(api,/ADMIN_RECORDED/);assert.doesNotMatch(api,/restore_snapshot|restoreBranch|process\.env\.DATABASE_URL/);
});
