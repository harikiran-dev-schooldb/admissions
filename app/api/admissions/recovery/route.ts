import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor } from "@/lib/audit/activity";
import { restoreAdmission, ArchiveConflict } from "@/lib/admissions/archive";
import { DuplicateEnquiry } from "@/lib/admissions/duplicateServer";
import { Prisma } from "@/src/generated/prisma/client";
import { z } from "zod";
const headers={"Cache-Control":"private, no-store"};
export async function GET(req:Request){
  const authz=await requireAuditActor("admin");if(authz.error)return authz.error;
  const page=Math.max(1,Math.min(10000,Math.floor(Number(new URL(req.url).searchParams.get("page"))||1)));
  try{
    const [data,total]=await Promise.all([prisma.admissionArchive.findMany({orderBy:[{archivedAt:"desc"},{id:"asc"}],skip:(page-1)*25,take:25,select:{id:true,enquiryNo:true,academicYear:true,archivedAt:true}}),prisma.admissionArchive.count()]);
    return NextResponse.json({data,total,page,pageSize:25},{headers});
  }catch(error){console.error("ADMISSION_ARCHIVE_LIST",error);return NextResponse.json({error:"Unable to load recovery archive"},{status:500,headers});}
}
export async function POST(req:Request){
  const authz=await requireAuditActor("admin");if(authz.error)return authz.error;
  try{
    const parsed=z.object({id:z.string().min(1).max(120)}).strict().safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Invalid archived enquiry"},{status:400,headers});
    const restored=await prisma.$transaction(tx=>restoreAdmission(tx,parsed.data.id,authz.actor),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({data:{id:restored.id,enquiryNo:restored.enquiryNo}},{headers});
  }catch(error){
    if(error instanceof ArchiveConflict||error instanceof DuplicateEnquiry)return NextResponse.json({error:error.message},{status:409,headers});
    if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2002","P2025","P2034"].includes(error.code))return NextResponse.json({error:"Restoration conflict. Refresh and try again."},{status:409,headers});
    console.error("ADMISSION_ARCHIVE_RESTORE",error);return NextResponse.json({error:"Unable to restore enquiry"},{status:500,headers});
  }
}
