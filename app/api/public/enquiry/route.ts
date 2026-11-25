import { NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/src/generated/prisma/client";
import { admissionCreateSchema } from "@/lib/validation/admissions";
import { SCHOOL_CLASSES } from "@/lib/admissions/yearPolicy";
import { canonicalName } from "@/lib/admissions/duplicate";
import { portalConfiguration, verifyHuman } from "@/lib/admissions/publicPortal";
import { queueAdminAlert, dispatchForRecipients } from "@/lib/notifications/events";
const headers={"Cache-Control":"private, no-store"};
const submission=admissionCreateSchema.pick({academicYear:true,student:true,parent:true,mobile:true,dob:true,admClass:true}).extend({admClass:z.enum(SCHOOL_CLASSES),consent:z.literal(true),humanToken:z.string().min(1).max(2048)}).strict();
export async function POST(req:Request){
  const config=portalConfiguration();
  if(!config)return NextResponse.json({error:"Online enquiries are not currently open."},{status:503,headers});
  try{
    const origin=req.headers.get("origin");
    if(origin!=="https://"+config.hostname)return NextResponse.json({error:"Invalid submission origin"},{status:403,headers});
    // Limit request size before JSON parsing, including chunked requests.
    const reader=req.body?.getReader();
    if(!reader)return NextResponse.json({error:"Invalid submission"},{status:400,headers});
    const decoder=new TextDecoder();let size=0,raw="";
    while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>8192){await reader.cancel();return NextResponse.json({error:"Submission too large"},{status:413,headers});}raw+=decoder.decode(chunk.value,{stream:true});}
    raw+=decoder.decode();
    const parsed=submission.safeParse(JSON.parse(raw));
    if(!parsed.success||parsed.data.academicYear!==config.year)return NextResponse.json({error:"Check your enquiry details and consent."},{status:400,headers});
    const data=parsed.data;
    if(!await verifyHuman(data.humanToken))return NextResponse.json({error:"Human verification failed. Please retry."},{status:400,headers});
    const active=await prisma.academicYear.findUnique({where:{academicYear:config.year},select:{isActive:true}});
    if(!active?.isActive)return NextResponse.json({error:"Online enquiries are closed for this year."},{status:409,headers});
    let recipients:string[]=[];
    const accepted=await prisma.$transaction(async tx=>{
      const count=await tx.publicAdmissionEnquiry.count({where:{mobile:data.mobile,createdAt:{gte:new Date(Date.now()-86400000)}}});
      if(count>=3)return false;
      const pending=await tx.publicAdmissionEnquiry.findFirst({where:{academicYear:config.year,student:canonicalName(data.student),dob:data.dob,mobile:data.mobile,status:"PENDING"},select:{id:true}});
      if(pending)return true;
      const created=await tx.publicAdmissionEnquiry.create({data:{academicYear:config.year,student:canonicalName(data.student),parent:canonicalName(data.parent),mobile:data.mobile,dob:data.dob,admClass:data.admClass,consentAt:new Date()}});
      recipients=await queueAdminAlert(tx,{type:"PUBLIC_ENQUIRY",eventKey:"public-enquiry:"+created.id,title:"Online enquiry received",body:"New parent enquiry awaits administrator review.",href:"/admissions/public-inbox"});
      return true;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    if(!accepted)return NextResponse.json({error:"Submission limit reached. Please contact the school office."},{status:429,headers});
    if(recipients.length)after(()=>dispatchForRecipients(recipients));
    return NextResponse.json({success:true},{status:202,headers});
  }catch(error){if(error instanceof SyntaxError)return NextResponse.json({error:"Invalid submission"},{status:400,headers});if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")return NextResponse.json({error:"Please retry your submission."},{status:409,headers});console.error("PUBLIC_ENQUIRY_FAILED");return NextResponse.json({error:"Unable to submit enquiry. Please contact the school office."},{status:500,headers});}
}
