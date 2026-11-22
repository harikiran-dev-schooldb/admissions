"use client";

import { CalendarDays, Eye, Hash, MessageCircle, Phone, Search, SlidersHorizontal, UserRound } from "lucide-react";
import type { Admission } from "@/src/generated/prisma/client";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import AdmissionStages from "./AdmissionStages";

type Props = {
  students: Admission[]; loading: boolean; search: string; setSearch: (value: string) => void;
  classFilter: string; setClassFilter: (value: string) => void; classOptions: string[];
  finalStatusFilter: string; setFinalStatusFilter: (value: string) => void;
  applicationFilter: string; setApplicationFilter: (value: string) => void;
  onView: (student: Admission) => void; reload: () => void;
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusStyle(value: string) {
  if (["ADMITTED", "PASS", "SELECTED"].includes(value)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "PENDING") return "border-amber-200 bg-amber-50 text-amber-700";
  if (["FAIL", "REJECTED", "CANCELLED"].includes(value)) return "border-red-200 bg-red-50 text-red-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function prettyStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdmissionTable({ students, loading, search, setSearch, classFilter, setClassFilter, classOptions, finalStatusFilter, setFinalStatusFilter, applicationFilter, setApplicationFilter, onView, reload }: Props) {
  return (
    <div className="space-y-5">
      <div className="premium-panel rounded-[26px] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, parent or mobile..." className="h-14 w-full rounded-2xl border border-slate-200/80 bg-white/80 pl-14 pr-5 text-sm outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-[620px]">
            <SchoolDbSelect ariaLabel="Filter by class" value={classFilter} onValueChange={setClassFilter} options={[{ label: "All classes", value: "ALL" }, ...classOptions.map((value) => ({ label: value, value }))]} />
            <SchoolDbSelect ariaLabel="Filter by admission status" value={finalStatusFilter} onValueChange={setFinalStatusFilter} options={[{ label: "All admission status", value: "ALL" }, { label: "Pending", value: "PENDING" }, { label: "Admitted", value: "ADMITTED" }, { label: "Cancelled", value: "CANCELLED" }]} />
            <SchoolDbSelect ariaLabel="Filter by application status" value={applicationFilter} onValueChange={setApplicationFilter} options={[{ label: "All applications", value: "ALL" }, { label: "Not started", value: "NO" }, { label: "Started", value: "YES" }, { label: "Submitted", value: "SUBMITTED" }]} />
          </div>
          <SlidersHorizontal className="hidden size-5 shrink-0 text-indigo-500 xl:block" />
        </div>
      </div>

      <section className="premium-table overflow-hidden rounded-[28px] p-2 sm:p-3">
        <div className="hidden grid-cols-[minmax(235px,1.1fr)_minmax(190px,.9fr)_170px_minmax(330px,1.5fr)_150px] gap-5 px-5 pb-3 pt-2 text-xs font-black uppercase tracking-[.13em] text-slate-400 xl:grid">
          <div>Student profile</div><div>Family contact</div><div>Age &amp; class</div><div>Admission journey</div><div className="text-right">Status &amp; actions</div>
        </div>

        {loading && <div className="grid min-h-40 place-items-center rounded-[22px] bg-slate-50/70 text-sm font-semibold text-slate-500">Loading admissions…</div>}
        {!loading && students.length === 0 && <div className="grid min-h-40 place-items-center rounded-[22px] bg-slate-50/70 text-center"><div><p className="font-black text-slate-800">No admissions found</p><p className="mt-1 text-sm text-slate-500">Try changing the search or filters.</p></div></div>}

        <div className="space-y-2">
          {!loading && students.map((student) => (
            <article key={student.id} className="group rounded-[22px] border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_14px_35px_rgba(79,70,229,.10)]">
              <div className="hidden grid-cols-[minmax(235px,1.1fr)_minmax(190px,.9fr)_170px_minmax(330px,1.5fr)_150px] items-center gap-5 p-5 xl:grid">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-[0_8px_20px_rgba(79,70,229,.25)] ring-4 ring-indigo-50">{initials(student.student)}<span className="absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-white bg-emerald-400" /></div>
                  <div className="min-w-0">
                    <button onClick={() => onView(student)} className="block max-w-full truncate text-left text-base font-black tracking-[-.02em] text-slate-950 transition-colors hover:text-indigo-600">{student.student}</button>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-indigo-700"><Hash className="size-3" />{student.enquiryNo}</span><span>{new Date(student.enquiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                  </div>
                </div>

                <div className="min-w-0"><p className="flex items-center gap-2 truncate font-bold text-slate-800"><UserRound className="size-4 shrink-0 text-indigo-500" />{student.parent}</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500"><Phone className="size-4 shrink-0 text-emerald-500" />{student.mobile}</p></div>

                <div><div className="flex items-center gap-2"><span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-black text-indigo-700">{student.admClass}</span><span className="text-sm font-bold text-slate-700">{student.age || "—"}</span></div><p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><CalendarDays className="size-3.5" />DOB {student.dob ? new Date(student.dob).toLocaleDateString("en-GB") : "not set"}</p></div>

                <AdmissionStages student={student} reload={reload} />

                <div className="flex flex-col items-end gap-3"><span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${statusStyle(student.finalAdmission)}`}>{prettyStatus(student.finalAdmission)}</span><div className="flex gap-2"><button onClick={() => onView(student)} aria-label={`View ${student.student}`} className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Eye className="size-4" /></button><a href={`https://wa.me/91${student.mobile}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${student.parent}`} className="grid size-10 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100"><MessageCircle className="size-4" /></a></div></div>
              </div>

              <div className="space-y-5 p-5 xl:hidden">
                <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-200">{initials(student.student)}</div><div className="min-w-0"><h3 className="truncate text-lg font-black text-slate-950">{student.student}</h3><p className="mt-0.5 truncate text-sm font-semibold text-slate-500">{student.parent} · {student.mobile}</p></div></div><span className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-black text-indigo-700">{student.admClass}</span></div>
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Enquiry</p><p className="mt-1 font-bold text-slate-800">{student.enquiryNo}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Age</p><p className="mt-1 font-bold text-slate-800">{student.age || "—"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Date of birth</p><p className="mt-1 font-bold text-slate-800">{student.dob ? new Date(student.dob).toLocaleDateString("en-GB") : "—"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Final status</p><span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${statusStyle(student.finalAdmission)}`}>{prettyStatus(student.finalAdmission)}</span></div></div>
                <AdmissionStages student={student} reload={reload} />
                <div className="flex gap-3"><button onClick={() => onView(student)} className="premium-button h-11 flex-1 px-4 text-sm font-bold"><Eye className="size-4" />View profile</button><a href={`https://wa.me/91${student.mobile}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"><MessageCircle className="size-4" />WhatsApp</a></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
