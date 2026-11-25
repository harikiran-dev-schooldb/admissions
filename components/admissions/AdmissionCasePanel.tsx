"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Admission } from "@/src/generated/prisma/client";
import { useAccess } from "@/hooks/useAccess";
import { DOCUMENT_KINDS, DOCUMENT_STATUSES, ENQUIRY_SOURCES, CANCELLATION_REASONS, labelCode, documentComplete } from "@/lib/admissions/casePolicy";
type DocumentRow={kind:string;status:string;verifiedAt:string|null;verifiedByName:string|null};
type Details={source:string;cancellationReason:string|null;waitlistedAt:string|null};
type Data={documents:DocumentRow[];caseDetails:Details|null;seat:{capacity:number|null;admitted:number}|null};
const input="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold";
const time=(value:string)=>new Date(value).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
export default function AdmissionCasePanel({student}:{student:Admission}){
  const {role}=useAccess();
  const [data,setData]=useState<Data|null>(null);
  const [error,setError]=useState("");
  const [revision,setRevision]=useState(0);
  const [saving,setSaving]=useState(false);
  const [draft,setDraft]=useState<Details|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    fetch("/api/admissions/"+encodeURIComponent(student.id)+"/case",{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.error||"Unable to load checks");return body.data as Data;}).then(value=>{if(!controller.signal.aborted){setData(value);setDraft(value.caseDetails??{source:"UNSPECIFIED",cancellationReason:null,waitlistedAt:null});setError("");}}).catch((caught:unknown)=>{if(!controller.signal.aborted)setError(caught instanceof Error?caught.message:"Unable to load checks");});
    return ()=>controller.abort();
  },[student.id,revision]);
  async function save(body:object){
    if(saving)return;setSaving(true);
    try{const response=await fetch("/api/admissions/"+encodeURIComponent(student.id)+"/case",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw Error(result.error||"Unable to save");toast.success("Verification details saved");setRevision(v=>v+1);}catch(caught){toast.error(caught instanceof Error?caught.message:"Unable to save");}finally{setSaving(false);}
  }
  const complete=DOCUMENT_KINDS.filter(kind=>documentComplete(data?.documents.find(doc=>doc.kind===kind.value)?.status??"PENDING")).length;
  return <div className="space-y-4">
    <section className="premium-panel rounded-[22px] p-4 sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-black">Document verification</h3>{data&&<span className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">{complete}/{DOCUMENT_KINDS.length} resolved</span>}</div>
      <p className="mt-2 text-sm text-slate-600">Check physical documents according to school policy. Store only verification status, never identity numbers or document images. Not all documents are required for every child.</p>
      {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error} <button type="button" className="font-bold underline" onClick={()=>setRevision(v=>v+1)}>Retry</button></p>}
      {!data&&!error&&<p role="status" className="mt-4 text-sm text-slate-500">Loading checklist…</p>}
      {data&&<div className="mt-4 space-y-3">{DOCUMENT_KINDS.map(kind=>{const doc=data.documents.find(item=>item.kind===kind.value);return <div key={kind.value} className="grid items-center gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1fr_180px]"><div><p className="text-sm font-bold">{kind.label}</p>{doc?.verifiedAt&&<p className="mt-1 text-xs text-slate-500">Verified {time(doc.verifiedAt)} · {doc.verifiedByName??"Staff"}</p>}</div><select aria-label={kind.label} className={input} value={doc?.status??"PENDING"} disabled={saving||!(role==="admin"||role==="staff")} onChange={event=>void save({type:"document",kind:kind.value,status:event.target.value})}>{DOCUMENT_STATUSES.map(status=><option key={status} value={status}>{labelCode(status)}</option>)}</select></div>})}</div>}
    </section>
    {data&&draft&&<section className="premium-panel rounded-[22px] p-4 sm:p-6"><h3 className="text-lg font-black">Enquiry tracking &amp; waiting list</h3><p className="mt-2 text-sm text-slate-600">Waiting-list membership is explicit and does not change admission stages or reserve a seat.</p>
      {data.seat&&<p className="mt-3 rounded-xl bg-indigo-50 p-3 text-sm font-bold text-indigo-800">{data.seat.capacity===null?"Capacity not configured":data.seat.admitted>=data.seat.capacity?"Class at or over capacity":(data.seat.capacity-data.seat.admitted)+" seats available"} · {data.seat.admitted} admitted</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Enquiry source<select className={input+" mt-1"} disabled={saving||role!=="admin"} value={draft.source} onChange={event=>setDraft({...draft,source:event.target.value})}>{ENQUIRY_SOURCES.map(source=><option key={source} value={source}>{labelCode(source)}</option>)}</select></label>
      {student.finalAdmission==="CANCELLED"&&<label className="text-sm font-bold">Cancellation reason<select className={input+" mt-1"} disabled={saving||role!=="admin"} value={draft.cancellationReason??""} onChange={event=>setDraft({...draft,cancellationReason:event.target.value||null})}><option value="">Not recorded</option>{CANCELLATION_REASONS.map(reason=><option key={reason} value={reason}>{labelCode(reason)}</option>)}</select></label>}</div>
      {student.finalAdmission==="PENDING"&&<label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" disabled={saving||role!=="admin"} checked={Boolean(draft.waitlistedAt)} onChange={event=>setDraft({...draft,waitlistedAt:event.target.checked?(draft.waitlistedAt??new Date().toISOString()):null})}/> Add to waiting list</label>}
      {data.caseDetails?.waitlistedAt&&student.finalAdmission==="PENDING"&&<p className="mt-2 text-xs text-slate-500">Queued since {time(data.caseDetails.waitlistedAt)}</p>}
      {role==="admin"&&<button type="button" className="premium-button mt-4 px-4 py-3 text-sm font-bold disabled:opacity-50" disabled={saving} onClick={()=>void save({type:"case",source:draft.source,cancellationReason:student.finalAdmission==="CANCELLED"?draft.cancellationReason:null,waitlisted:student.finalAdmission==="PENDING"&&Boolean(draft.waitlistedAt)})}>Save tracking details</button>}
    </section>}
  </div>;
}
