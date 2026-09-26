"use client";
import { useMemo,useState } from "react";
import { CircleDollarSign, Plus } from "lucide-react";
import type { FeeRecord } from "@/src/generated/prisma/client";
import AppSidebar from "@/components/AppSidebar";
import { useFees } from "@/hooks/useFees";
import FeesKPISection from "@/components/fees/FeesKPISection";
import FeesTable from "@/components/fees/FeesTable";
import FeeDetailModal from "@/components/fees/FeeDetailModal";
import NewFeeModal from "@/components/fees/NewFeeModal";
export default function FeesPage(){
 const {fees,loading,error,reload}=useFees(); const [search,setSearch]=useState(""); const [openNew,setOpenNew]=useState(false); const [selectedFee,setSelectedFee]=useState<FeeRecord|null>(null); const [open,setOpen]=useState(false);
 const filteredFees=useMemo(()=>{const q=search.trim().toLowerCase();return q?fees.filter(f=>[f.className,f.academicYear,f.term,f.age].some(v=>String(v??"").toLowerCase().includes(q))):fees},[fees,search]);
 return <div className="min-h-screen bg-[#f6f8fc] text-slate-950"><AppSidebar/><div className="lg:pl-72">
  <header className="border-b border-slate-200 bg-white"><div className="flex min-h-20 items-center justify-between px-4 sm:px-6 xl:px-10"><div><p className="text-sm font-semibold text-emerald-700">Admissions configuration</p><h1 className="text-2xl font-bold">Fee Structure</h1></div><button onClick={()=>setOpenNew(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#091540] px-5 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4"/>Add fee</button></div></header>
  <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
   <section className="rounded-[32px] bg-[#091540] p-7 text-white shadow-xl shadow-slate-200"><div className="flex items-center gap-4"><div className="rounded-2xl bg-white/10 p-4"><CircleDollarSign/></div><div><p className="text-sm text-blue-200">Academic fee master</p><h2 className="mt-1 text-3xl font-bold">Keep admission fee structures clear and consistent.</h2></div></div></section>
   {error&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<FeesKPISection fees={fees}/><FeesTable fees={filteredFees} loading={loading} search={search} setSearch={setSearch} onView={fee=>{setSelectedFee(fee);setOpen(true)}} reload={reload}/>
  </main></div><FeeDetailModal fee={selectedFee} open={open} onClose={()=>setOpen(false)}/><NewFeeModal open={openNew} onClose={()=>setOpenNew(false)} reload={reload}/></div>
}
