import { prisma } from "@/lib/prisma";
import { previousWeek } from "@/lib/admissions/reportPeriod";
import { queueAdminAlert } from "@/lib/notifications/events";
import { Prisma } from "@/src/generated/prisma/client";
export const WEEKLY_HEALTH_KEY="health:weeklySummary";
export async function queueWeeklySummary(now:Date){
  const week=previousWeek(now);
  const existing=await prisma.admissionConfig.findUnique({where:{key:WEEKLY_HEALTH_KEY},select:{value:true}});
  try{if(existing&&JSON.parse(existing.value).from===week.from)return 0;}catch{/* invalid marker can be repaired */}
  const [enquiries,decisions,pending]=await Promise.all([
    prisma.admission.count({where:{year:{isActive:true},enquiryDate:{gte:week.start,lt:week.end}}}),
    prisma.$queryRaw<Array<{status:string;count:number}>>`SELECT l.changes->'finalAdmission'->>'to' AS status, COUNT(*)::int AS count FROM "ActivityLog" l JOIN "Admission" a ON a.id=l."entityId" JOIN "AcademicYear" y ON y."academicYear"=a."academicYear" WHERE y."isActive"=true AND l."entityType"='ADMISSION' AND l.action='STAGE_CHANGED' AND l."createdAt">=${week.start} AND l."createdAt"<${week.end} AND l.changes->'finalAdmission'->>'to' IN ('ADMITTED','CANCELLED') GROUP BY 1`,
    prisma.admission.count({where:{year:{isActive:true},finalAdmission:"PENDING"}})
  ]);
  const count=(status:string)=>decisions.find(row=>row.status===status)?.count??0;
  return prisma.$transaction(async tx=>{
    const marker=await tx.admissionConfig.findUnique({where:{key:WEEKLY_HEALTH_KEY},select:{value:true}});
    try{if(marker&&JSON.parse(marker.value).from===week.from)return 0;}catch{/* repair */}
    const recipients=await queueAdminAlert(tx,{type:"WEEKLY_SUMMARY",eventKey:"weekly-admissions:"+week.from,title:"Weekly admissions · "+week.from+" to "+week.to,body:enquiries+" new enquiries · "+count("ADMITTED")+" admitted decisions · "+count("CANCELLED")+" cancelled decisions · "+pending+" pending now (active years).",href:"/admissions/reports"});
    const value=JSON.stringify({from:week.from,to:week.to,queuedAt:now.toISOString(),recipients:recipients.length});
    await tx.admissionConfig.upsert({where:{key:WEEKLY_HEALTH_KEY},update:{value},create:{key:WEEKLY_HEALTH_KEY,value}});
    return recipients.length;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
