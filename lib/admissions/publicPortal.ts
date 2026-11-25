import { prisma } from "@/lib/prisma";
import { loadYearPolicy } from "@/lib/admissions/yearPolicyServer";

export function portalConfiguration(){
  const year=process.env.ADMISSIONS_PUBLIC_YEAR??"";
  const siteKey=process.env.TURNSTILE_SITE_KEY?.trim()??"";
  const secret=process.env.TURNSTILE_SECRET_KEY?.trim()??"";
  const hostname=process.env.ADMISSIONS_PUBLIC_HOST?.trim().toLowerCase()??"";
  const school=process.env.ADMISSIONS_SCHOOL_NAME?.trim()??"";
  if(process.env.ADMISSIONS_PUBLIC_PORTAL_ENABLED!=="true"||!/^\d{4}-\d{2}$/.test(year)||!siteKey||!secret||!/^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/.test(hostname)||!hostname.includes(".")||!school)return null;
  return {year,siteKey,secret,hostname,school,publishFees:process.env.ADMISSIONS_PUBLIC_FEES_ENABLED==="true"};
}
export async function getPublishedPortal(){
  const config=portalConfiguration();if(!config)return null;
  const active=await prisma.academicYear.findUnique({where:{academicYear:config.year},select:{isActive:true}});
  if(!active?.isActive)return null;
  const [policy,fees]=await Promise.all([loadYearPolicy(config.year),config.publishFees?prisma.feeRecord.findMany({where:{academicYear:config.year},select:{className:true,termFee:true,annualFees:true}}):Promise.resolve([])]);
  return {year:config.year,siteKey:config.siteKey,school:config.school,policy,fees};
}
export async function verifyHuman(token:string){
  const config=portalConfiguration();if(!config)return false;
  const body=new URLSearchParams({secret:config.secret,response:token});
  try{
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body,cache:"no-store",signal:AbortSignal.timeout(8000)});
    const result=await response.json() as {success?:boolean;hostname?:string;action?:string};
    return response.ok&&result.success===true&&result.hostname===config.hostname&&result.action==="admission_enquiry";
  }catch{return false;}
}
