"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Sparkles, Users } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";
import AdmissionsTable from "@/components/admissions/AdmissionsTable";
import KPISection from "@/components/admissions/KPISection";
import NewAdmissionModal from "@/components/admissions/NewAdmissionModal";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { useAdmissions } from "@/hooks/useAdmissions";
import type { Admission } from "@/src/generated/prisma/client";

const academicYears = ["2026-27", "2025-26"] as const;

export default function AdmissionsPage() {
  const [academicYear, setAcademicYear] = useState<string>("2026-27");
  const { students, loading, error, reload } = useAdmissions(academicYear);
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Admission | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student: Admission) =>
      [student.student, student.parent, student.mobile, student.enquiryNo, student.admClass]
        .some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [students, search]);

  const admitted = students.filter((student: Admission) => student.finalAdmission === "ADMITTED").length;

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
            <div>
              <p className="premium-kicker">Admissions workspace</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">Admission pipeline</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-32"><SchoolDbSelect ariaLabel="Academic year" value={academicYear} onValueChange={setAcademicYear} options={academicYears.map((year) => ({ label: year, value: year }))} className="font-bold" /></div>
              <button onClick={() => setOpenNew(true)} className="premium-button h-11 px-4 text-sm font-bold sm:px-5"><Plus className="size-4" /><span className="hidden sm:inline">New enquiry</span><span className="sm:hidden">New</span></button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="premium-kicker flex items-center gap-2"><Sparkles className="size-4" />{academicYear.replace("-", "–")} admission desk</p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Every prospective student, clearly in view.</h2>
                <p className="mt-3 max-w-xl text-base leading-7">Move enquiries through application, entrance, interview and confirmation while keeping every parent conversation connected.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-80">
                <div className="hero-stat rounded-2xl p-4"><Users className="size-4 text-indigo-600" /><strong className="mt-3 block text-3xl font-black">{students.length}</strong><p className="mt-1 text-sm font-semibold">Total enquiries</p></div>
                <div className="hero-stat rounded-2xl p-4"><CheckCircle2 className="size-4 text-emerald-300" /><strong className="mt-3 block text-3xl font-black">{admitted}</strong><p className="mt-1 text-sm font-semibold">Admitted</p></div>
              </div>
            </div>
          </section>

          <KPISection students={students} />
          {error && <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-semibold text-red-700 shadow-sm">{error}</div>}
          <AdmissionsTable students={filteredStudents} loading={loading} search={search} setSearch={setSearch} onView={(student) => { setSelectedStudent(student); setOpenDetail(true); }} reload={reload} />
        </main>
      </div>

      <AdmissionDetailModal student={selectedStudent} open={openDetail} onClose={() => setOpenDetail(false)} />
      <NewAdmissionModal open={openNew} onClose={() => setOpenNew(false)} reload={reload} academicYear={academicYear} />
    </div>
  );
}
