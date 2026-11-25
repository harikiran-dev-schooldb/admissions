import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuditActor,recordActivity } from "@/lib/audit/activity";
import { Prisma } from "@/src/generated/prisma/client";
import { z } from "zod";
const headers={"Cache-Control":"private, no-store"};
type Context={params:Promise<{id:string}>};
const schema=z.object({previousSchool:z.string().trim().max(150),previousClass:z.string().trim().max(30),correspondenceAddress:z.string().trim().max(500),preferredLanguage:z.enum(["","ENGLISH","TELUGU","OTHER"]),version:z.string().nullable()}).strict();
const select={previousSchool:true,previousClass:true,correspondenceAddress:true,preferredLanguage:true,applicationSavedAt:true,updatedAt:true} as const;
export async function GET(_req:Request,{params}:Context){
  const auth=await requireAuditActor("read");if(auth.error)return auth.error;
  try{const {id}=await params;const record=await prisma.admission.findUnique({where:{id},select:{caseDetails:{select}}});if(!record)return NextResponse.json({error:"Enquiry not found"},{status:404,headers});return NextResponse.json({data:record.caseDetails},{headers});}catch(error){console.error("APPLICATION_FORM_READ",error);return NextResponse.json({error:"Unable to load application form"},{status:500,headers});}
}
export async function PUT(req:Request,{params}:Context){
  const auth=await requireAuditActor("admin");if(auth.error)return auth.error;
  try{
    const {id}=await params,parsed=schema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Check application field lengths and language"},{status:400,headers});
    const {version,...values}=parsed.data;
    const result=await prisma.$transaction(async tx=>{
      const admission=await tx.admission.findUnique({where:{id},select:{enquiryNo:true,caseDetails:true,year:{select:{isActive:true}}}});
      if(!admission)return {status:404,error:"Enquiry not found"};
      if(!admission.year.isActive)return {status:409,error:"Reactivate this academic year before editing."};
      const before=admission.caseDetails;if((before?.updatedAt.toISOString()??null)!==version)return {status:409,error:"Application changed. Reload before editing."};
      const data={previousSchool:values.previousSchool||null,previousClass:values.previousClass||null,correspondenceAddress:values.correspondenceAddress||null,preferredLanguage:values.preferredLanguage||null,applicationSavedAt:new Date()};
      const after=await tx.admissionCase.upsert({where:{admissionId:id},create:{admissionId:id,...data},update:data});
      await recordActivity(tx,auth.actor,{entityType:"ADMISSION_CASE",entityId:id,entityLabel:admission.enquiryNo,action:before?"UPDATED":"CREATED",before,after});
      return {status:200,data:{...data,updatedAt:after.updatedAt}};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json(result.status===200?{data:result.data}:{error:result.error},{status:result.status,headers});
  }catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&["P2034","P2025","P2002"].includes(error.code))return NextResponse.json({error:"Application changed. Reload before editing."},{status:409,headers});console.error("APPLICATION_FORM_SAVE_FAILED");return NextResponse.json({error:"Unable to save application form"},{status:500,headers});}
}
