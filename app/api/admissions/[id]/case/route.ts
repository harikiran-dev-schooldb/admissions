import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuditActor, recordActivity } from "@/lib/audit/activity";
import { displayMemberName } from "@/lib/users/displayMemberName";
import { DOCUMENT_KINDS, DOCUMENT_STATUSES, ENQUIRY_SOURCES, CANCELLATION_REASONS } from "@/lib/admissions/casePolicy";
import { loadCapacity } from "@/lib/admissions/yearPolicyServer";
import type { SchoolClass } from "@/lib/admissions/yearPolicy";
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };
const updateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("document"), kind: z.string().refine(value=>DOCUMENT_KINDS.some(kind=>kind.value===value)), status: z.enum(DOCUMENT_STATUSES) }).strict(),
  z.object({ type: z.literal("case"), source: z.enum(ENQUIRY_SOURCES), cancellationReason: z.enum(CANCELLATION_REASONS).nullable(), waitlisted: z.boolean() }).strict(),
]);
export async function GET(_req: Request, { params }: Context) {
  const authz = await requireAuditActor("read");
  if (authz.error) return authz.error;
  try {
    const { id } = await params;
    const admission = await prisma.admission.findUnique({ where: { id }, include: { documents: true, caseDetails: true } });
    if (!admission) return NextResponse.json({ error: "Enquiry not found" }, { status:404, headers });
    const emails = admission.documents.flatMap(doc=>doc.verifiedByEmail ? [doc.verifiedByEmail] : []);
    const people = await prisma.workspaceMember.findMany({where:{email:{in:emails}},select:{email:true,name:true}});
    const names = new Map(people.map(p=>[p.email,p.name]));
    let seat = null;
    if(authz.actor.role === "admin") {
      const capacity = (await loadCapacity(admission.academicYear))[admission.admClass.trim().toUpperCase() as SchoolClass];
      const admitted = await prisma.admission.count({where:{academicYear:admission.academicYear,admClass:{equals:admission.admClass,mode:"insensitive"},finalAdmission:"ADMITTED"}});
      seat = { capacity:capacity??null, admitted };
    }
    return NextResponse.json({data:{
      documents:admission.documents.map(({verifiedByEmail,...doc})=>({...doc,verifiedByName:verifiedByEmail?displayMemberName(verifiedByEmail,names.get(verifiedByEmail)):null})),
      caseDetails:admission.caseDetails, seat,
    }},{headers});
  } catch(error) {console.error("ADMISSION_CASE_READ",error);return NextResponse.json({error:"Unable to load verification details"},{status:500,headers});}
}
export async function PATCH(req: Request, { params }: Context) {
  const authz = await requireAuditActor("workflow");
  if (authz.error) return authz.error;
  const actor=authz.actor;
  try {
    const { id }=await params;
    const parsed=updateSchema.safeParse(await req.json());
    if(!parsed.success)return NextResponse.json({error:"Invalid verification update"},{status:400,headers});
    const data=parsed.data;
    if(data.type==="case"&&actor.role!=="admin")return NextResponse.json({error:"Administrator access required"},{status:403,headers});
    const result=await prisma.$transaction(async tx=>{
      const admission=await tx.admission.findUnique({where:{id},select:{id:true,enquiryNo:true,finalAdmission:true}});
      if(!admission)return {status:404,error:"Enquiry not found"};
      if(data.type==="document"){
        const key={admissionId:id,kind:data.kind};
        const before=await tx.admissionDocument.findUnique({where:{admissionId_kind:key}});
        if(before?.status===data.status)return {status:200};
        const update={status:data.status,verifiedAt:data.status==="VERIFIED"?new Date():null,verifiedByEmail:data.status==="VERIFIED"?actor.email:null};
        const after=await tx.admissionDocument.upsert({where:{admissionId_kind:key},create:{...key,...update},update});
        await recordActivity(tx,actor,{entityType:"DOCUMENT",action:before?"UPDATED":"CREATED",entityId:id,entityLabel:admission.enquiryNo,before,after});
      } else {
        if(data.waitlisted&&admission.finalAdmission!=="PENDING")return {status:409,error:"Only pending enquiries can be waitlisted"};
        if(data.cancellationReason&&admission.finalAdmission!=="CANCELLED")return {status:409,error:"Cancellation reasons apply only to cancelled enquiries"};
        const before=await tx.admissionCase.findUnique({where:{admissionId:id}});
        const update={source:data.source,cancellationReason:data.cancellationReason,waitlistedAt:data.waitlisted?(before?.waitlistedAt??new Date()):null};
        const after=await tx.admissionCase.upsert({where:{admissionId:id},create:{admissionId:id,...update},update});
        await recordActivity(tx,actor,{entityType:"ADMISSION_CASE",action:before?"UPDATED":"CREATED",entityId:id,entityLabel:admission.enquiryNo,before,after});
      }
      return {status:200};
    });
    return NextResponse.json(result.status===200?{success:true}:{error:result.error},{status:result.status,headers});
  }catch(error){console.error("ADMISSION_CASE_UPDATE",error);return NextResponse.json({error:"Unable to save verification details"},{status:500,headers});}
}
