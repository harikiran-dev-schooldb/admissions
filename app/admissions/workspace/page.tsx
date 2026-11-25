"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, RefreshCw, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import AccessNotice from "@/components/ui/AccessNotice";
import FollowUpQueue from "@/components/admissions/FollowUpQueue";
import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";
import { useAccess } from "@/hooks/useAccess";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { selectDefaultAdmissionYear } from "@/lib/admissions/selectAdmissionYear";
import type { Admission } from "@/src/generated/prisma/client";

type Event = { id: string; admissionId: string; student: string; enquiryNo: string; admClass: string; kind: string; at: string };
type Summary = { enquiries: number; admitted: number; pendingApplications: number; overdue: number };
type Data = { events: Event[]; truncated: boolean; summary: Summary | null };
const dateFormat = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });

export default function WorkspacePage() {
  const { role, error: accessError } = useAccess();
  const { academicYears, loading, error: yearError } = useAcademicYears();
  const [selectedYear, setSelectedYear] = useState("");
  const active = academicYears.filter(y => y.isActive);
  const year = loading ? "" : selectDefaultAdmissionYear(active, selectedYear);
  const [days, setDays] = useState("7");
  const [refresh, setRefresh] = useState(0);
  const [student, setStudent] = useState<Admission | null>(null);
  const [result, setResult] = useState<{ key: string; data: Data | null; error: string }>({ key: "", data: null, error: "" });
  const key = [year, days, role, refresh].join("|");
  const current = result.key === key ? result : null;
  useEffect(() => {
    if (!year || (role !== "admin" && role !== "staff")) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ academicYear: year, days });
    fetch("/api/admissions/workspace?" + query, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load workspace"); return body.data as Data; })
      .then(data => { if (!controller.signal.aborted) setResult({ key, data, error: "" }); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setResult({ key, data: null, error: error instanceof Error ? error.message : "Unable to load workspace" }); });
    return () => controller.abort();
  }, [year, days, role, key]);
  async function openAdmission(id: string) {
    try {
      const response = await fetch("/api/admissions/" + encodeURIComponent(id), { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load enquiry");
      setStudent(body.data as Admission);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to open enquiry"); }
  }
  const summary = role === "admin" ? current?.data?.summary : null;
  const eventGroups = new Map<string, Event[]>();
  for (const event of current?.data?.events ?? []) {
    const date = dateFormat.format(new Date(event.at));
    eventGroups.set(date, [...(eventGroups.get(date) ?? []), event]);
  }
  return <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
    <AppSidebar />
    <div className="lg:pl-72">
      <header className="premium-topbar sticky top-18 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-4 lg:top-0 sm:px-8 print:hidden">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><LayoutDashboard className="size-5" /></span><div><p className="premium-kicker">Workspace</p><h1 className="text-xl font-black text-slate-950">Daily work dashboard</h1></div></div>
        <div className="flex items-center gap-3"><Link className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-indigo-700" href="/admissions">Admissions</Link><div className="hidden lg:block"><AccountMenu /></div></div>
      </header>
      <main className="mx-auto max-w-[1480px] space-y-5 p-3 sm:p-6 xl:p-10">
        <AccessNotice role={role} error={accessError} />
        {(role === "admin" || role === "staff") && <>
          <section className="premium-hero rounded-[26px] p-5 sm:p-7">
            <p className="premium-kicker">Admission desk · India Standard Time</p><h2 className="mt-2 text-3xl font-black tracking-tight">Plan your day.</h2>
            <p className="mt-2 text-sm text-slate-600">{role === "admin" ? "Team appointments, calls and pending work." : "Your assigned appointments and parent follow-ups."}</p>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <label className="text-sm font-bold text-slate-700">Academic year<select aria-label="Academic year" className="mt-1 block rounded-xl border border-slate-200 bg-white p-3" value={year} onChange={e => {setSelectedYear(e.target.value); setStudent(null);}} disabled={loading || !active.length}>{!year && <option value="">Choose year</option>}{active.map(y => <option key={y.id} value={y.academicYear}>{y.academicYear}</option>)}</select></label>
              <button type="button" onClick={() => setRefresh(v => v+1)} className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-700"><RefreshCw className="size-4" /> Refresh</button>
            </div>
          </section>
          {(yearError || current?.error) && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{yearError || current?.error}</p>}
          {!loading && !year && <p className="premium-panel rounded-2xl p-5 text-sm">No active academic year. Ask an administrator to activate one.</p>}
          {summary && <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Administrator admission summary">
            {([["Enquiries",summary.enquiries],["Admitted",summary.admitted],["Pending applications",summary.pendingApplications],["Overdue follow-ups",summary.overdue]] as const).map(([label,value]) => <div key={label} className="premium-panel rounded-2xl p-4"><p className="text-xs font-bold text-slate-500">{label}</p><strong className="mt-2 block text-3xl font-black text-slate-950 tabular-nums">{value.toLocaleString("en-IN")}</strong></div>)}
          </section>}
          {year && <section className="premium-panel rounded-[26px] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays className="size-5 text-indigo-600" /> Admission calendar</h2><p className="mt-1 text-xs text-slate-500">Upcoming open appointments and scheduled calls · IST</p></div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Calendar range">{[["1","Today"],["7","7 days"],["30","30 days"]].map(([value,label]) => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)} className={"rounded-xl px-3 py-2 text-sm font-bold " + (days === value ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600")}>{label}</button>)}</div>
            </div>
            {!current && <p className="mt-5 animate-pulse text-sm text-slate-500" role="status">Loading schedule…</p>}
            {current?.data && eventGroups.size === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No scheduled work in this period.</p>}
            {Array.from(eventGroups, ([date, events]) => <div key={date} className="mt-5"><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{date}</h3><div className="space-y-2">{events.map(event => <button type="button" key={event.id} onClick={() => void openAdmission(event.admissionId)} className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left hover:border-indigo-200"><span className="min-w-20 text-sm font-bold text-indigo-700">{timeFormat.format(new Date(event.at))}</span><span className="min-w-0 flex-1"><strong className="block break-words text-sm text-slate-950">{event.student}</strong><span className="text-xs text-slate-500">{event.enquiryNo} · {event.admClass}</span></span><span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">{event.kind}</span></button>)}</div></div>)}
            {current?.data?.truncated && <p className="mt-3 text-sm text-amber-700">Showing the first 100 items. Choose a shorter range to narrow the schedule.</p>}
          </section>}
          {year && <FollowUpQueue key={year} academicYear={year} role={role} refreshToken={refresh} onOpenAdmission={id => void openAdmission(id)} />}
        </>}
      </main>
    </div>
    <AdmissionDetailModal key={student?.id ?? "none"} student={student} open={Boolean(student)} onClose={() => setStudent(null)} onFollowUpChanged={() => setRefresh(v => v+1)} />
  </div>;
}
