"use client";
import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import AccessNotice from "@/components/ui/AccessNotice";
import AdminOperations from "@/components/admissions/AdminOperations";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";
export default function OperationsPage(){
  const {role,error:accessError}=useAccess();const {academicYears,loading,error}=useAcademicYears();const [selected,setSelected]=useState("");
  const active=academicYears.filter(y=>y.isActive),year=loading?"":selectDefaultAdmissionYear(active,selected);
  return <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0"><AppSidebar/><div className="lg:pl-72"><header className="premium-topbar sticky top-18 z-30 flex items-center justify-between px-4 py-4 lg:top-0 sm:px-8"><div><p className="premium-kicker">Administration</p><h1 className="text-xl font-black">Admission operations</h1></div><div className="hidden lg:block"><AccountMenu/></div></header><main className="mx-auto max-w-[1480px] space-y-5 p-3 sm:p-6 xl:p-10"><AccessNotice role={role} error={accessError}/>{role==="staff"&&<p className="premium-panel rounded-xl p-4">Administrator access required.</p>}{role==="admin"&&<><section className="premium-hero rounded-[26px] p-5"><h2 className="text-2xl font-black">Waiting list &amp; analytics</h2><p className="mt-2 text-sm text-slate-600">Review class availability, enquiry conversion and team activity.</p><label className="mt-4 block text-sm font-bold">Academic year<select className="mt-1 block rounded-xl border border-slate-200 bg-white p-3" value={year} disabled={loading||!active.length} onChange={event=>setSelected(event.target.value)}>{!year&&<option value="">Choose year</option>}{active.map(item=><option key={item.id} value={item.academicYear}>{item.academicYear}</option>)}</select></label></section>{error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{year&&<AdminOperations key={year} year={year}/>}</>}</main></div></div>;
}
