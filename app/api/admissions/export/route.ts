import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/auth/requireAccess";
import { prisma } from "@/lib/prisma";
import { getAdmissionWhere } from "@/lib/admissions/filterQuery";
import { createWorkbook } from "@/lib/admissions/workbook";
export async function GET(req:Request){
  const authError=await requireAccess("admin");if(authError)return authError;
  const params=new URL(req.url).searchParams,year=params.get("academicYear")??"";
  if(!/^\d{4}-\d{2}$/.test(year))return NextResponse.json({error:"Select an active academic year"},{status:400});
  try{
    const active=await prisma.academicYear.findUnique({where:{academicYear:year},select:{isActive:true}});
    if(!active?.isActive)return NextResponse.json({error:"Select an active academic year"},{status:400});
    const records=await prisma.admission.findMany({where:getAdmissionWhere(params),orderBy:[{enquiryDate:"desc"},{id:"asc"}],take:10001,include:{caseDetails:{select:{source:true,cancellationReason:true}}}});
    if(records.length>10000)return NextResponse.json({error:"Narrow your filters to fewer than 10,001 records"},{status:413});
    const rows=[["Enquiry no","Student","Parent","Mobile","DOB","Age","Class","Eligible class","Application","Entrance","Interview","Admission given","Final status","Source","Cancellation reason","Enquiry date (IST)"],...records.map(row=>[row.enquiryNo,row.student,row.parent,row.mobile,row.dob,row.age,row.admClass,row.eligibleClass,row.application,row.entrance,row.interview,row.admissionGiven,row.finalAdmission,row.caseDetails?.source??"UNSPECIFIED",row.caseDetails?.cancellationReason,row.enquiryDate.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})])];
    const workbook=createWorkbook([{name:"Admissions",rows}]);
    return new Response(workbook,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":'attachment; filename="Admissions-'+year+'.xlsx"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch(error){console.error("ADMISSION_EXPORT_FAILED",error);return NextResponse.json({error:"Unable to generate workbook"},{status:500});}
}
