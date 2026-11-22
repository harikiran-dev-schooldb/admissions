"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { useAdmissions } from "@/hooks/useAdmissions";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";

const AdmissionsAnalytics = dynamic(() => import("@/components/admissions/AdmissionsAnalytics"), { ssr: false });
export default function AdmissionsAnalyticsPageClient() {
  const { academicYears: createdAcademicYears, loading: yearsLoading, error: yearsError } = useAcademicYears();

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const academicYear = selectDefaultAdmissionYear(createdAcademicYears, selectedAcademicYear);
  const { students, loading, error } = useAdmissions(academicYear);
  const [classFilter, setClassFilter] = useState("ALL");
  const [finalStatusFilter, setFinalStatusFilter] = useState("ALL");
  const classOptions = useMemo(() => [...new Set(students.map((student) => student.admClass).filter(Boolean))].sort(), [students]);
  const filteredStudents = useMemo(() => students.filter((student) =>
    (classFilter === "ALL" || student.admClass === classFilter)
    && (finalStatusFilter === "ALL" || student.finalAdmission === finalStatusFilter),
  ), [classFilter, finalStatusFilter, students]);

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
            <div><p className="premium-kicker">Admissions intelligence</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Analytics</h1></div>
            <div className="flex items-center gap-3"><div className="w-36"><SchoolDbSelect ariaLabel="Academic year" value={academicYear || undefined} onValueChange={setSelectedAcademicYear} options={createdAcademicYears.map((year) => ({ label: year.academicYear, value: year.academicYear }))} placeholder={yearsLoading ? "Loading…" : "No academic years"} disabled={yearsLoading || createdAcademicYears.length === 0} className="font-bold" /></div><div className="hidden border-l border-slate-200 pl-3 lg:block"><AccountMenu /></div></div>
          </div>
        </header>
        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex items-center gap-5"><div className="hero-stat grid size-14 shrink-0 place-items-center rounded-2xl text-indigo-600"><BarChart3 className="size-6" /></div><div><p className="premium-kicker flex items-center gap-2"><Sparkles className="size-3.5" />{academicYear ? `${academicYear.replace("-", "–")} performance` : "Create an active academic year"}</p><h2 className="mt-2 max-w-4xl text-2xl font-black tracking-[-0.04em] sm:text-3xl">See where enquiries convert and where they need attention.</h2></div></div>
          </section>
          <section className="premium-panel flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-black text-slate-900">Filter analytics</p><p className="mt-1 text-xs font-medium text-slate-500">Charts update to match the selected cohort.</p></div>
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
              <div className="sm:w-48"><SchoolDbSelect ariaLabel="Analytics class filter" value={classFilter} onValueChange={setClassFilter} options={[{ label: "All classes", value: "ALL" }, ...classOptions.map((value) => ({ label: value, value }))]} /></div>
              <div className="sm:w-52"><SchoolDbSelect ariaLabel="Analytics admission status filter" value={finalStatusFilter} onValueChange={setFinalStatusFilter} options={[{ label: "All admission status", value: "ALL" }, { label: "Pending", value: "PENDING" }, { label: "Admitted", value: "ADMITTED" }, { label: "Cancelled", value: "CANCELLED" }]} /></div>
            </div>
          </section>
          {(error || yearsError) && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{yearsError || error}</div>}
          {loading ? <div className="premium-panel grid min-h-72 place-items-center rounded-[28px] text-sm font-semibold text-slate-500">Loading admission analytics…</div> : <AdmissionsAnalytics students={filteredStudents} />}
        </main>
      </div>
    </div>
  );
}
