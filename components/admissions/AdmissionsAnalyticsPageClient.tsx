"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { BarChart3, RefreshCw, Sparkles } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import AnalyticsMetricCards from "@/components/admissions/AnalyticsMetricCards";
import AnalyticsLoadingSkeleton from "@/components/admissions/AnalyticsLoadingSkeleton";
import { useAdmissionAnalytics } from "@/hooks/useAdmissionAnalytics";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { analyticsClassOptions, summarizeAdmissionGroups } from "@/lib/admissions/analyticsSummary";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";

const AdmissionsAnalytics = dynamic(
  () => import("@/components/admissions/AdmissionsAnalytics"),
  { ssr: false, loading: () => <AnalyticsLoadingSkeleton chartOnly /> },
);

export default function AdmissionsAnalyticsPageClient() {
  const { academicYears: createdAcademicYears, loading: yearsLoading, error: yearsError } = useAcademicYears();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const academicYear = yearsLoading ? "" : selectDefaultAdmissionYear(createdAcademicYears, selectedAcademicYear);
  const { groups, loading: analyticsLoading, error, reload } = useAdmissionAnalytics(academicYear);
  const [classFilter, setClassFilter] = useState("ALL");
  const [finalStatusFilter, setFinalStatusFilter] = useState("ALL");

  const classOptions = useMemo(() => analyticsClassOptions(groups), [groups]);
  const summary = useMemo(
    () => summarizeAdmissionGroups(groups, classFilter, finalStatusFilter),
    [groups, classFilter, finalStatusFilter],
  );

  const loading = yearsLoading || analyticsLoading;
  const failure = yearsError || error;
  const hasFilters = classFilter !== "ALL" || finalStatusFilter !== "ALL";

  function selectYear(year: string) {
    setSelectedAcademicYear(year);
    setClassFilter("ALL");
    setFinalStatusFilter("ALL");
  }

  function clearFilters() {
    setClassFilter("ALL");
    setFinalStatusFilter("ALL");
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
            <div>
              <p className="premium-kicker">Admissions intelligence</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Analytics</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-36">
                <SchoolDbSelect ariaLabel="Academic year" value={academicYear || undefined}
                  onValueChange={selectYear}
                  options={createdAcademicYears.map((year) => ({ label: year.academicYear, value: year.academicYear }))}
                  placeholder={yearsLoading ? "Loading years…" : "No academic years"}
                  disabled={yearsLoading || createdAcademicYears.length === 0} className="font-bold" />
              </div>
              <div className="hidden border-l border-slate-200 pl-3 lg:block"><AccountMenu /></div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="hero-stat grid size-14 shrink-0 place-items-center rounded-2xl text-indigo-600">
                  <BarChart3 className="size-6" />
                </div>
                <div>
                  <p className="premium-kicker flex items-center gap-2">
                    <Sparkles className="size-3.5" />
                    {academicYear ? `${academicYear.replace("-", "–")} performance` : yearsLoading ? "Loading academic session" : "Choose an academic year"}
                  </p>
                  <h2 className="mt-2 max-w-4xl text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                    See where enquiries convert and where they need attention.
                  </h2>
                </div>
              </div>
              <button type="button" onClick={reload} disabled={loading || !academicYear}
                aria-label="Refresh admission analytics"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white/80 px-4 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </section>

          <section className="premium-panel flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">Filter analytics</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Class and admission-status filters update instantly without requesting student records.
              </p>
            </div>
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
              <div className="sm:w-48">
                <SchoolDbSelect ariaLabel="Analytics class filter" value={classFilter}
                  disabled={loading || !academicYear || Boolean(failure)}
                  onValueChange={setClassFilter}
                  options={[{ label: "All classes", value: "ALL" }, ...classOptions.map((value) => ({ label: value, value }))]} />
              </div>
              <div className="sm:w-52">
                <SchoolDbSelect ariaLabel="Analytics admission status filter" value={finalStatusFilter}
                  disabled={loading || !academicYear || Boolean(failure)}
                  onValueChange={setFinalStatusFilter}
                  options={[
                    { label: "All admission statuses", value: "ALL" },
                    { label: "Pending", value: "PENDING" },
                    { label: "Admitted", value: "ADMITTED" },
                    { label: "Cancelled", value: "CANCELLED" },
                  ]} />
              </div>
            </div>
          </section>

          {failure && (
            <section role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800">
              <p>{failure}</p>
              <button type="button" onClick={() => yearsError ? window.location.reload() : reload()}
                className="rounded-xl border border-rose-200 bg-white px-4 py-2 font-bold text-rose-800">Try again</button>
            </section>
          )}

          {!failure && loading && <AnalyticsLoadingSkeleton />}
          {!failure && !loading && !academicYear && (
            <section className="premium-panel rounded-[28px] p-10 text-center">
              <h3 className="text-xl font-black text-slate-900">No academic year configured</h3>
              <p className="mt-2 text-sm text-slate-500">Create an academic year to view admission performance.</p>
            </section>
          )}
          {!failure && !loading && academicYear && groups.length === 0 && (
            <section className="premium-panel rounded-[28px] p-10 text-center">
              <h3 className="text-xl font-black text-slate-900">No enquiries for {academicYear}</h3>
              <p className="mt-2 text-sm text-slate-500">The latest academic year is selected. Choose an older year to review historical admissions.</p>
            </section>
          )}
          {!failure && !loading && groups.length > 0 && summary.total === 0 && (
            <section className="premium-panel rounded-[28px] p-10 text-center">
              <h3 className="text-xl font-black text-slate-900">No enquiries match these filters</h3>
              <p className="mt-2 text-sm text-slate-500">Try a different class or admission status.</p>
              {hasFilters && <button type="button" onClick={clearFilters}
                className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-bold text-indigo-700">
                Clear filters
              </button>}
            </section>
          )}
          {!failure && !loading && summary.total > 0 && (
            <div className="space-y-6" aria-live="polite">
              <AnalyticsMetricCards summary={summary} />
              <AdmissionsAnalytics summary={summary} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
