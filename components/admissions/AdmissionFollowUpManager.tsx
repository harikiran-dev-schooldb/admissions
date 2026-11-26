"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { useAccess } from "@/hooks/useAccess";
import { getApiErrorMessage } from "@/lib/ui/getApiErrorMessage";
import FollowUpCompletion from "@/components/admissions/FollowUpCompletion";
import type { FollowUpItem, FollowUpResponse } from "@/types/followUps";

export default function AdmissionFollowUpManager({
  admissionId, isOpenAdmission, onChanged,
}: { admissionId: string; isOpenAdmission: boolean; onChanged?: () => void }) {
  const { role, email } = useAccess();
  const [items, setItems] = useState<FollowUpItem[]>([]);
  const [assignees, setAssignees] = useState<{ email: string; role: string; name: string }[]>([]);
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState("");

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/follow-ups?admissionId=" + encodeURIComponent(admissionId) + "&status=ALL", { cache: "no-store", signal });
      const data = await response.json() as FollowUpResponse;
      if (!response.ok) throw new Error(data.error || "Unable to load conversations");
      if (signal?.aborted) return;
      setItems(data.data);
      setError("");
    } catch (caught) {
      if (signal?.aborted) return;
      setError(caught instanceof Error ? caught.message : "Unable to load follow-ups");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [admissionId]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => reload(controller.signal));
    fetch("/api/follow-ups/assignees", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load staff");
        setAssignees(data.data ?? []);
      }).catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Could not load staff");
      });
    return () => controller.abort();
  }, [reload]);

  async function schedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dueAt || saving || !isOpenAdmission) return;
    setSaving(true);
    try {
      const parsedDueAt = new Date(dueAt);
      if (Number.isNaN(parsedDueAt.getTime()) || parsedDueAt.getTime() <= Date.now()) {
        throw new Error("Choose a future date and time");
      }
      const response = await fetch("/api/follow-ups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionId,
          dueAt: parsedDueAt.toISOString(),
          note,
          ...(role === "admin" && assignedToEmail ? { assignedToEmail } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(getApiErrorMessage(result, "Unable to schedule follow-up"));
      setDueAt("");
      setNote("");
      await reload();
      onChanged?.();
      toast.success("Follow-up scheduled");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save follow-up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6" aria-label="Enquiry follow-up CRM">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><CalendarClock className="size-5" /></span>
        <div><h3 className="text-xl font-black text-slate-900">Parent follow-ups</h3>
          <p className="mt-1 text-sm text-slate-500">Schedule calls and keep conversation history.</p></div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!isOpenAdmission && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This enquiry is closed. Reopen it before scheduling another follow-up.</p>}
      {isOpenAdmission && (
        <form onSubmit={(event) => void schedule(event)} className="space-y-3 rounded-2xl bg-indigo-50/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">Next contact date &amp; time
              <input aria-label="Next contact date and time" type="datetime-local" required value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className="premium-input mt-1.5 h-11 w-full rounded-xl px-3 text-sm" />
            </label>
            {role === "admin" ? (
              <label className="block text-xs font-bold text-slate-700">Assigned staff
                <select aria-label="Assign follow-up" value={assignedToEmail || email}
                  onChange={(event) => setAssignedToEmail(event.target.value)}
                  className="premium-input mt-1.5 h-11 w-full rounded-xl px-3 text-sm">
                  {!assignees.some((person) => person.email === email) && <option value={email}>Myself</option>}
                  {assignees.map((person) => <option key={person.email} value={person.email}>{person.name}</option>)}
                </select>
              </label>
            ) : (
              <div className="flex items-center gap-2 self-end rounded-xl bg-white p-3 text-xs text-slate-600"><UserRoundCheck className="size-4" />Assigned to you</div>
            )}
          </div>
          <label className="block text-xs font-bold text-slate-700">Parent conversation / next action
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={2}
              placeholder="Example: Parent requested a callback about the entrance date."
              className="premium-input mt-1.5 w-full rounded-xl p-3 text-sm" />
          </label>
          <button type="submit" disabled={!dueAt || saving || !role} className="premium-button inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Schedule follow-up
          </button>
        </form>
      )}
      <div className="mt-5 space-y-3">
        <h4 className="text-sm font-black text-slate-900">Follow-up history</h4>
        {loading && <p className="text-sm text-slate-500">Loading conversations…</p>}
        {!loading && items.length === 0 && <p className="text-sm text-slate-500">No recorded follow-ups yet.</p>}
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-bold text-slate-900">{new Date(item.dueAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              <span className={item.status === "OPEN" ? "rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700" : "rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"}>
                {item.status === "OPEN" ? "Scheduled" : "Completed"}
              </span>
            </div>
            <p className="mt-1 break-all text-xs text-slate-500">Assigned: {item.assignedToName || item.assignedToEmail.split("@")[0]}</p>
            {item.note && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{item.note}</p>}
            {item.status === "COMPLETED" && <p className="mt-2 text-sm font-semibold text-emerald-700">Outcome: {item.outcome?.replaceAll("_", " ")}</p>}
            {item.completionNote && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{item.completionNote}</p>}
            {item.status === "OPEN" && (role === "admin" || item.assignedToEmail === email) && (
              <div>
                {completing !== item.id ? (
                  <button type="button" onClick={() => setCompleting(item.id)} className="mt-3 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700">Record outcome</button>
                ) : (
                  <FollowUpCompletion id={item.id} onDone={() => { setCompleting(""); void reload(); onChanged?.(); }} />
                )}
              </div>
            )}
          </article>
        ))}
        {items.length >= 30 && <p className="text-xs text-slate-500">Showing the first 30 entries. Use the queue for more tasks.</p>}
      </div>
    </section>
  );
}
