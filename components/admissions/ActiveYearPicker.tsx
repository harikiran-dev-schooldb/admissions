"use client";
import { useState,type ReactNode } from "react";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
export default function ActiveYearPicker({children}:{children:(year:string)=>ReactNode}){
  const {academicYears,loading,error}=useAcademicYears();const [selected,setSelected]=useState("");
  const active=academicYears.filter(y=>y.isActive),year=loading?"":selectDefaultAdmissionYear(active,selected);
  return <><section className="premium-panel rounded-2xl p-4 print:hidden"><div className="max-w-xs"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Academic year</p><SchoolDbSelect ariaLabel="Academic year" value={year} disabled={loading||!active.length} onValueChange={setSelected} options={active.map(y=>({value:y.academicYear,label:y.academicYear}))} placeholder="Choose year"/></div>{error&&<p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}</section>{year?children(year):!loading&&!error?<p className="text-sm text-slate-500">Activate an academic year first.</p>:null}</>;
}
