import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/requireAccess";
import { prisma } from "@/lib/prisma";
import { parseImportCsv } from "@/lib/admissions/importCsv";
import { admissionCreateSchema } from "@/lib/validation/admissions";
import { SCHOOL_CLASSES, eligibleForPolicy } from "@/lib/admissions/yearPolicy";
import { ENQUIRY_SOURCES } from "@/lib/admissions/casePolicy";
import { calculateAge,getEligibleClass } from "@/lib/eligibility";
import { loadYearPolicy } from "@/lib/admissions/yearPolicyServer";
import { canonicalName,isDuplicateEnquiry } from "@/lib/admissions/duplicate";
const headers={"Cache-Control":"private, no-store"};
export async function POST(req:Request){
  const accessError=await requireAccess("admin");if(accessError)return accessError;
  const year=new URL(req.url).searchParams.get("academicYear")??"";
  if(!/^\d{4}-\d{2}$/.test(year))return NextResponse.json({error:"Select an active academic year"},{status:400,headers});
  try{
    const reader=req.body?.getReader();if(!reader)return NextResponse.json({error:"Missing CSV file"},{status:400,headers});
    let size=0,raw="";const decoder=new TextDecoder();
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>300000){await reader.cancel();return NextResponse.json({error:"CSV exceeds 300 KB"},{status:413,headers});}raw+=decoder.decode(part.value,{stream:true});}raw+=decoder.decode();
    let rows;try{rows=parseImportCsv(raw);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid CSV"},{status:400,headers});}
    const active=await prisma.academicYear.findUnique({where:{academicYear:year},select:{isActive:true}});
    if(!active?.isActive)return NextResponse.json({error:"Select an active academic year"},{status:400,headers});
    const policy=await loadYearPolicy(year);
    const names=[...new Set(rows.map(row=>canonicalName(row.input.student)))],phones=[...new Set(rows.flatMap(row=>[row.input.mobile,"91"+row.input.mobile,"+91"+row.input.mobile]))];
    const existing=await prisma.admission.findMany({where:{academicYear:year,OR:[{student:{in:names,mode:"insensitive"}},{mobile:{in:phones}}]},select:{student:true,mobile:true,dob:true,enquiryNo:true}});
    const seen:typeof rows=[];
    const data=rows.map(row=>{
      const input={...row.input,academicYear:year};
      const parsed=admissionCreateSchema.safeParse(input);
      const errors=parsed.success?[]:parsed.error.issues.map(issue=>String(issue.path[0])+": "+issue.message);
      if(!SCHOOL_CLASSES.some(name=>name===input.admClass))errors.push("Choose a supported class.");
      if(!ENQUIRY_SOURCES.some(source=>source===input.source))errors.push("Invalid enquiry source.");
      const match=existing.find(candidate=>isDuplicateEnquiry(input,candidate));
      if(match)errors.push("Existing enquiry: "+match.enquiryNo);
      const earlier=seen.find(candidate=>isDuplicateEnquiry(input,candidate.input));
      if(earlier)errors.push("Duplicate of CSV record "+earlier.line);
      if(!errors.length)seen.push(row);
      const age=calculateAge(input.dob,policy.ageAsOfDate),eligible=age?eligibleForPolicy(age,getEligibleClass(age.years),input.admClass,policy.rules):"NOT ELIGIBLE";
      return {...row,input,errors,age:age?.text??"",eligibleClass:eligible};
    });
    return NextResponse.json({data,ready:data.filter(row=>!row.errors.length).length},{headers});
  }catch(error){console.error("IMPORT_PREVIEW_FAILED",error);return NextResponse.json({error:"Unable to validate import"},{status:500,headers});}
}
