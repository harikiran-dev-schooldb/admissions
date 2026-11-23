"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, History, RefreshCw, UserRound } from "lucide-react";
import { describeAdmissionLog, type AdmissionLogItem } from "@/lib/admissions/admissionActivity";

type PageResponse = {
  data: AdmissionLogItem[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
};

function dateInIndia(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(date) + " IST";
}

const tones = {
  indigo: { dot: "bg-indigo-600", icon: "bg-indigo-50 text-indigo-600" },
  emerald: { dot: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-700" },
  rose: { dot: "bg-rose-500", icon: "bg-rose-50 text-rose-600" },
  neutral: { dot: "bg-slate-400", icon: "bg-slate-100 text-slate-600" },
} as const;

export default function AdmissionActivityLogs({ admissionId }: { admissionId: string }) {
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const key = admissionId + ":" + page + ":" + refresh;
  const [result, setResult] = useState<{
    key: string; data: PageResponse | null; error: string;
  }>({ key: "", data: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admissions/" + encodeURIComponent(admissionId) + "/logs?page=" + page, {
      cache: "no-store", signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as PageResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Could not load admission logs");
        return payload;
      })
      .then((payload) => {
        if (!controller.signal.aborted) setResult({ key, data: payload, error: "" });
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setResult({
          key, data: null, error: caught instanceof Error ? caught.message : "Unable to load history",
        });
      });
    return () => controller.abort();
  }, [admissionId, page, key]);

  const current = result.key === key;
  const loading = !current;
  const error = current ? result.error : "";
  const payload = current ? result.data : null;
  const records = payload?.data ?? [];

  return (
    <section aria-label="Student admission logs" className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <History className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-950 sm:text-lg">Admission activity logs</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Verified stage changes, appointments and admission decisions, newest first.
            </p>
          </div>
        </div>
        <button type="button" aria-label="Refresh admission logs" disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50">
          <RefreshCw className={"size-4 " + (loading ? "animate-spin" : "")} aria-hidden="true" /> Refresh
        </button>
      </header>

      <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs leading-5 text-indigo-900">
        Dates and times use Indian Standard Time (IST). Changes recorded before audit tracking began may not have individual timestamps.
      </p>

      {loading && <div role="status" aria-label="Loading student logs" className="space-y-3 rounded-[22px] border border-slate-200 bg-white p-5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex animate-pulse gap-4">
            <span className="size-9 shrink-0 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2"><span className="block h-3 w-2/5 rounded-full bg-slate-100" />
              <span className="block h-3 w-4/5 rounded-full bg-slate-100" /></div>
          </div>
        ))}
      </div>}

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <span className="inline-flex items-center gap-2"><AlertCircle className="size-4" />{error}</span>
        <button type="button" onClick={() => setRefresh((value) => value + 1)}
          className="min-h-10 rounded-xl border border-rose-200 bg-white px-4 font-bold text-rose-700">Retry</button>
      </div>}

      {!loading && !error && records.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Clock3 className="mx-auto size-8 text-slate-400" />
          <h4 className="mt-3 font-bold text-slate-900">No activity recorded</h4>
          <p className="mt-2 text-sm text-slate-500">New stage changes will appear here after they are saved.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <ol className="relative space-y-3 before:absolute before:bottom-5 before:left-[25px] before:top-5 before:w-px before:bg-slate-200">
          {records.map((entry) => {
            const content = describeAdmissionLog(entry);
            const tone = tones[content.tone];
            return (
              <li key={entry.id} className="relative flex items-start gap-3">
                <span aria-hidden="true" className={"relative z-10 mt-4 grid size-[50px] shrink-0 place-items-center rounded-full border-[7px] border-[#f7f8fc] " + tone.icon}>
                  {entry.historical ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
                </span>
                <article className="min-w-0 flex-1 rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,.03)] sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-950 sm:text-base">{content.title}</h4>
                    <span className={"mt-1 size-2 shrink-0 rounded-full " + tone.dot} aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                    <time dateTime={entry.createdAt}>{dateInIndia(entry.createdAt)}</time>
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <UserRound className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    {entry.actorName ? "By " + entry.actorName : "Historical record · actor not available"}
                  </p>
                  <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                    {content.details.map((line, i) => (
                      <li key={i} className="break-words text-xs leading-5 text-slate-600 sm:text-sm">{line}</li>
                    ))}
                  </ul>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {!loading && !error && payload && payload.pages > 1 && (
        <nav aria-label="Student activity log pages" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600">
          <button type="button" disabled={page <= 1} aria-label="Newer student log entries"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 disabled:opacity-40">
            <ChevronLeft className="size-4" /> Newer
          </button>
          <span className="text-center tabular-nums">Page {payload.page} of {payload.pages}</span>
          <button type="button" disabled={page >= payload.pages} aria-label="Older student log entries"
            onClick={() => setPage((previous) => previous + 1)}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 disabled:opacity-40">
            Older <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </section>
  );
}
