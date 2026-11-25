import { NextResponse } from "next/server";
import { requireAuditActor,recordActivity } from "@/lib/audit/activity";
import { prisma } from "@/lib/prisma";
import { portalConfiguration } from "@/lib/admissions/publicPortal";
import { z } from "zod";
const headers={"Cache-Control":"private, no-store"};
const backupKey="health:backupVerification";
function safeJson(value:string|undefined){try{return value?JSON.parse(value):null;}catch{return null;}}
const isoDate=z.iso.datetime({offset:true});
const schema=z.object({snapshotName:z.string().trim().min(1).max(120),createdAt:isoDate,expiresAt:isoDate.nullable(),retentionHours:z.number().int().min(1).max(8760),restoreTested:z.boolean()}).strict();
export async function GET(){
  const auth=await requireAuditActor("admin");if(auth.error)return auth.error;
  const start=Date.now();
  try{
    await prisma.$queryRaw`SELECT 1`;
    const databaseLatencyMs=Date.now()-start;
    const [configs,pushDevices,queued,lastDelivery,archiveCount,migrations]=await Promise.all([
      prisma.admissionConfig.findMany({where:{key:{in:["health:reminderCron","health:weeklySummary",backupKey]}},select:{key:true,value:true}}),
      prisma.pushSubscription.count(),
      prisma.notificationEvent.count({where:{pushSentAt:null,createdAt:{gte:new Date(Date.now()-7*86400000)}}}),
      prisma.pushDelivery.findFirst({orderBy:{sentAt:"desc"},select:{sentAt:true}}),
      prisma.admissionArchive.count(),
      prisma.$queryRaw<Array<{migration_name:string;finished_at:Date|null}>>`SELECT migration_name,finished_at FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 1`
    ]);
    const get=(key:string)=>safeJson(configs.find(row=>row.key===key)?.value);
    const portal=portalConfiguration();
    const portalYear=portal?await prisma.academicYear.findUnique({where:{academicYear:portal.year},select:{isActive:true}}):null;
    return NextResponse.json({data:{checkedAt:new Date().toISOString(),database:{connected:true,latencyMs:databaseLatencyMs,lastMigration:migrations[0]??null},deployment:{environment:process.env.VERCEL_ENV??"local",commit:process.env.VERCEL_GIT_COMMIT_SHA??null,branch:process.env.VERCEL_GIT_COMMIT_REF??null,region:process.env.VERCEL_REGION??null},notifications:{configured:Boolean(process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_SUBJECT&&process.env.CRON_SECRET),devices:pushDevices,queued,lastRecordedReminder:lastDelivery?.sentAt??null,cron:get("health:reminderCron"),weekly:get("health:weeklySummary")},portal:{configured:Boolean(portal&&portalYear?.isActive),year:portal&&portalYear?.isActive?portal.year:null,publishedFees:Boolean(portal&&portalYear?.isActive&&portal.publishFees)},recovery:{archivedEnquiries:archiveCount,backup:get(backupKey)}}},{headers});
  }catch{console.error("ADMISSIONS_HEALTH_CHECK_FAILED");return NextResponse.json({error:"Health check could not complete. Database or a dependent query may be unavailable."},{status:503,headers});}
}
export async function PUT(req:Request){
  const auth=await requireAuditActor("admin");if(auth.error)return auth.error;
  try{
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success||new Date(parsed.data.createdAt).getTime()>Date.now()||parsed.data.expiresAt&&new Date(parsed.data.expiresAt)<=new Date(parsed.data.createdAt))return NextResponse.json({error:"Enter verified backup metadata and valid dates"},{status:400,headers});
    const value=JSON.stringify({...parsed.data,verifiedAt:new Date().toISOString(),verification:"ADMIN_RECORDED"});
    await prisma.$transaction(async tx=>{const before=await tx.admissionConfig.findUnique({where:{key:backupKey}});const after=await tx.admissionConfig.upsert({where:{key:backupKey},create:{key:backupKey,value},update:{value}});await recordActivity(tx,auth.actor,{entityType:"SETTINGS",entityId:backupKey,entityLabel:"Backup verification metadata",action:before?"UPDATED":"CREATED",before,after});});
    return NextResponse.json({success:true},{headers});
  }catch{console.error("BACKUP_VERIFICATION_SAVE_FAILED");return NextResponse.json({error:"Unable to record backup verification"},{status:500,headers});}
}
