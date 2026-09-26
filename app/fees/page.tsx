"use client";

import { useMemo, useState } from "react";
import { IndianRupee, Plus, Sparkles } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import FeeDetailModal from "@/components/fees/FeeDetailModal";
import FeesKPISection from "@/components/fees/FeesKPISection";
import FeesTable from "@/components/fees/FeesTable";
import NewFeeModal from "@/components/fees/NewFeeModal";
import { useFees } from "@/hooks/useFees";
import type { FeeRecord } from "@/src/generated/prisma/client";

export default function FeesPage() {
  const { fees, loading, error, reload } = useFees();
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [open, setOpen] = useState(false);
  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? fees.filter((fee) => [fee.className, fee.academicYear, fee.termFee, fee.annualFees, fee.age].some((value) => String(value ?? "").toLowerCase().includes(query))) : fees;
  }, [fees, search]);
  const annualTotal = fees.reduce((total, fee) => total + fee.annualFees, 0);

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="sticky top-18 z-30 border-b border-indigo-100/70 bg-white/82 backdrop-blur-2xl lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10"><div><p className="premium-kicker">Admissions configuration</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Fee structure</h1></div><button onClick={() => setOpenNew(true)} className="premium-button h-11 px-4 text-sm font-bold sm:px-5"><Plus className="size-4" /><span className="hidden sm:inline">Add fee</span><span className="sm:hidden">Add</span></button></div>
        </header>
        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-8">
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="premium-kicker flex items-center gap-2"><Sparkles className="size-3.5" />Academic fee master</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Clear fee structures for every admission class.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Keep term and annual amounts consistent, searchable and ready for the admissions team.</p></div><div className="flex items-center gap-4 rounded-2xl border border-white/90 bg-white/75 p-4 shadow-sm backdrop-blur-xl"><div className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><IndianRupee className="size-5" /></div><div><p className="text-xs font-semibold text-slate-500">Annual fee value</p><p className="mt-1 text-2xl font-black">₹{annualTotal.toLocaleString("en-IN")}</p></div></div></div>
          </section>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
          <FeesKPISection fees={fees} />
          <FeesTable fees={filteredFees} loading={loading} search={search} setSearch={setSearch} onView={(fee) => { setSelectedFee(fee); setOpen(true); }} reload={reload} />
        </main>
      </div>
      <FeeDetailModal fee={selectedFee} open={open} onClose={() => setOpen(false)} />
      <NewFeeModal open={openNew} onClose={() => setOpenNew(false)} reload={reload} />
    </div>
  );
}
