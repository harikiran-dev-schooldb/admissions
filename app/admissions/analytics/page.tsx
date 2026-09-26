"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import { useAdmissions } from "@/hooks/useAdmissions";

const AdmissionsAnalytics = dynamic(() => import("@/components/admissions/AdmissionsAnalytics"), { ssr: false });
const academicYears = ["2026-27", "2025-26"] as const;

export default function AdmissionsAnalyticsPage() {
  const [academicYear, setAcademicYear] = useState<string>("2026-27");
  const { students, loading, error } = useAdmissions(academicYear);

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="sticky top-18 z-30 border-b border-indigo-100/70 bg-white/82 backdrop-blur-2xl lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
            <div><p className="premium-kicker">Admissions intelligence</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Analytics</h1></div>
            <select aria-label="Academic year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="premium-input h-11 rounded-2xl px-4 text-sm font-bold text-slate-700 outline-none">{academicYears.map((year) => <option key={year} value={year}>{year}</option>)}</select>
          </div>
        </header>
        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-8">
            <div className="relative z-10 flex items-center gap-4"><div className="grid size-13 place-items-center rounded-2xl bg-white/80 text-indigo-600 shadow-sm ring-1 ring-indigo-100"><BarChart3 className="size-6" /></div><div><p className="premium-kicker flex items-center gap-2"><Sparkles className="size-3.5" />{academicYear.replace("-", "–")} performance</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">See where enquiries convert and where they need attention.</h2></div></div>
          </section>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
          {loading ? <div className="premium-panel grid min-h-72 place-items-center rounded-[28px] text-sm font-semibold text-slate-500">Loading admission analytics…</div> : <AdmissionsAnalytics students={students} />}
        </main>
      </div>
    </div>
  );
}
