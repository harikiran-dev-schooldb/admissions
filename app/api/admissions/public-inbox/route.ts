import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor,recordActivity } from "@/lib/audit/activity";
import { portalConfiguration } from "@/lib/admissions/publicPortal";
import { z } from "zod";
const headers={"Cache-Control":"private, no-store"};
export async function GET(req:Request){
  const authz=await requireAuditActor("admin");if(authz.error)return authz.error;
  const page=Math.max(1,Math.min(10000,Math.floor(Number(new URL(req.url).searchParams.get("page"))||1)));
  try{
    const [data,total]=await Promise.all([prisma.publicAdmissionEnquiry.findMany({where:{status:"PENDING"},orderBy:[{createdAt:"asc"},{id:"asc"}],skip:(page-1)*20,take:20,select:{id:true,student:true,parent:true,mobile:true,dob:true,admClass:true,academicYear:true,createdAt:true}}),prisma.publicAdmissionEnquiry.count({where:{status:"PENDING"}})]);
    const config=portalConfiguration();
    const active=config?await prisma.academicYear.findUnique({where:{academicYear:config.year},select:{isActive:true}}):null;
    const portalUrl=config&&active?.isActive?"https://"+config.hostname+"/enquire":null;
    return NextResponse.json({data,total,page,pageSize:20,portalConfigured:Boolean(portalUrl),portalUrl},{headers});
  }catch(error){console.error("PUBLIC_INBOX_READ",error);return NextResponse.json({error:"Unable to load parent enquiries"},{status:500,headers});}
}
export async function PATCH(req:Request){
  const authz=await requireAuditActor("admin");if(authz.error)return authz.error;
  try{
    const parsed=z.object({id:z.string().min(1).max(120)}).strict().safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Invalid enquiry"},{status:400,headers});
    const dismissed=await prisma.$transaction(async tx=>{
      const changed=await tx.publicAdmissionEnquiry.updateMany({where:{id:parsed.data.id,status:"PENDING"},data:{status:"DISMISSED",reviewedAt:new Date(),student:"",parent:"",mobile:"",dob:""}});
      if(changed.count)await recordActivity(tx,authz.actor,{entityType:"ADMISSION_CASE",entityId:parsed.data.id,entityLabel:"Online enquiry dismissed",action:"DEACTIVATED"});
      return changed.count;
    });
    return dismissed?NextResponse.json({success:true},{headers}):NextResponse.json({error:"Already reviewed"},{status:409,headers});
  }catch(error){console.error("PUBLIC_INBOX_DISMISS",error);return NextResponse.json({error:"Unable to dismiss enquiry"},{status:500,headers});}
}
