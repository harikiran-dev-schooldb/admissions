"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useAdmissions } from "@/hooks/useAdmissions";
const AdmissionsAnalytics=dynamic(()=>import("@/components/admissions/AdmissionsAnalytics"),{ssr:false});
export default function AdmissionsAnalyticsPage(){
 const {students,loading,error}=useAdmissions();
 return <div className="min-h-screen bg-[#f6f8fc] text-slate-950"><AppSidebar/><div className="lg:pl-72">
  <header className="border-b border-slate-200 bg-white"><div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-10"><div><p className="text-sm font-semibold text-blue-700">Admissions intelligence</p><h1 className="text-2xl font-bold tracking-tight">Analytics</h1></div><Link href="/admissions" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Pipeline</Link></div></header>
  <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
   <section className="rounded-[32px] bg-[#091540] p-7 text-white shadow-xl shadow-slate-200"><div className="flex items-center gap-4"><div className="rounded-2xl bg-white/10 p-4"><BarChart3/></div><div><p className="text-sm text-blue-200">2026–27 performance</p><h2 className="mt-1 text-3xl font-bold">Understand where enquiries convert—and where they stop.</h2></div></div></section>
   {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
   {loading?<div className="grid min-h-72 place-items-center rounded-3xl border border-slate-200 bg-white text-sm text-slate-500">Loading admission analytics…</div>:<AdmissionsAnalytics students={students}/>}
  </main></div></div>
}
