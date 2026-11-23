"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Eye, Hash, MessageCircle, Phone, Search, SlidersHorizontal, UsersRound, X } from "lucide-react";
import { ADMISSION_PAGE_SIZES, type AdmissionPageSize } from "@/lib/admissions/pagination";
import type { Admission } from "@/src/generated/prisma/client";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import AdmissionStages from "./AdmissionStages";

type Props = {
  canManageAdmissions: boolean;
  students: Admission[]; totalCount: number; yearTotal?: number; loading: boolean; search: string; setSearch: (value: string) => void;
  classFilter: string; setClassFilter: (value: string) => void; classOptions: string[];
  finalStatusFilter: string; setFinalStatusFilter: (value: string) => void;
  applicationFilter: string; setApplicationFilter: (value: string) => void;
  page: number; pageSize: AdmissionPageSize; totalPages: number;
  onPageChange: (page: number) => void; onPageSizeChange: (pageSize: AdmissionPageSize) => void;
  onView: (student: Admission) => void; reload: () => void;
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusStyle(value: string) {
  if (["ADMITTED", "PASS", "SELECTED"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
  if (["FAIL", "REJECTED", "CANCELLED"].includes(value)) return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function prettyStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function whatsappHref(mobile: string) {
  const digits = (mobile || "").replace(/\D/g, "");
  const number = digits.length === 10 ? "91" + digits : digits;
  return number.length >= 10 ? "https://wa.me/" + number : null;
}

export default function AdmissionTable({
  canManageAdmissions, students, totalCount, yearTotal, loading, search, setSearch,
  classFilter, setClassFilter, classOptions, finalStatusFilter, setFinalStatusFilter,
  applicationFilter, setApplicationFilter, page, pageSize, totalPages, onPageChange,
  onPageSizeChange, onView, reload,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const hasActiveFilters = Boolean(search.trim()) || classFilter !== "ALL" || finalStatusFilter !== "ALL" || applicationFilter !== "ALL";
  const activeAdvancedFilters = [classFilter, finalStatusFilter, applicationFilter].filter((value) => value !== "ALL").length;
  const showMobileFilters = filtersOpen;
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const pageWindowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => pageWindowStart + index);

  function clearFilters() {
    setSearch("");
    setClassFilter("ALL");
    setFinalStatusFilter("ALL");
    setApplicationFilter("ALL");
    setFiltersOpen(false);
    setExpandedStudent(null);
  }

  function changePage(next: number) {
    setExpandedStudent(null);
    onPageChange(next);
  }

  return (
    <div id="admissions-results" className="scroll-mt-28 space-y-4">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,.04)]" aria-label="Admission directory search and filters">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><UsersRound className="size-5" /></span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold tracking-tight text-slate-950">Student directory</h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm" aria-live="polite">
                {loading ? "Updating records…" : totalCount.toLocaleString("en-IN") + " matching enquiries" +
                  (yearTotal === undefined ? "" : " · " + yearTotal.toLocaleString("en-IN") + " this year")}
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50">
              <X className="size-4" /> Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input type="search" aria-label="Search admissions" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, enquiry, parent, or phone…"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
          </div>
          <button type="button" aria-controls="admission-advanced-filters" aria-expanded={showMobileFilters}
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-indigo-200 xl:hidden">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4 text-indigo-600" /> Filters{activeAdvancedFilters > 0 ? " (" + activeAdvancedFilters + " active)" : ""}</span>
            <ChevronDown className={"size-4 transition-transform " + (showMobileFilters ? "rotate-180" : "")} />
          </button>
          <div id="admission-advanced-filters" className={(showMobileFilters ? "grid" : "hidden") + " grid-cols-1 gap-2 sm:grid-cols-3 xl:grid xl:w-[620px]"}>
            <SchoolDbSelect ariaLabel="Filter by class" value={classFilter} onValueChange={setClassFilter}
              options={[{ label: "All classes", value: "ALL" }, ...classOptions.map((value) => ({ label: value, value }))]} />
            <SchoolDbSelect ariaLabel="Filter by admission status" value={finalStatusFilter} onValueChange={setFinalStatusFilter}
              options={[{ label: "All admission status", value: "ALL" }, { label: "Pending", value: "PENDING" }, { label: "Admitted", value: "ADMITTED" }, { label: "Cancelled", value: "CANCELLED" }]} />
            <SchoolDbSelect ariaLabel="Filter by application status" value={applicationFilter} onValueChange={setApplicationFilter}
              options={[{ label: "All applications", value: "ALL" }, { label: "Not started", value: "NO" }, { label: "Started", value: "YES" }, { label: "Submitted", value: "SUBMITTED" }]} />
          </div>
        </div>
        {activeAdvancedFilters > 0 && !filtersOpen && (
          <p className="border-t border-slate-100 px-5 py-2 text-xs font-semibold text-indigo-600 xl:hidden">
            {activeAdvancedFilters} active filter{activeAdvancedFilters === 1 ? "" : "s"} applied
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,.035)]" aria-label="Admissions results" aria-busy={loading}>
        <div className="hidden grid-cols-[minmax(210px,1.2fr)_minmax(175px,1fr)_minmax(100px,.6fr)_minmax(150px,.9fr)_auto] items-center gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 xl:grid">
          <span>Student</span><span>Parent contact</span><span>Class</span><span>Admission status</span><span className="text-right">Actions</span>
        </div>

        {loading && (
          <div role="status" aria-label="Loading admissions" className="divide-y divide-slate-100">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-4 px-5 py-5">
                <span className="size-11 shrink-0 rounded-2xl bg-slate-100" />
                <span className="flex-1 space-y-2"><span className="block h-3 w-2/5 rounded-full bg-slate-100" /><span className="block h-2.5 w-3/5 rounded-full bg-slate-100" /></span>
                <span className="hidden h-9 w-24 rounded-xl bg-slate-100 sm:block" />
              </div>
            ))}
          </div>
        )}
        {!loading && students.length === 0 && (
          <div className="grid min-h-52 place-items-center px-5 py-12 text-center">
            <div className="space-y-2">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Search className="size-5" /></span>
              <p className="font-bold text-slate-900">No admissions found</p>
              <p className="text-sm text-slate-500">Try a different name, class, or admission status.</p>
              {hasActiveFilters && <button type="button" onClick={clearFilters} className="mt-2 min-h-10 rounded-xl bg-indigo-50 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-100">Clear filters</button>}
            </div>
          </div>
        )}

        {!loading && <div className="divide-y divide-slate-100">
          {students.map((student) => {
            const expanded = expandedStudent === student.id;
            const whatsApp = whatsappHref(student.mobile);
            return (
              <article key={student.id} aria-labelledby={"admission-row-name-" + student.id} className="bg-white transition-colors hover:bg-slate-50/50">
                <div className="grid gap-3 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(210px,1.2fr)_minmax(175px,1fr)_minmax(100px,.6fr)_minmax(150px,.9fr)_auto] xl:items-center xl:gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700 ring-1 ring-indigo-100">
                      {initials(student.student || "Unknown")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button type="button" id={"admission-row-name-" + student.id} onClick={() => onView(student)}
                        className="block max-w-full truncate text-left text-sm font-bold text-slate-950 hover:text-indigo-700 sm:text-[15px]" title={student.student}>
                        {student.student || "Name not provided"}
                      </button>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <Hash className="size-3" aria-hidden="true" /> <span className="truncate">{student.enquiryNo}</span>
                      </p>
                    </div>
                    <span className={"shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold xl:hidden " + statusStyle(student.finalAdmission)}>
                      {prettyStatus(student.finalAdmission)}
                    </span>
                  </div>

                  <div className="grid min-w-0 grid-cols-2 gap-3 rounded-xl bg-slate-50/75 px-3 py-2.5 sm:grid-cols-3 xl:block xl:bg-transparent xl:p-0">
                    <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Parent</p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800 sm:text-sm" title={student.parent || undefined}>{student.parent || "—"}</p>
                    </div>
                    <div className="min-w-0 xl:mt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Phone</p>
                      {student.mobile ? (
                        <a href={"tel:" + student.mobile} className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-700">
                          <Phone className="hidden size-3.5 xl:inline" aria-hidden="true" />{student.mobile}
                        </a>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </div>

                  <div className="hidden xl:block">
                    <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">{student.admClass}</span>
                    <p className="mt-1.5 text-xs text-slate-500">{student.age || "Age not set"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 xl:block">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 xl:hidden">
                        <CalendarDays className="mr-1 inline size-3.5" aria-hidden="true" /> {student.admClass} · {student.age || "Age not set"}
                      </p>
                      <span className={"hidden rounded-lg border px-2.5 py-1 text-xs font-bold xl:inline-flex " + statusStyle(student.finalAdmission)}>
                        {prettyStatus(student.finalAdmission)}
                      </span>
                      <p className="mt-1.5 text-xs text-slate-500">Application: {prettyStatus(student.application)}</p>
                    </div>
                    <span className="hidden text-xs text-slate-400 lg:inline xl:hidden">{student.entrance === "PASS" ? "Entrance passed" : "Entrance " + prettyStatus(student.entrance)}</span>
                  </div>

                  <div className="flex items-center gap-2 xl:justify-end">
                    <button type="button" onClick={() => onView(student)} aria-label={"View " + student.student}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700 xl:flex-none">
                      <Eye className="size-4" /> <span className="xl:sr-only">View profile</span>
                    </button>
                    <button type="button" aria-expanded={expanded} aria-controls={"admission-journey-" + student.id}
                      onClick={() => setExpandedStudent(expanded ? null : student.id)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-700 xl:flex-none">
                      {canManageAdmissions ? "Update stage" : "View stages"} <ChevronDown aria-hidden="true" className={"size-3.5 transition-transform " + (expanded ? "rotate-180" : "")} />
                    </button>
                    {whatsApp && (
                      <a href={whatsApp} target="_blank" rel="noopener noreferrer" aria-label={"WhatsApp " + student.parent}
                        className="grid size-11 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <MessageCircle className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div id={"admission-journey-" + student.id} hidden={!expanded}
                  className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
                  {expanded && (
                    <div className="max-w-lg">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{canManageAdmissions ? "Quick stage verification" : "Admission journey"}</p>
                      <AdmissionStages student={student} reload={reload} canManage={canManageAdmissions} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>}

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5" aria-label="Admissions pagination">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium text-slate-600" aria-live="polite">
              {loading ? "Loading page…" : totalCount === 0 ? "No matching admissions" :
                <>Showing <strong className="tabular-nums text-slate-900">{start.toLocaleString("en-IN")}–{end.toLocaleString("en-IN")}</strong> of <strong className="tabular-nums text-slate-900">{totalCount.toLocaleString("en-IN")}</strong> enquiries</>}
            </p>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Rows per page</span>
              <div className="w-24">
                <SchoolDbSelect ariaLabel="Admissions rows per page" value={String(pageSize)}
                  onValueChange={(value) => { setExpandedStudent(null); onPageSizeChange(Number(value) as AdmissionPageSize); }}
                  options={ADMISSION_PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))} />
              </div>
            </div>
          </div>
          <nav aria-label="Admission result pages" className="flex items-center justify-between gap-2 sm:justify-end">
            <button type="button" disabled={loading || page <= 1} onClick={() => changePage(page - 1)}
              aria-label="Previous admissions page" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-semibold text-slate-600 sm:hidden">Page {page} of {totalPages}</span>
            <div className="hidden flex-wrap items-center justify-center gap-1 sm:flex">
              {pageWindowStart > 1 && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
              {visiblePages.map((number) => (
                <button key={number} type="button" aria-label={"Admissions page " + number}
                  aria-current={number === page ? "page" : undefined} disabled={loading} onClick={() => changePage(number)}
                  className={"min-w-10 rounded-xl px-3 py-2.5 text-sm font-bold transition disabled:opacity-40 " +
                    (number === page ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700")}>
                  {number}
                </button>
              ))}
              {visiblePages.at(-1) !== totalPages && <span className="px-1 text-slate-400" aria-hidden="true">…</span>}
            </div>
            <button type="button" disabled={loading || page >= totalPages} onClick={() => changePage(page + 1)}
              aria-label="Next admissions page" className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </footer>
      </section>
    </div>
  );
}
