"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, History, Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { AUDIT_PAGE_SIZES, DEFAULT_AUDIT_PAGE_SIZE, getAuditPageWindow, type AuditPageSize } from "@/lib/audit/pagination";

type ChangedValue = string | number | boolean | null;
type Change = { from: ChangedValue; to: ChangedValue };
type Entry = {
  id: string;
  actorEmail: string;
  actorName: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  changes: Record<string, Change>;
  createdAt: string;
};

type Payload = { data: Entry[]; total: number; page: number; pages: number; pageSize: number };
const categories = [
  {value:"ALL",label:"All record types"},
  {value:"ADMISSION",label:"Admissions"},
  {value:"FEE",label:"Fees"},
  {value:"ACADEMIC_YEAR",label:"Academic years"},
  {value:"SETTINGS",label:"Settings"},
  {value:"USER",label:"Users and roles"},
];
const actions = [
  {value:"ALL",label:"All actions"},
  ...["CREATED","UPDATED","DELETED","STAGE_CHANGED","DEACTIVATED","REACTIVATED","ROLE_CHANGED"]
    .map((value) => ({value,label:value.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,(letter)=>letter.toUpperCase())})),
];
const fieldLabels: Record<string, string> = {
  enquiryNo:"Enquiry number", academicYear:"Academic year", admClass:"Class",
  eligibleStatus:"Eligibility", application:"Application", entrance:"Entrance",
  interview:"Interview", finalAdmission:"Final admission", admissionGiven:"Admission given",
  className:"Class", termFee:"Term fee", annualFees:"Annual fees", age:"Age",
  startDate:"Start date", endDate:"End date", isActive:"Active",
  role:"Role", active:"Active", email:"Email", key:"Setting", value:"Value",
};

function formatValue(value: ChangedValue): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d\d:/.test(value)) {
    return new Date(value).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"});
  }
  return String(value).replaceAll("_"," ");
}

