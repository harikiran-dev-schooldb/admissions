import { prisma } from "@/lib/prisma";
import { SCHOOL_CLASSES } from "@/lib/admissions/yearPolicy";
import { reportPeriod,targetKey,indiaDate } from "@/lib/admissions/reportPeriod";
import { loadCapacity } from "@/lib/admissions/yearPolicyServer";
export async function managementReport(year:string,from:string,to:string){
  const period=reportPeriod(from,to);if(!period)throw Error("Invalid report period");
  const {start,end}=period;
  const [cohort,decisions,totals,targets,capacity,followups]=await Promise.all([
    prisma.admission.groupBy({by:["admClass","finalAdmission"],where:{academicYear:year,enquiryDate:{gte:start,lt:end}},_count:{_all:true}}),
    prisma.$queryRaw<Array<{className:string;status:string;count:number}>>`SELECT a."admClass" AS "className", l.changes->'finalAdmission'->>'to' AS status, COUNT(*)::int AS count FROM "ActivityLog" l JOIN "Admission" a ON a.id=l."entityId" WHERE l."entityType"='ADMISSION' AND l.action='STAGE_CHANGED' AND l."createdAt">=${start} AND l."createdAt"<${end} AND a."academicYear"=${year} AND l.changes->'finalAdmission'->>'to' IN ('ADMITTED','CANCELLED') GROUP BY 1,2`,
    prisma.admission.groupBy({by:["admClass","finalAdmission"],where:{academicYear:year},_count:{_all:true}}),
    prisma.admissionConfig.findMany({where:{key:{gte:targetKey(year,from),lte:targetKey(year,to),startsWith:"dailyTarget:"+year+":"}},select:{key:true,value:true}}),
    loadCapacity(year),
    prisma.admissionFollowUp.count({where:{admission:{academicYear:year},status:"COMPLETED",completedAt:{gte:start,lt:end}}}),
  ]);
  const key=(value:string)=>value.trim().toUpperCase();
  const classes=[...new Set<string>([...SCHOOL_CLASSES,...cohort.map(row=>key(row.admClass)),...totals.map(row=>key(row.admClass))])];
  const targetTotals=new Map<string,number>(),configuredDays=new Map<string,number>();
  const targetDay=targets.find(row=>row.key===targetKey(year,to));
  let dailyTargets:Record<string,number>={};
  for(const row of targets){try{const data=JSON.parse(row.value) as Record<string,unknown>;if(!data||typeof data!=="object"||Array.isArray(data))continue;for(const name of SCHOOL_CLASSES){const value=data[name];if(typeof value==="number"&&Number.isInteger(value)&&value>=0&&value<=10000){targetTotals.set(name,(targetTotals.get(name)??0)+value);configuredDays.set(name,(configuredDays.get(name)??0)+1);if(row===targetDay)dailyTargets={...dailyTargets,[name]:value};}}}catch{/* invalid legacy config is not a target */}}
  const rows=classes.map(className=>{
    const recent=cohort.filter(row=>key(row.admClass)===className),overall=totals.filter(row=>key(row.admClass)===className);
    const current=(status:string)=>overall.filter(r=>r.finalAdmission===status).reduce((n,r)=>n+r._count._all,0);
    const events=(status:string)=>decisions.filter(r=>key(r.className)===className&&r.status===status).reduce((n,r)=>n+r.count,0);
    const target=targetTotals.get(className)??null;
    return {className,enquiries:recent.reduce((n,r)=>n+r._count._all,0),admittedEvents:events("ADMITTED"),cancelledEvents:events("CANCELLED"),cohortAdmitted:recent.filter(r=>r.finalAdmission==="ADMITTED").reduce((n,r)=>n+r._count._all,0),admitted:current("ADMITTED"),pending:current("PENDING"),cancelled:current("CANCELLED"),target,targetDays:configuredDays.get(className)??0,capacity:capacity[className as keyof typeof capacity]??null};
  });
  return {year,from,to,days:period.days,generatedAt:new Date().toISOString(),today:indiaDate(),rows,dailyTargets,followups};
}
