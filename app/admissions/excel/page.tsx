"use client";
import { useState } from "react";
import { toast } from "sonner";
import AdminCentreShell from "@/components/admissions/AdminCentreShell";
import ActiveYearPicker from "@/components/admissions/ActiveYearPicker";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { SCHOOL_CLASSES } from "@/lib/admissions/yearPolicy";
import type { ImportInput } from "@/lib/admissions/importCsv";
type Preview={line:number;input:ImportInput&{academicYear:string};errors:string[];age:string;eligibleClass:string};
type Result={status:"saved"|"failed";message:string};
const panel="premium-panel rounded-[24px] p-4 sm:p-6",button="rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-700 disabled:opacity-40";
function ExcelCentre({year}:{year:string}){
  const [file,setFile]=useState<File|null>(null),[rows,setRows]=useState<Preview[]>([]),[results,setResults]=useState<Record<number,Result>>({}),[error,setError]=useState(""),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState(false),[className,setClassName]=useState("ALL"),[status,setStatus]=useState("ALL");
  const ready=rows.filter(row=>!row.errors.length&&!results[row.line]);
  async function preview(){
    if(!file||busy)return;setBusy(true);setRows([]);setResults({});setError("");
    try{if(file.size>300000)throw Error("Select a UTF-8 CSV file under 300 KB.");const response=await fetch("/api/admissions/import-preview?academicYear="+encodeURIComponent(year),{method:"POST",headers:{"Content-Type":"text/csv; charset=utf-8"},body:await file.text()});const data=await response.json();if(!response.ok)throw Error(data.error||"Preview failed");setRows(data.data);}catch(caught){setError(caught instanceof Error?caught.message:"Preview failed");}finally{setBusy(false);}
  }
  async function importReady(){
    if(busy||!ready.length)return;setConfirm(false);setBusy(true);setError("");
    let saved=0;
    try{for(const row of ready){try{
      const response=await fetch("/api/admissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(row.input)});
      const body=await response.json();
      if(!response.ok){const details=Object.values(body.issues??{}).flat().join("; ");throw Error(details||body.error||"Save failed");}
      saved++;setResults(old=>({...old,[row.line]:{status:"saved",message:body.data.enquiryNo}}));
    }catch(caught){setResults(old=>({...old,[row.line]:{status:"failed",message:caught instanceof Error?caught.message:"Save status unknown; verify before retrying"}}));}}
    toast.success(saved+" enquiries saved",{description:"Review the result of every row. Existing enquiries were not overwritten."});}
    finally{setBusy(false);}
  }
  async function download(){
    try{const response=await fetch("/api/admissions/export?"+new URLSearchParams({academicYear:year,class:className,status}),{cache:"no-store"});if(!response.ok){const body=await response.json();throw Error(body.error||"Export failed");}const url=URL.createObjectURL(await response.blob());const a=document.createElement("a");a.href=url;a.download="Admissions-"+year+".xlsx";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(caught){toast.error(caught instanceof Error?caught.message:"Export failed");}
  }
  return <div className="space-y-5">
    <section className={panel}><h2 className="text-xl font-black">Import new enquiries</h2><p className="mt-2 text-sm text-slate-600">Download the template, fill it in Excel or Google Sheets, and save as UTF-8 CSV. Use YYYY-MM-DD dates and 10-digit mobile numbers. Maximum 100 rows per batch. Preview is read-only; only valid rows are imported after confirmation. Each enquiry uses the standard workflow and duplicate checks.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3"><a className={button} href={"data:text/csv;charset=utf-8,"+encodeURIComponent("student,parent,mobile,dob,admClass,source\r\n")} download="admission-import-template.csv">Download CSV template</a><input type="file" accept=".csv,text/csv" disabled={busy} aria-label="Select enquiry CSV" onChange={event=>{setFile(event.target.files?.[0]??null);setRows([]);setResults({});setError("");}} className="max-w-full text-sm"/><button type="button" className={button} disabled={!file||busy} onClick={()=>void preview()}>{busy?"Working…":"Validate & preview"}</button></div>
      {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {rows.length>0&&<><p className="mt-4 text-sm font-bold">{rows.length} rows · {ready.length} ready · {Object.values(results).filter(r=>r.status==="saved").length} saved</p><div className="mt-3 max-h-[65vh] overflow-auto"><table className="min-w-[680px] w-full text-left text-sm"><thead className="sticky top-0 bg-white"><tr>{["Row","Student","Class","Age","Eligibility","Result"].map(name=><th key={name} className="border-b p-2 text-xs text-slate-500">{name}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.line} className="border-b border-slate-100"><td className="p-2">{row.line}</td><td className="p-2 font-semibold">{row.input.student}</td><td className="p-2">{row.input.admClass}</td><td className="p-2">{row.age}</td><td className="p-2">{row.eligibleClass}</td><td className={"p-2 "+(row.errors.length||results[row.line]?.status==="failed"?"text-rose-700":"text-emerald-700")}>{row.errors.join("; ")||results[row.line]?.message||"Ready"}</td></tr>)}</tbody></table></div><button type="button" disabled={busy||!ready.length} className="mt-4 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40" onClick={()=>setConfirm(true)}>Import {ready.length} valid rows</button><p className="mt-2 text-xs text-slate-500">Ineligible students are flagged, not automatically rejected. Failed rows can be corrected in the CSV and previewed again. Import saves rows individually, not as one all-or-nothing transaction.</p></>}
    </section>
    <section className={panel}><h2 className="text-xl font-black">Export admissions to Excel</h2><p className="mt-2 text-sm text-slate-600">Download a native .xlsx workbook with styled headers, frozen header row and filters. Contains private student details; store securely.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><SchoolDbSelect ariaLabel="Export class" value={className} onValueChange={setClassName} options={["ALL",...SCHOOL_CLASSES].map(value=>({value,label:value==="ALL"?"All classes":value}))}/><SchoolDbSelect ariaLabel="Export status" value={status} onValueChange={setStatus} options={["ALL","PENDING","ADMITTED","CANCELLED"].map(value=>({value,label:value==="ALL"?"All statuses":value}))}/></div><button type="button" className={button+" mt-4"} onClick={()=>void download()}>Download Excel workbook</button></section>
    <ConfirmDialog open={confirm} title={"Create "+ready.length+" enquiries?"} description="Only valid preview rows will be saved. Duplicates will be checked again on the server. This operation creates individual records and follow-ups." confirmLabel="Import valid rows" tone="primary" onCancel={()=>setConfirm(false)} onConfirm={()=>void importReady()}/>
  </div>;
}
export default function ExcelPage(){return <AdminCentreShell title="Excel centre"><ActiveYearPicker>{year=><ExcelCentre key={year} year={year}/>}</ActiveYearPicker></AdminCentreShell>;}
