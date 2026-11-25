import { getAuthorizedRole } from "@/lib/auth/requireAccess";
import { prisma } from "@/lib/prisma";
import { formatAdmissionDob } from "@/lib/admissions/formatAdmissionDob";
import PrintButton from "@/components/admissions/PrintButton";
export const dynamic="force-dynamic";
const titles={application:"Admission application form",acknowledgement:"Enquiry acknowledgement",entrance:"Entrance examination slip",interview:"Interview call letter",fees:"Fee quotation",confirmation:"Admission confirmation"} as const;
type Kind=keyof typeof titles;
const date=(value:Date)=>value.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"long",timeStyle:"short"});
export default async function PrintPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{kind?:string}>}){
  const access=await getAuthorizedRole();if(access.error||!access.role)return <main className="p-8">Access denied. Sign in to the school workspace.</main>;
  const {id}=await params;const {kind:raw}=await searchParams;const kind=raw as Kind;
  if(!Object.hasOwn(titles,kind))return <main className="p-8">Unknown document.</main>;
  const admission=await prisma.admission.findUnique({where:{id},include:{caseDetails:kind==="application"}});if(!admission)return <main className="p-8">Enquiry not found.</main>;
  const appointment=kind==="entrance"?admission.entranceScheduledAt:kind==="interview"?admission.interviewScheduledAt:null;
  if((kind==="entrance"||kind==="interview")&&(!appointment||admission.finalAdmission!=="PENDING"))return <main className="p-8">No active appointment is available for this document.</main>;
  if(kind==="confirmation"&&admission.finalAdmission!=="ADMITTED")return <main className="p-8">Admission is not confirmed.</main>;
  const year=await prisma.academicYear.findUnique({where:{academicYear:admission.academicYear},select:{isActive:true}});
  if(kind==="fees"&&!year?.isActive)return <main className="p-8">Fee quotation unavailable for inactive academic year.</main>;
  const fees=kind==="fees"?await prisma.feeRecord.findFirst({where:{academicYear:admission.academicYear,className:{equals:admission.admClass,mode:"insensitive"}}}):null;
  if(kind==="fees"&&!fees)return <main className="p-8">No approved fee record for this class and academic year.</main>;
  const school=process.env.ADMISSIONS_SCHOOL_NAME?.trim()||"SchoolDB Admissions";
  const fields=[["Enquiry number",admission.enquiryNo],["Student",admission.student],["Parent / guardian",admission.parent??"—"],["Class",admission.admClass],["Academic year",admission.academicYear],["Date of birth",formatAdmissionDob(admission.dob)]];
  return <main className="mx-auto max-w-[820px] bg-white p-5 text-slate-900 sm:p-10 print:max-w-none print:p-0"><div className="mb-6 flex items-center justify-between print:hidden"><p className="text-sm text-slate-500">Private school document · review before sharing</p><PrintButton/></div>
  <article className="rounded-xl border border-slate-300 p-6 sm:p-10 print:rounded-none"><header className="border-b-2 border-indigo-700 pb-5 text-center"><p className="text-2xl font-black">{school}</p><h1 className="mt-3 text-xl font-bold uppercase tracking-wide">{titles[kind]}</h1></header>
  <p className="mt-4 text-right text-xs text-slate-600">Prepared {date(new Date())} IST</p><dl className="mt-5 divide-y divide-slate-200">{fields.map(([label,value])=><div key={label} className="grid grid-cols-2 gap-3 py-3 text-sm"><dt className="font-semibold text-slate-600">{label}</dt><dd className="break-words font-bold">{value}</dd></div>)}</dl>
  {kind==="application"&&<><dl className="mt-2 divide-y divide-slate-200">{[["Mobile",admission.mobile],["Previous school",admission.caseDetails?.previousSchool??""],["Previous class",admission.caseDetails?.previousClass??""],["Correspondence address",admission.caseDetails?.correspondenceAddress??""],["Preferred language",admission.caseDetails?.preferredLanguage??""]].map(([label,value])=><div key={label} className="grid grid-cols-2 gap-3 py-3 text-sm"><dt className="font-semibold text-slate-600">{label}</dt><dd className="whitespace-pre-wrap break-words font-semibold">{value||"____________________"}</dd></div>)}</dl><p className="mt-5 text-sm leading-6">Parent / guardian declaration: I confirm the information provided in this application is correct to the best of my knowledge. I understand that submission does not guarantee admission.</p><div className="mt-8 text-sm font-bold">Parent / guardian signature: __________________ · Date: __________</div></>}
  {appointment&&<p className="mt-5 rounded-lg border border-slate-300 p-4 text-base font-bold">Scheduled: {date(appointment)} IST</p>}
  {fees&&<div className="mt-5 rounded-lg border border-slate-300 p-4"><p>Term fee: <strong>₹{fees.termFee.toLocaleString("en-IN")}</strong></p><p className="mt-2">Annual fee: <strong>₹{fees.annualFees.toLocaleString("en-IN")}</strong></p><p className="mt-2 text-xs text-slate-600">Configured fees only; not a payment receipt or total of both amounts.</p></div>}
  <p className="mt-6 text-sm leading-6">{kind==="application"?"Application form for school review. This is not an admission confirmation.":kind==="confirmation"?"The school admission record shows the student as admitted.":kind==="acknowledgement"?"This acknowledges the enquiry only and is not an admission confirmation.":kind==="fees"?"Please verify the current approved amounts with the school office before payment.":"Please contact the admission office for venue and further instructions."}</p><div className="mt-14 text-right text-sm font-bold">Authorised school representative<br/>Signature: __________________</div></article></main>;
}
