"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Sparkles, Users } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";
import AdmissionsTable from "@/components/admissions/AdmissionsTable";
import KPISection from "@/components/admissions/KPISection";
import NewAdmissionModal from "@/components/admissions/NewAdmissionModal";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { useAdmissions } from "@/hooks/useAdmissions";
import type { Admission } from "@/src/generated/prisma/client";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAccess } from "@/hooks/useAccess";
import AccessNotice from "@/components/ui/AccessNotice";

export default function AdmissionsPage() {
  const { canManage, canManageAdmissions, role, error: accessError } = useAccess();
  const { academicYears: createdAcademicYears, loading: yearsLoading, error: yearsError } = useAcademicYears();
  const activeAcademicYears = useMemo(() => createdAcademicYears.filter((year) => year.isActive).map((year) => year.academicYear), [createdAcademicYears]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const academicYear = activeAcademicYears.includes(selectedAcademicYear) ? selectedAcademicYear : activeAcademicYears[0] ?? "";
  const { students, loading, error, reload } = useAdmissions(academicYear);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [finalStatusFilter, setFinalStatusFilter] = useState("ALL");
  const [applicationFilter, setApplicationFilter] = useState("ALL");
  const [openNew, setOpenNew] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Admission | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student: Admission) => {
      const matchesSearch = !query || [student.student, student.parent, student.mobile, student.enquiryNo, student.admClass]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesSearch
        && (classFilter === "ALL" || student.admClass === classFilter)
        && (finalStatusFilter === "ALL" || student.finalAdmission === finalStatusFilter)
        && (applicationFilter === "ALL" || student.application === applicationFilter);
    });
  }, [applicationFilter, classFilter, finalStatusFilter, search, students]);

  const classOptions = useMemo(() => [...new Set(students.map((student) => student.admClass).filter(Boolean))].sort(), [students]);

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
              <div className="w-36"><SchoolDbSelect ariaLabel="Academic year" value={academicYear || undefined} onValueChange={setSelectedAcademicYear} options={activeAcademicYears.map((year) => ({ label: year, value: year }))} placeholder={yearsLoading ? "Loading…" : "No active years"} disabled={yearsLoading || activeAcademicYears.length === 0} className="font-bold" /></div>
              {canManageAdmissions && <button onClick={() => setOpenNew(true)} disabled={!academicYear} className="premium-button h-11 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"><Plus className="size-4" /><span className="hidden sm:inline">New enquiry</span><span className="sm:hidden">New</span></button>}
              <div className="hidden border-l border-slate-200 pl-3 lg:block"><AccountMenu /></div>}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <AccessNotice role={role} error={accessError} />
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <p className="premium-kicker flex items-center gap-2"><Sparkles className="size-4" />{academicYear ? `${academicYear.replace("-", "–")} admission desk` : "Create an active academic year"}</p>
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
          {(error || yearsError) && <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-semibold text-red-700 shadow-sm">{yearsError || error}</div>}
          <AdmissionsTable canManageAdmissions={canManageAdmissions} students={filteredStudents} totalCount={students.length} loading={loading} search={search} setSearch={setSearch} classFilter={classFilter} setClassFilter={setClassFilter} classOptions={classOptions} finalStatusFilter={finalStatusFilter} setFinalStatusFilter={setFinalStatusFilter} applicationFilter={applicationFilter} setApplicationFilter={setApplicationFilter} onView={(student) => { setSelectedStudent(student); setOpenDetail(true); }} reload={reload} />
        </main>
      </div>

      <AdmissionDetailModal student={selectedStudent} open={openDetail} onClose={() => setOpenDetail(false)} />
      {canManageAdmissions && <NewAdmissionModal open={openNew} onClose={() => setOpenNew(false)} reload={reload} academicYear={academicYear} canManageFees={canManage} />}
    </div>
  );
}
