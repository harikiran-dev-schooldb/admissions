import { NextResponse } from "next/server";
import { requireAuditActor } from "@/lib/audit/activity";
import { prisma } from "@/lib/prisma";
import { loadCapacity } from "@/lib/admissions/yearPolicyServer";
import { isSeatAvailable, conversionRate } from "@/lib/admissions/casePolicy";
import { SCHOOL_CLASSES } from "@/lib/admissions/yearPolicy";
import { displayMemberName } from "@/lib/users/displayMemberName";
const headers={"Cache-Control":"private, no-store"};
type Counts={total:number;admitted:number;pending:number;cancelled:number};
const zero=():Counts=>({total:0,admitted:0,pending:0,cancelled:0});
export async function GET(req:Request){
  const authz=await requireAuditActor("admin");if(authz.error)return authz.error;
  const year=new URL(req.url).searchParams.get("academicYear")??"";
  if(!/^\d{4}-\d{2}$/.test(year))return NextResponse.json({error:"Choose an active academic year"},{status:400,headers});
  try{
    const active=await prisma.academicYear.findUnique({where:{academicYear:year},select:{isActive:true}});
    if(!active?.isActive)return NextResponse.json({error:"Choose an active academic year"},{status:400,headers});
    const [capacity,groups,caseGroups,waitlist,waitingTotal,years,staff]=await Promise.all([
      loadCapacity(year),
      prisma.admission.groupBy({by:["admClass","finalAdmission"],where:{academicYear:year},_count:{_all:true}}),
      prisma.$queryRaw<Array<{source:string;status:string;reason:string|null;count:number}>>`SELECT COALESCE(c."source",'UNSPECIFIED') AS source,a."finalAdmission"::text AS status,c."cancellationReason" AS reason,COUNT(*)::int AS count FROM "Admission" a LEFT JOIN "AdmissionCase" c ON c."admissionId"=a.id WHERE a."academicYear"=${year} GROUP BY 1,2,3`,
      prisma.admissionCase.findMany({where:{waitlistedAt:{not:null},admission:{academicYear:year,finalAdmission:"PENDING"}},orderBy:[{waitlistedAt:"asc"},{admissionId:"asc"}],take:200,select:{waitlistedAt:true,admission:{select:{id:true,enquiryNo:true,student:true,admClass:true}}}}),
      prisma.admissionCase.count({where:{waitlistedAt:{not:null},admission:{academicYear:year,finalAdmission:"PENDING"}}}),
      prisma.admission.groupBy({by:["academicYear","finalAdmission"],where:{year:{isActive:true}},_count:{_all:true}}),
      prisma.$queryRaw<Array<{email:string;name:string|null;action:string;count:number}>>`SELECT l."actorEmail" AS email,MAX(l."actorName") AS name,l.action,COUNT(*)::int AS count FROM "ActivityLog" l JOIN "Admission" a ON a.id=l."entityId" WHERE l."entityType"='ADMISSION' AND a."academicYear"=${year} AND l.action IN ('CREATED','STAGE_CHANGED') GROUP BY l."actorEmail",l.action`,
    ]);
    const classes=SCHOOL_CLASSES.map(className=>{const rows=groups.filter(g=>g.admClass.trim().toUpperCase()===className);const count=(status:string)=>rows.filter(r=>r.finalAdmission===status).reduce((n,r)=>n+r._count._all,0);return {className,admitted:count("ADMITTED"),pending:count("PENDING"),capacity:capacity[className]??null};});
    const sources=new Map<string,Counts>(),reasons=new Map<string,number>(),comparison=new Map<string,Counts>();
    function add(map:Map<string,Counts>,key:string,status:string,count:number){const current=map.get(key)??zero();current.total+=count;if(status==="ADMITTED")current.admitted+=count;if(status==="PENDING")current.pending+=count;if(status==="CANCELLED")current.cancelled+=count;map.set(key,current);}
    for(const g of caseGroups){add(sources,g.source,g.status,g.count);if(g.status==="CANCELLED"){const reason=g.reason??"NOT_SPECIFIED";reasons.set(reason,(reasons.get(reason)??0)+g.count);}}
    for(const g of years)add(comparison,g.academicYear,g.finalAdmission,g._count._all);
    const positions=new Map<string,number>();
    const queue=waitlist.map(row=>{const name=row.admission.admClass.trim().toUpperCase();const position=(positions.get(name)??0)+1;positions.set(name,position);const details=classes.find(c=>c.className===name);return {...row,position,available:Boolean(details&&isSeatAvailable(details.capacity??undefined,details.admitted))};});
    const people=await prisma.workspaceMember.findMany({where:{email:{in:[...new Set(staff.map(s=>s.email))]}},select:{email:true,name:true}});
    const names=new Map(people.map(p=>[p.email,p.name]));
    const staffTotals=new Map<string,{name:string;created:number;stageUpdates:number}>();
    for(const row of staff){const entry=staffTotals.get(row.email)??{name:displayMemberName(row.email,names.get(row.email)||row.name),created:0,stageUpdates:0};if(row.action==="CREATED")entry.created+=row.count;else entry.stageUpdates+=row.count;staffTotals.set(row.email,entry);}
    return NextResponse.json({data:{classes,queue,waitingTotal,sources:Array.from(sources,([source,counts])=>({source,...counts,rate:conversionRate(counts.total,counts.admitted)})),reasons:Array.from(reasons,([reason,count])=>({reason,count})),comparison:Array.from(comparison,([academicYear,counts])=>({academicYear,...counts,rate:conversionRate(counts.total,counts.admitted)})).sort((a,b)=>b.academicYear.localeCompare(a.academicYear)),staff:Array.from(staffTotals.values()).sort((a,b)=>b.created-a.created)}},{headers});
  }catch(error){console.error("ADMISSION_OPERATIONS_READ",error);return NextResponse.json({error:"Unable to load operations report"},{status:500,headers});}
}
