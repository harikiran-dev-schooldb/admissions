"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import FollowUpQueue from "@/components/admissions/FollowUpQueue";
import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";
import AdmissionsTable from "@/components/admissions/AdmissionsTable";
import KPISection from "@/components/admissions/KPISection";
import NewAdmissionModal from "@/components/admissions/NewAdmissionModal";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { useAdmissionClassOptions, useAdmissionsDirectory, useAdmissionsSummary } from "@/hooks/useAdmissionsDirectory";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";
import { DEFAULT_ADMISSION_PAGE_SIZE, type AdmissionPageSize } from "@/lib/admissions/pagination";
import type { Admission } from "@/src/generated/prisma/client";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { useAccess } from "@/hooks/useAccess";
import AccessNotice from "@/components/ui/AccessNotice";

export default function AdmissionsPage() {
  const { canManage, canManageAdmissions, role, error: accessError } = useAccess();
  const { academicYears: createdAcademicYears, loading: yearsLoading, error: yearsError } = useAcademicYears();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const activeAcademicYears = createdAcademicYears.filter((year) => year.isActive);
  const academicYear = yearsLoading ? "" : selectDefaultAdmissionYear(activeAcademicYears, selectedAcademicYear);
  const selectedYearIsActive = createdAcademicYears.some((year) => year.academicYear === academicYear && year.isActive);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [finalStatusFilter, setFinalStatusFilter] = useState("ALL");
  const [applicationFilter, setApplicationFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdmissionPageSize>(DEFAULT_ADMISSION_PAGE_SIZE);
  const [openNew, setOpenNew] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Admission | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [followUpRefresh, setFollowUpRefresh] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const { students, total, totalPages, loading, error, reload: reloadDirectory } = useAdmissionsDirectory({
    academicYear,
    page,
    pageSize,
    search: debouncedSearch,
    classFilter,
    finalStatusFilter,
    applicationFilter,
  });
  const activeFilters = {
    academicYear,
    search: debouncedSearch,
    classFilter,
    finalStatusFilter,
    applicationFilter,
  };
  const { summary, loading: summaryLoading, error: summaryError, reload: reloadSummary } = useAdmissionsSummary(activeFilters, canManage);
  // Keep class choices stable even while a KPI request for another filter is loading.
  const { classOptions, error: classesError, reload: reloadClasses } = useAdmissionClassOptions(academicYear, role === "staff" || role === "admin");
  const hasAppliedFilters = Boolean(debouncedSearch) || classFilter !== "ALL" || finalStatusFilter !== "ALL" || applicationFilter !== "ALL";
  const reload = useCallback(() => {
    reloadDirectory();
    if (canManage) reloadSummary();
    if (role === "staff" || role === "admin") reloadClasses();
  }, [reloadDirectory, reloadSummary, reloadClasses, canManage, role]);

  function selectYear(value: string) {
    setSelectedAcademicYear(value);
    setPage(1);
    setClassFilter("ALL");
    setFinalStatusFilter("ALL");
    setApplicationFilter("ALL");
  }

  function setSearchAndReset(value: string) {
    setSearch(value);
    setPage(1);
  }
  function setClassAndReset(value: string) {
    setClassFilter(value);
    setPage(1);
  }
  function setFinalStatusAndReset(value: string) {
    setFinalStatusFilter(value);
    setPage(1);
  }
  function setApplicationAndReset(value: string) {
    setApplicationFilter(value);
    setPage(1);
  }
  function setPageSizeAndReset(value: AdmissionPageSize) {
    setPageSize(value);
    setPage(1);
  }

  async function openAdmissionFromQueue(id: string) {
    try {
      const response = await fetch("/api/admissions/" + encodeURIComponent(id), { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to open admission");
      setSelectedStudent(body.data);
      setOpenDetail(true);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to open enquiry");
    }
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 flex-col items-stretch justify-center gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between sm:px-6 xl:px-9">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="hidden size-11 shrink-0 place-items-center rounded-[15px] border border-indigo-100 bg-indigo-50 text-indigo-600 lg:grid"><Users className="size-5" /></span>
              <div className="min-w-0">
                <p className="premium-kicker !text-[10px] !tracking-[.15em]">Workspace <span className="mx-1.5 text-slate-300">/</span> Admissions</p>
                <h1 className="mt-0.5 truncate text-[19px] font-black tracking-[-.035em] text-slate-950 sm:text-[23px]">Admission pipeline</h1>
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
              <div className="hidden text-right xl:block">
                <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">Academic session</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Admissions directory</p>
              </div>
              <div className="w-[118px] sm:w-[143px]">
                <SchoolDbSelect ariaLabel="Academic year" value={academicYear || undefined} onValueChange={selectYear}
                  options={activeAcademicYears.map((year) => ({
                    label: `${year.academicYear}`,
                    value: year.academicYear,
                  }))}
                  placeholder={yearsLoading ? "Loading…" : "No active years"}
                  disabled={yearsLoading || activeAcademicYears.length === 0}
                  className="!h-11 !rounded-[14px] !border-indigo-100 !bg-indigo-50/70 !font-extrabold !text-indigo-800" />
              </div>
              {canManageAdmissions && <button onClick={() => setOpenNew(true)} disabled={!academicYear || !selectedYearIsActive}
                className="premium-button h-11 rounded-[14px] px-3 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:text-sm">
                <Plus className="size-4" /><span className="hidden sm:inline">New enquiry</span><span className="sm:hidden">New</span>
              </button>}
              <div className="hidden border-l border-slate-200 pl-3 lg:block"><AccountMenu /></div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1680px] space-y-4 p-3 sm:space-y-6 sm:p-6 xl:p-10">
          <AccessNotice role={role} error={accessError} />
          <section className="premium-hero rounded-[26px] p-5 sm:rounded-[30px] sm:p-7 xl:p-8">
            <div className={`relative z-10 grid items-center gap-5 sm:gap-6 ${canManage ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]" : ""}`}>
              <div className="min-w-0 max-w-2xl">
                <p className="premium-kicker flex items-center gap-2"><Sparkles className="size-4" />{academicYear ? `${academicYear.replace("-", "–")} admission desk` : "Activate an academic year"}</p>
                <h2 className="mt-3 text-[27px] font-black leading-[1.12] tracking-[-0.045em] sm:text-[32px]">Your admissions, at a glance.</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 sm:text-[15px]">Track enquiries from application to admission, with every follow-up in one place.</p>
              </div>
              {canManage && <div className="grid min-w-0 grid-cols-2 gap-3" aria-label="Admission summary" aria-live="polite">
                <div className="hero-stat min-w-0 rounded-[18px] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 text-indigo-600"><Users className="size-4" /><span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Enquiries</span></div>
                  <strong className="mt-2 block text-3xl font-black leading-none tracking-tight tabular-nums sm:text-4xl">{(summaryLoading || yearsLoading) ? "…" : summary.total.toLocaleString("en-IN")}</strong>
                  <p className="mt-2 text-[11px] font-semibold">Total enquiries</p>
                </div>
                <div className="hero-stat min-w-0 rounded-[18px] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="size-4" /><span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Admitted</span></div>
                  <strong className="mt-2 block text-3xl font-black leading-none tracking-tight tabular-nums sm:text-4xl">{(summaryLoading || yearsLoading) ? "…" : summary.admitted.toLocaleString("en-IN")}</strong>
                  <p className="mt-2 text-[11px] font-semibold">Confirmed admissions</p>
                </div>
              </div>}
            </div>
          </section>

          {canManage && (
            <div className="space-y-2">
              {hasAppliedFilters && <p className="text-sm font-semibold text-indigo-700" aria-live="polite">KPI totals reflect all matching admissions across every page.</p>}
              <KPISection stats={summary} loading={summaryLoading || yearsLoading} />
            </div>
          )}
          {(error || yearsError || (canManage && summaryError) || classesError) && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm font-semibold text-red-700 shadow-sm">{yearsError || error || (canManage && summaryError) || classesError}</div>}
          {(role === "staff" || role === "admin") && academicYear && (
            <FollowUpQueue academicYear={academicYear} role={role} refreshToken={followUpRefresh}
              onOpenAdmission={(id) => void openAdmissionFromQueue(id)} />
          )}
          <AdmissionsTable
            canManageAdmissions={canManageAdmissions}
            students={students}
            totalCount={total}
            yearTotal={canManage ? summary.yearTotal : undefined}
            loading={loading || yearsLoading}
            search={search}
            setSearch={setSearchAndReset}
            classFilter={classFilter}
            setClassFilter={setClassAndReset}
            classOptions={classOptions}
            finalStatusFilter={finalStatusFilter}
            setFinalStatusFilter={setFinalStatusAndReset}
            applicationFilter={applicationFilter}
            setApplicationFilter={setApplicationAndReset}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSizeAndReset}
            onView={(student) => { setSelectedStudent(student); setOpenDetail(true); }}
            reload={reload}
          />
        </main>
      </div>

      <AdmissionDetailModal student={selectedStudent} open={openDetail} onClose={() => setOpenDetail(false)} onFollowUpChanged={() => setFollowUpRefresh((value) => value + 1)} />
      {canManageAdmissions && <NewAdmissionModal open={openNew} onClose={() => setOpenNew(false)} reload={reload} academicYear={academicYear} canManageFees={canManage} />}
    </div>
  );
}