function actionStyle(action: string): string {
  if (action === "CREATED" || action === "REACTIVATED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (action === "DELETED" || action === "DEACTIVATED") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-700";
}

export default function ActivityLogPageClient() {
  const [type, setType] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AuditPageSize>(DEFAULT_AUDIT_PAGE_SIZE);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<{key: string; payload: Payload | null; error: string}>({ key:"", payload:null, error:"" });

  useEffect(() => {
    const t = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (type !== "ALL") params.set("type", type);
  if (action !== "ALL") params.set("action", action);
  if (query) params.set("q", query);
  const requestKey = `${params}&r=${refresh}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/audit-logs?${params}`, {cache:"no-store", signal:controller.signal})
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Failed to load activity");
        return json as Payload;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setState({key:requestKey,payload,error:""});
        if (payload.page !== page) setPage(payload.page);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setState({key:requestKey,payload:null,error:caught instanceof Error ? caught.message : "Unable to load audit history"});
      });
    return () => controller.abort();
  // requestKey uniquely identifies the current filters, page and refresh epoch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const loading = state.key !== requestKey;
  const payload = loading ? null : state.payload;
  const entries = payload?.data ?? [];
  const currentPage = payload?.page ?? page;
  const totalPages = payload?.pages ?? 1;
  const totalRecords = payload?.total ?? 0;
  const firstRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(totalRecords, currentPage * pageSize);
  const visiblePages = getAuditPageWindow(currentPage, totalPages);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
            <div><p className="premium-kicker">Access &amp; oversight</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Audit logs</h1></div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRefresh((value) => value + 1)} aria-label="Refresh activity" className="inline-flex h-11 items-center gap-2 rounded-xl border border-indigo-100 bg-white px-4 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-50"><RefreshCw className="size-4" />Refresh</button>
              <div className="hidden border-l border-slate-200 pl-3 lg:block"><AccountMenu /></div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[30px] p-6 sm:p-9">
            <div className="relative max-w-3xl">
              <p className="premium-kicker flex items-center gap-2"><ShieldCheck className="size-4" />Administrator-only history</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Know who changed what—and when.</h2>
              <p className="mt-3 text-sm leading-6 sm:text-base">Track enquiries, admission stages, fee structures, academic years, settings and user access. Existing entries are append-only and can’t be edited through the application.</p>
            </div>
          </section>

          <section className="premium-panel overflow-hidden rounded-[26px]">
            <div className="flex flex-col gap-3 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/80 to-white p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white"><History className="size-5" /></div>
                <div><h3 className="text-lg font-black text-slate-900">Activity timeline</h3><p className="text-sm text-slate-500" aria-live="polite">{loading ? "Loading history…" : `${payload?.total ?? 0} matching events`}</p></div>
              </div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Clock3 className="size-3.5" />Most recent first · Your local time</p>
            </div>
            <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_220px_220px]">
              <form onSubmit={submitSearch} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-indigo-400">
                <Search className="size-4 shrink-0 text-slate-400" />
                <input type="search" value={search} onChange={(event)=>setSearch(event.target.value)}
                  placeholder="Search user, email or record…" aria-label="Search audit logs"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </form>
              <SchoolDbSelect ariaLabel="Filter audit record type" value={type} options={categories} onValueChange={(value)=>{setType(value);setPage(1);}} />
              <SchoolDbSelect ariaLabel="Filter audit action" value={action} options={actions} onValueChange={(value)=>{setAction(value);setPage(1);}} />
            </div>
            {state.key === requestKey && state.error && <p role="alert" className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{state.error}</p>}
            {loading ? <div role="status" className="flex items-center justify-center gap-2 px-6 py-20 text-sm font-semibold text-slate-500"><Loader2 className="size-5 animate-spin" />Loading audit logs…</div> :
              entries.length === 0 ? <div className="px-5 py-20 text-center text-sm font-semibold text-slate-500">No matching audit events yet. New changes appear here after they are saved.</div> :
              <div className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const changes = Object.entries(entry.changes ?? {});
                  return (
                    <article key={entry.id} className="space-y-2 px-5 py-4 transition hover:bg-indigo-50/25">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-extrabold ${actionStyle(entry.action)}`}>{entry.action.replaceAll("_"," ")}</span>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{entry.entityType.replaceAll("_"," ")}</span>
                        <span className="font-extrabold text-slate-900">{entry.entityLabel}</span>
                        <time className="ml-auto text-xs font-semibold text-slate-500" dateTime={entry.createdAt} title={new Date(entry.createdAt).toISOString()}>
                          {new Date(entry.createdAt).toLocaleString("en-IN", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </time>
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-900">{entry.actorName || entry.actorEmail}</span>
                        {entry.actorName && <span className="ml-2 text-xs text-slate-500">{entry.actorEmail}</span>}
                        <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize text-slate-600">{entry.actorRole}</span>
                      </p>
                      <details className="rounded-xl bg-slate-50/90 px-3 py-2 text-sm">
                        <summary className="cursor-pointer font-semibold text-indigo-700">{changes.length ? `View ${changes.length} changed field${changes.length === 1 ? "" : "s"}` : "No tracked field differences"}</summary>
                        {changes.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {changes.map(([field, change]) => (
                            <div key={field} className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{fieldLabels[field] || field}</p>
                              <p className="mt-2 break-words text-sm text-slate-600"><span className="text-slate-400">{formatValue(change.from)}</span><span className="mx-2 text-indigo-600">→</span><strong className="text-slate-900">{formatValue(change.to)}</strong></p>
                            </div>
                          ))}
                        </div>}
                      </details>
                    </article>
                  );
                })}
              </div>
            }
            <footer className="flex flex-col gap-4 border-t border-indigo-100 bg-gradient-to-r from-indigo-50/75 via-white to-violet-50/75 px-4 py-4 sm:px-5" aria-label="Audit pagination">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-600" aria-live="polite">
                  {loading ? "Loading page…" : totalRecords === 0
                    ? "No matching audit events"
                    : <>Showing <strong className="tabular-nums text-slate-900">{firstRecord.toLocaleString("en-IN")}–{lastRecord.toLocaleString("en-IN")}</strong> of <strong className="tabular-nums text-slate-900">{totalRecords.toLocaleString("en-IN")}</strong> events</>}
                </p>
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs font-bold text-slate-500">Rows per page</span>
                  <div className="w-24">
                    <SchoolDbSelect ariaLabel="Audit rows per page" value={String(pageSize)}
                      onValueChange={(value) => { setPageSize(Number(value) as AuditPageSize); setPage(1); }}
                      options={AUDIT_PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))} />
                  </div>
                </div>
              </div>
              <nav aria-label="Audit result pages" className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={loading || currentPage <= 1} aria-label="Previous audit page"
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="size-4" />
                </button>
                {visiblePages[0] > 1 && (
                  <>
                    <button type="button" onClick={() => setPage(1)} disabled={loading}
                      aria-label="Audit page 1" className="min-w-10 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-40">1</button>
                    {visiblePages[0] > 2 && <span className="px-1 text-sm text-slate-400" aria-hidden="true">…</span>}
                  </>
                )}
                {visiblePages.map((number) => (
                  <button type="button" key={number} onClick={() => setPage(number)}
                    aria-label={`Audit page ${number}`} aria-current={number === currentPage ? "page" : undefined} disabled={loading}
                    className={`min-w-10 rounded-xl px-3 py-2.5 text-sm font-extrabold tabular-nums transition disabled:opacity-40 ${number === currentPage
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-100"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"}`}>
                    {number}
                  </button>
                ))}
                {visiblePages.at(-1) !== totalPages && (
                  <>
                    {(visiblePages.at(-1) ?? 0) < totalPages - 1 && <span className="px-1 text-sm text-slate-400" aria-hidden="true">…</span>}
                    <button type="button" onClick={() => setPage(totalPages)} disabled={loading}
                      aria-label={`Audit page ${totalPages}`} className="min-w-10 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-40">{totalPages}</button>
                  </>
                )}
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={loading || currentPage >= totalPages} aria-label="Next audit page"
                  className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight className="size-4" />
                </button>
                <span className="ml-2 hidden whitespace-nowrap text-xs font-semibold text-slate-500 md:inline">Page {currentPage} of {totalPages}</span>
              </nav>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}
