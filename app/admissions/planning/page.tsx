"use client";
import { useEffect, useState } from "react";
import { LayoutGrid, Save, Download } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import AccessNotice from "@/components/ui/AccessNotice";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";
import { SCHOOL_CLASSES, seatBalance, type SchoolClass, type SeatCapacity, type YearPolicy } from "@/lib/admissions/yearPolicy";
import { ADMISSION_SETTINGS_EVENT } from "@/lib/admissionSettings";

type Row = { className: SchoolClass; admitted: number; pending: number };
type Payload = { policy: YearPolicy; capacity: SeatCapacity; seats: Row[] };
type Draft = { cutoff: string; rows: Record<string,{ min:string;max:string;capacity:string }> };
const field = "w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-indigo-400";
function toDraft(data: Payload): Draft {
  return { cutoff:data.policy.ageAsOfDate, rows:Object.fromEntries(SCHOOL_CLASSES.map(name => [name,{ min:String(data.policy.rules[name]?.minMonths ?? ""), max:String(data.policy.rules[name]?.maxMonths ?? ""), capacity:String(data.capacity[name] ?? "") }])) };
}
function PlanningEditor({ year }: { year:string }) {
  const [data,setData] = useState<Payload|null>(null);
  const [draft,setDraft] = useState<Draft|null>(null);
  const [error,setError] = useState("");
  const [saved,setSaved] = useState(false);
  const [saving,setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admissions/year-policy?academicYear="+encodeURIComponent(year), {cache:"no-store",signal:controller.signal})
      .then(async response => {const body = await response.json(); if (!response.ok || !body.data?.seats) throw new Error(body.error || "Administrator access required"); return body.data as Payload;})
      .then(value => {if (!controller.signal.aborted){setData(value);setDraft(toDraft(value));}})
      .catch((caught:unknown) => {if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load class planning");});
    return () => controller.abort();
  },[year]);
  function change(name:SchoolClass,key:"min"|"max"|"capacity",value:string) {
    setSaved(false);
    setDraft(prev => prev ? {...prev, rows:{...prev.rows,[name]:{...prev.rows[name],[key]:value}}} : null);
  }
  async function save() {
    if (!draft || !data || saving) return;
    setError("");setSaved(false);
    const policy:YearPolicy = {ageAsOfDate:draft.cutoff,rules:{}};
    const capacity:SeatCapacity = {};
    for (const name of SCHOOL_CLASSES) {
      const row = draft.rows[name];
      if (row.min !== "" || row.max !== "") {
        if (!/^\d+$/.test(row.min) || !/^\d+$/.test(row.max) || Number(row.min)>Number(row.max) || Number(row.max)>240) {setError(name+": enter both minimum and maximum completed months (0–240).");return;}
        policy.rules[name]={minMonths:Number(row.min),maxMonths:Number(row.max)};
      }
      if (row.capacity !== "") {
        if (!/^\d+$/.test(row.capacity) || Number(row.capacity)>100000) {setError(name+": enter a whole-number capacity.");return;}
        capacity[name]=Number(row.capacity);
      }
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admissions/year-policy",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({academicYear:year,policy,capacity})});
      const body=await response.json();if(!response.ok)throw new Error(body.error || "Unable to save");
      setData({...data,policy,capacity});setSaved(true);
      window.dispatchEvent(new Event(ADMISSION_SETTINGS_EVENT));
    } catch(caught) {setError(caught instanceof Error ? caught.message : "Unable to save");}
    finally {setSaving(false);}
  }
  function download() {
    if (!data) return;
    const lines = [["Academic year","Class","Saved capacity","Admitted","Pending","Seat balance"],...data.seats.map(row=>[year,row.className,data.capacity[row.className] ?? "",row.admitted,row.pending,seatBalance(data.capacity[row.className],row.admitted) ?? ""])];
    const url=URL.createObjectURL(new Blob([lines.map(line=>line.join(",")).join("\r\n")],{type:"text/csv;charset=utf-8;"}));
    const anchor=document.createElement("a");anchor.href=url;anchor.download="admission-seat-plan-"+year+".csv";document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="premium-panel rounded-[26px] p-4 sm:p-6">
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
    {saved && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">Year-specific rules and capacities saved.</p>}
    {!draft && !error && <p role="status" className="animate-pulse text-sm text-slate-500">Loading class planning…</p>}
    {draft && data && <>
      <div className="flex flex-wrap items-end justify-between gap-3"><label className="text-sm font-bold text-slate-700">Age cutoff date<input type="date" className="mt-1 block rounded-xl border border-slate-200 bg-white p-3" value={draft.cutoff} disabled={saving} onChange={event=>{setSaved(false);setDraft({...draft,cutoff:event.target.value});}}/></label>
      <div className="flex flex-wrap gap-2"><button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" onClick={download}><Download className="mr-1 inline size-4"/> Export saved report</button><button type="button" className="premium-button px-4 py-3 text-sm font-bold disabled:opacity-50" disabled={saving || !draft.cutoff} onClick={()=>void save()}><Save className="size-4"/>{saving?"Saving…":"Save rules"}</button></div></div>
      <p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm leading-6 text-indigo-800">Age bounds are inclusive completed months. Leave both age cells blank to retain the existing class mapping. Blank capacity means not configured. No new limits are assumed. Saving affects future eligibility calculations only; seat capacities are planning targets, not enforced admission limits.</p>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[710px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs font-bold text-slate-500"><th className="p-3">Class</th><th className="p-3">Min months</th><th className="p-3">Max months</th><th className="p-3">Capacity</th><th className="p-3">Admitted</th><th className="p-3">Pending</th><th className="p-3">Balance (saved)</th></tr></thead><tbody>{data.seats.map(row=>{const name=row.className;const balance=seatBalance(data.capacity[name],row.admitted);return <tr key={name} className="border-b border-slate-100"><th scope="row" className="p-3 text-slate-900">{name}</th>{(["min","max","capacity"] as const).map(key=><td key={key} className="p-3"><input type="number" min="0" max={key==="capacity"?100000:240} step="1" aria-label={name+" "+key} className={field} value={draft.rows[name][key]} disabled={saving} onChange={event=>change(name,key,event.target.value)} placeholder="—"/></td>)}<td className="p-3 font-bold tabular-nums">{row.admitted}</td><td className="p-3 tabular-nums">{row.pending}</td><td className={"p-3 font-bold tabular-nums "+(balance!==null&&balance<0?"text-rose-700":"text-slate-800")}>{balance??"—"}</td></tr>})}</tbody></table></div>
    </>}
  </section>;
}
export default function PlanningPage(){
  const {role,error:accessError}=useAccess();
  const {academicYears,loading,error}=useAcademicYears();
  const [selected,setSelected]=useState("");
  const active=academicYears.filter(year=>year.isActive);
  const year=loading?"":selectDefaultAdmissionYear(active,selected);
  return <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0"><AppSidebar/><div className="lg:pl-72">
    <header className="premium-topbar sticky top-18 z-30 flex items-center justify-between gap-3 px-4 py-4 lg:top-0 sm:px-8"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><LayoutGrid className="size-5"/></span><div><p className="premium-kicker">Administration</p><h1 className="text-xl font-black">Seat &amp; age rules</h1></div></div><div className="hidden lg:block"><AccountMenu/></div></header>
    <main className="mx-auto max-w-[1480px] space-y-5 p-3 sm:p-6 xl:p-10"><AccessNotice role={role} error={accessError}/>{role==="staff"&&<p className="premium-panel rounded-2xl p-4 text-sm font-bold">Administrator access required.</p>}{role==="admin"&&<>
      <section className="premium-hero rounded-[26px] p-5"><h2 className="text-2xl font-black">Plan by academic year</h2><p className="mt-2 text-sm text-slate-600">Set approved admission criteria and class capacity without altering existing records.</p><label className="mt-4 block text-sm font-bold">Academic year<select value={year} disabled={loading||!active.length} onChange={event=>setSelected(event.target.value)} className="mt-1 block rounded-xl border border-slate-200 bg-white p-3">{!year&&<option value="">Select year</option>}{active.map(item=><option key={item.id} value={item.academicYear}>{item.academicYear}</option>)}</select></label></section>
      {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{year&&<PlanningEditor key={year} year={year}/>}
    </>}</main></div></div>;
}
