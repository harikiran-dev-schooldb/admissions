import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor,recordActivity } from "@/lib/audit/activity";
import { managementReport } from "@/lib/admissions/managementReport";
import { reportPeriod,dayStart,targetKey } from "@/lib/admissions/reportPeriod";
import { SCHOOL_CLASSES } from "@/lib/admissions/yearPolicy";
import { createWorkbook } from "@/lib/admissions/workbook";
import { z } from "zod";
const headers={"Cache-Control":"private, no-store"};
const schema=z.object({academicYear:z.string().regex(/^\d{4}-\d{2}$/),date:z.string(),targets:z.partialRecord(z.enum(SCHOOL_CLASSES),z.number().int().min(0).max(10000))}).strict();
export async function GET(req:Request){
  const auth=await requireAuditActor("admin");if(auth.error)return auth.error;
  const p=new URL(req.url).searchParams,year=p.get("academicYear")??"",from=p.get("from")??"",to=p.get("to")??"";
  if(!/^\d{4}-\d{2}$/.test(year)||!reportPeriod(from,to))return NextResponse.json({error:"Choose valid dates (maximum 366 days) and an academic year"},{status:400,headers});
  try{
    const active=await prisma.academicYear.findUnique({where:{academicYear:year},select:{isActive:true}});
    if(!active?.isActive)return NextResponse.json({error:"Choose an active academic year"},{status:400,headers});
    const data=await managementReport(year,from,to);
    if(p.get("format")==="xlsx"){
      const book=createWorkbook([{name:"Period report",rows:[["Class","New enquiries","Admitted decisions","Cancelled decisions","Enquiry cohort now admitted","Target admissions","Configured target days","Year admitted","Year pending","Year cancelled","Seat capacity"],...data.rows.map(r=>[r.className,r.enquiries,r.admittedEvents,r.cancelledEvents,r.cohortAdmitted,r.target,r.targetDays,r.admitted,r.pending,r.cancelled,r.capacity])]},{name:"Report context",rows:[["Field","Value"],["Academic year",year],["From (IST)",from],["To (IST, inclusive)",to],["Follow-ups completed",data.followups],["Decision counts","Recorded stage-change events for live enquiries; repeated decisions after reopening can count more than once."],["Targets","Sum of explicitly configured daily targets only. Blank means not configured."],["Cohort","Enquiries created during selected dates and their current final status."]]}]);
      return new Response(book,{headers:{...headers,"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":'attachment; filename="Admission-report-'+year+'-'+from+'-'+to+'.xlsx"'}});
    }
    return NextResponse.json({data},{headers});
  }catch(error){console.error("MANAGEMENT_REPORT_FAILED",error);return NextResponse.json({error:"Unable to load report"},{status:500,headers});}
}
export async function PUT(req:Request){
  const auth=await requireAuditActor("admin");if(auth.error)return auth.error;
  try{
    const parsed=schema.safeParse(await req.json());if(!parsed.success||!dayStart(parsed.data.date))return NextResponse.json({error:"Enter a valid date and non-negative whole-number targets"},{status:400,headers});
    const {academicYear,date,targets}=parsed.data;
    const active=await prisma.academicYear.findUnique({where:{academicYear},select:{isActive:true}});
    if(!active?.isActive)return NextResponse.json({error:"Choose an active academic year"},{status:400,headers});
    const key=targetKey(academicYear,date),value=JSON.stringify(targets);
    await prisma.$transaction(async tx=>{const before=await tx.admissionConfig.findUnique({where:{key}});const after=await tx.admissionConfig.upsert({where:{key},update:{value},create:{key,value}});await recordActivity(tx,auth.actor,{entityType:"SETTINGS",entityId:key,entityLabel:key,action:before?"UPDATED":"CREATED",before,after});});
    return NextResponse.json({success:true},{headers});
  }catch(error){console.error("SAVE_DAILY_TARGET_FAILED",error);return NextResponse.json({error:"Unable to save targets"},{status:500,headers});}
}
