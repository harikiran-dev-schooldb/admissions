"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, Eye, PhoneCall } from "lucide-react";
import { indiaTodayBounds } from "@/lib/followUps/indiaDayBounds";
import FollowUpCompletion from "@/components/admissions/FollowUpCompletion";
import type { FollowUpItem, FollowUpResponse } from "@/types/followUps";

type Tab = "overdue" | "today" | "upcoming" | "completed";
const tabs: { key: Tab; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

function queueSearch(year: string, tab: Tab, page: number) {
  const query = new URLSearchParams({ academicYear: year, status: tab === "completed" ? "COMPLETED" : "OPEN", page: String(page) });
  const { start, tomorrow } = indiaTodayBounds();
  if (tab === "overdue") query.set("before", start.toISOString());
  if (tab === "today") { query.set("after", start.toISOString()); query.set("before", tomorrow.toISOString()); }
  if (tab === "upcoming") query.set("after", tomorrow.toISOString());
  return query;
}

export default function FollowUpQueue({
  academicYear, role, refreshToken, onOpenAdmission,
}: {
  academicYear: string;
  role: "admin" | "staff";
  refreshToken: number;
  onOpenAdmission: (id: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("overdue");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [completing, setCompleting] = useState("");
  // Role and query changes invalidate the prior response before another request finishes.
  const requestKey = `${academicYear}|${role}|${tab}|${page}|${refreshToken}|${refresh}`;
  const [result, setResult] = useState<{
    key: string; data: FollowUpItem[]; total: number; pageSize: number; error: string;
  }>({ key: "", data: [], total: 0, pageSize: 30, error: "" });
  const current = result.key === requestKey;
  const data = current ? result.data : [];
  const total = current ? result.total : 0;
  const pageSize = current ? result.pageSize : 30;
  const error = current ? result.error : "";
  const loading = !current;

  const reload = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => {
    if (!academicYear) return;
    const controller = new AbortController();
    fetch("/api/follow-ups?" + queueSearch(academicYear, tab, page).toString(), {
      cache: "no-store", signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json() as FollowUpResponse;
        if (!response.ok) throw new Error(body.error || "Unable to load scheduled calls");
        return body;
      })
      .then((body) => {
        if (!controller.signal.aborted) setResult({
          key: requestKey, data: body.data, total: body.total, pageSize: body.pageSize, error: "",
        });
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setResult({
          key: requestKey, data: [], total: 0, pageSize: 30,
          error: caught instanceof Error ? caught.message : "Unable to load follow-ups",
        });
      });
    return () => controller.abort();
  }, [academicYear, role, tab, page, requestKey]);

  function selectTab(next: Tab) {
    setTab(next);
    setPage(1);
    setCompleting("");
  }

  return (
    <section className="premium-panel rounded-[28px] border border-indigo-100 p-5 sm:p-6" aria-label="Admission follow-up queue">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white"><PhoneCall className="size-5" /></span>
          <div><h2 className="text-xl font-black text-slate-950">Enquiry follow-ups</h2>
            <p className="mt-1 text-sm text-slate-500">{role === "admin" ? "Scheduled contacts for the admission team" : "Your assigned calls and parent conversations"}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600"><CalendarClock className="size-4" />Schedule new calls from a student profile</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Follow-up status filter">
        {tabs.map((item) => (
          <button key={item.key} type="button" onClick={() => selectTab(item.key)} aria-pressed={tab === item.key}
            className={tab === item.key ? "rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white" : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-indigo-300"}>
            {item.label}
          </button>
        ))}
      </div>
      {tab === "overdue" && !loading && !error && total > 0 && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{total} overdue follow-up{total === 1 ? "" : "s"} need attention. Open an enquiry or log the outcome below.</p>}
      {error && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={reload} className="rounded-lg border border-rose-200 bg-white px-3 py-2 font-bold text-rose-700 hover:bg-rose-100">Retry</button></div>}
      <div className="mt-5 space-y-3" aria-live="polite">
        {loading && <p className="p-5 text-sm text-slate-500">Loading follow-ups…</p>}
        {!loading && !error && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <p className="font-bold text-slate-700">No {tab} follow-ups</p>
            <p className="mt-1 text-sm text-slate-500">Open an enquiry profile to schedule the next parent conversation.</p>
          </div>
        )}
        {!loading && data.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <button type="button" onClick={() => onOpenAdmission(item.admissionId)}
                  className="text-left text-sm font-black text-indigo-700 hover:underline">{item.admission.student} · {item.admission.enquiryNo}</button>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {item.admission.admClass} · {new Date(item.dueAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">Assigned to {item.assignedToName || item.assignedToEmail.split("@")[0]}</p>
                {item.note && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{item.note}</p>}
                {item.status === "COMPLETED" && <p className="mt-2 text-xs font-bold text-emerald-700">Outcome: {item.outcome?.replaceAll("_", " ")}</p>}
                {item.completionNote && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{item.completionNote}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" aria-label={"Open enquiry " + item.admission.enquiryNo}
                  onClick={() => onOpenAdmission(item.admissionId)} className="grid size-9 place-items-center rounded-xl border border-slate-200 text-indigo-700">
                  <Eye className="size-4" />
                </button>
                {item.status === "OPEN" && <button type="button" onClick={() => setCompleting(completing === item.id ? "" : item.id)}
                  className="rounded-xl border border-indigo-200 px-3 text-xs font-bold text-indigo-700">{completing === item.id ? "Close" : "Log call"}</button>}
              </div>
            </div>
            {completing === item.id && item.status === "OPEN" && (
              <FollowUpCompletion id={item.id} onDone={() => { setCompleting(""); reload(); }} />
            )}
          </article>
        ))}
      </div>
      {!loading && total > 0 && (
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
          <span>{total.toLocaleString("en-IN")} matching follow-ups</span>
          <div className="flex items-center gap-2">
            <button aria-label="Previous follow-up page" type="button" disabled={loading || page <= 1} onClick={() => setPage((n) => n - 1)}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            <button aria-label="Next follow-up page" type="button" disabled={loading || page * pageSize >= total} onClick={() => setPage((n) => n + 1)}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </footer>
      )}
    </section>
  );
}
