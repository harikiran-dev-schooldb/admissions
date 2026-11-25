"use client";
import { useEffect,useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import type { Admission } from "@/src/generated/prisma/client";
import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";
import { labelCode } from "@/lib/admissions/casePolicy";
type Counts={total:number;admitted:number;pending:number;cancelled:number;rate:number};
type Report={classes:{className:string;admitted:number;pending:number;capacity:number|null}[];queue:{waitlistedAt:string;position:number;available:boolean;admission:{id:string;enquiryNo:string;student:string;admClass:string}}[];waitingTotal:number;sources:({source:string}&Counts)[];reasons:{reason:string;count:number}[];comparison:({academicYear:string}&Counts)[];staff:{name:string;created:number;stageUpdates:number}[]};
const panel="premium-panel rounded-[24px] p-4 sm:p-6";
function MetricsTable({title,columns,rows}:{title:string;columns:string[];rows:(string|number)[][]}){
  return <section className={panel}><h3 className="text-lg font-black">{title}</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[360px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500">{columns.map(label=><th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i} className="border-b border-slate-100">{row.map((value,j)=><td key={j} className="p-2 tabular-nums">{value}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="py-3 text-sm text-slate-500">No recorded activity.</p>}</div></section>;
}
export default function AdminOperations({year}:{year:string}){
  const [data,setData]=useState<Report|null>(null),[error,setError]=useState(""),[revision,setRevision]=useState(0);
  const [student,setStudent]=useState<Admission|null>(null);
  useEffect(()=>{const controller=new AbortController();fetch("/api/admissions/operations?academicYear="+encodeURIComponent(year),{cache:"no-store",signal:controller.signal}).then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.error||"Unable to load operations");return body.data as Report;}).then(value=>{if(!controller.signal.aborted){setData(value);setError("");}}).catch((caught:unknown)=>{if(!controller.signal.aborted)setError(caught instanceof Error?caught.message:"Unable to load report");});return()=>controller.abort();},[year,revision]);
  async function open(id:string){try{const response=await fetch("/api/admissions/"+encodeURIComponent(id),{cache:"no-store"});const body=await response.json();if(!response.ok)throw Error(body.error||"Unable to open record");setStudent(body.data);}catch(caught){toast.error(caught instanceof Error?caught.message:"Unable to open record");}}
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-2"><button className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700" onClick={()=>setRevision(v=>v+1)}>Refresh report</button><Link href="/admissions/planning" className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700">Manage seat targets</Link></div>
    {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!data&&!error&&<p role="status" className="text-sm text-slate-500">Loading operational report…</p>}
    {data&&<>
      <section className={panel}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black">Waiting list</h3><span className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">{data.waitingTotal} pending</span></div><p className="mt-2 text-sm text-slate-600">Positions are first-in, first-out within each class. Open a student&apos;s Documents tab to change waiting-list membership. Capacity is a planning target, not a reservation.</p>
        <div className="mt-4 space-y-2">{data.queue.map(row=><button type="button" key={row.admission.id} onClick={()=>void open(row.admission.id)} className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-indigo-300"><span className="grid size-9 place-items-center rounded-xl bg-indigo-50 font-black text-indigo-700">#{row.position}</span><span className="flex-1"><strong className="block text-sm">{row.admission.student}</strong><span className="text-xs text-slate-500">{row.admission.enquiryNo} · {row.admission.admClass}</span></span>{row.available&&<span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Seat available</span>}</button>)}</div>{!data.queue.length&&<p className="mt-3 text-sm text-slate-500">No students on the waiting list.</p>}{data.waitingTotal>data.queue.length&&<p className="mt-3 text-xs text-amber-800">Showing the first 200 entries.</p>}
      </section>
      <MetricsTable title="Class capacity" columns={["Class","Target","Admitted","Pending","Balance"]} rows={data.classes.map(row=>[row.className,row.capacity??"Not set",row.admitted,row.pending,row.capacity===null?"—":row.capacity-row.admitted])}/>
      <MetricsTable title="Conversion by enquiry source" columns={["Source","Enquiries","Admitted","Conversion"]} rows={data.sources.map(row=>[labelCode(row.source),row.total,row.admitted,row.rate+"%"])}/>
      <MetricsTable title="Cancellation reasons" columns={["Reason","Count"]} rows={data.reasons.map(row=>[labelCode(row.reason),row.count])}/>
      <MetricsTable title="Active academic-year comparison" columns={["Year","Enquiries","Admitted","Pending","Conversion"]} rows={data.comparison.map(row=>[row.academicYear,row.total,row.admitted,row.pending,row.rate+"%"])}/>
      <MetricsTable title="Recorded staff activity (not performance rankings)" columns={["Staff","Enquiries created","Stage updates"]} rows={data.staff.map(row=>[row.name,row.created,row.stageUpdates])}/>
      <p className="text-xs leading-5 text-slate-500">Imported records without a recorded source appear as unspecified. Activity counts are based on existing audit logs for live enquiries; they do not measure staff quality or historic work without logs.</p>
    </>}
    <AdmissionDetailModal key={student?.id??"none"} student={student} open={Boolean(student)} onClose={()=>{setStudent(null);setRevision(v=>v+1);}}/>
  </div>;
}
