"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Admission } from "@/src/generated/prisma/client";
import { TEMPLATE_TYPES, parentMessage, whatsappContact, type TemplateType } from "@/lib/admissions/communication";
import { labelCode } from "@/lib/admissions/casePolicy";
import DigitalApplicationForm from "@/components/admissions/DigitalApplicationForm";
const PRINT_TYPES=["acknowledgement","entrance","interview","fees","confirmation"] as const;
export default function AdmissionCommunication({student}:{student:Admission}){
  const [type,setType]=useState<TemplateType>("ACKNOWLEDGEMENT");
  const message=parentMessage(type,student,"the school");
  const phone=whatsappContact(student.mobile);
  return <div className="space-y-4">
    <DigitalApplicationForm key={student.id} student={student}/>
    <section className="premium-panel rounded-[22px] p-4 sm:p-6"><h3 className="text-lg font-black">Parent communication</h3><p className="mt-1 text-sm text-slate-600">Review the message before sending manually. Nothing is sent automatically.</p>
      <label className="mt-4 block text-sm font-bold">Message template<select className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={type} onChange={event=>setType(event.target.value as TemplateType)}>{TEMPLATE_TYPES.map(value=><option key={value} value={value}>{labelCode(value)}</option>)}</select></label>
      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">{message??"Not available until this appointment or admission is confirmed."}</p>
      <div className="mt-4 flex flex-wrap gap-2">{message&&phone&&<a className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white" href={"https://wa.me/"+phone+"?text="+encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}{message&&<button type="button" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" onClick={()=>void navigator.clipboard.writeText(message).then(()=>toast.success("Message copied")).catch(()=>toast.error("Could not copy message"))}>Copy message</button>}</div>
    </section>
    <section className="premium-panel rounded-[22px] p-4 sm:p-6"><h3 className="text-lg font-black">Print &amp; PDF centre</h3><p className="mt-1 text-sm text-slate-600">Open a print-ready school document, then print or save as PDF. Letters are based on the current saved record.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{PRINT_TYPES.map(value=><Link key={value} href={"/admissions/print/"+encodeURIComponent(student.id)+"?kind="+value} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm font-bold text-indigo-700">{labelCode(value==="fees"?"fee_quotation":value==="confirmation"?"admission_confirmation":value==="entrance"?"entrance_slip":value==="interview"?"interview_letter":"enquiry_acknowledgement")}</Link>)}</div></section>
  </div>;
}
