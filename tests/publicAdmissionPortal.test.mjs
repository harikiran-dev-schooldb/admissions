import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=path=>readFileSync(path,"utf8");
test("public portal is opt-in with approved year, hostname, school and human verification",()=>{
  const config=source("lib/admissions/publicPortal.ts"),api=source("app/api/public/enquiry/route.ts");
  assert.match(config,/ADMISSIONS_PUBLIC_PORTAL_ENABLED!=="true"/);assert.match(config,/result.hostname===config.hostname/);assert.match(config,/result.action==="admission_enquiry"/);assert.match(config,/ADMISSIONS_PUBLIC_FEES_ENABLED==="true"/);
  assert.match(api,/consent:z.literal\(true\)/);assert.match(api,/await verifyHuman\(data.humanToken\)/);assert.match(api,/count>=3/);assert.match(api,/size>8192/);assert.doesNotMatch(api,/tx\.admission\.create\(/);
});
test("public enquiry conversion is administrator-only, atomic and clears duplicate personal details",()=>{
  const api=source("app/api/admissions/route.ts"),inbox=source("app/api/admissions/public-inbox/route.ts");
  assert.match(api,/body.publicEnquiryId && actor.role!=="admin"/);assert.match(api,/pending.status!=="PENDING"/);assert.match(api,/tx.publicAdmissionEnquiry.updateMany/);assert.match(api,/status:"ACCEPTED",reviewedAt:new Date\(\),convertedAdmissionId:created.id,student:"",parent:"",mobile:"",dob:""/);
  assert.match(inbox,/requireAuditActor\("admin"\)/);assert.match(inbox,/status:"DISMISSED",reviewedAt:new Date\(\),student:"",parent:"",mobile:"",dob:""/);
});
