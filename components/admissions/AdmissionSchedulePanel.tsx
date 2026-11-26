"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Admission } from "@/src/generated/prisma/client";
import { useAccess } from "@/hooks/useAccess";

function localValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

type Kind = "ENTRANCE" | "INTERVIEW";

function isFutureDate(value: Date) {
  return value.getTime() >= Date.now();
}

export default function AdmissionSchedulePanel({ student, onChanged }: {
  student: Admission; onChanged?: () => void;
}) {
  const { role, email } = useAccess();
  const [assignees, setAssignees] = useState<{ email: string; role: string; name: string }[]>([]);
  const [dates, setDates] = useState<Record<Kind, string>>({
    ENTRANCE: localValue(student.entranceScheduledAt),
    INTERVIEW: localValue(student.interviewScheduledAt),
  });
  const [owners, setOwners] = useState<Record<Kind, string>>({
    ENTRANCE: student.entranceAssignedEmail || email,
    INTERVIEW: student.interviewAssignedEmail || email,
  });
  const [saving, setSaving] = useState<Kind | null>(null);

  useEffect(() => {
    if (role !== "admin") return;
    const controller = new AbortController();
    fetch("/api/follow-ups/assignees", { signal: controller.signal, cache: "no-store" })
      .then(async (result) => result.ok ? (await result.json()).data : [])
      .then((data) => { if (!controller.signal.aborted) setAssignees(data ?? []); })
      .catch(() => {});
    return () => controller.abort();
  }, [role]);

  async function save(kind: Kind) {
    if (!dates[kind] || saving) return;
    const time = new Date(dates[kind]);
    if (!Number.isFinite(time.getTime()) || !isFutureDate(time)) {
      toast.error("Select a future date and time");
      return;
    }
    setSaving(kind);
    try {
      const response = await fetch(`/api/admissions/${student.id}/schedule`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, scheduledAt: time.toISOString(), assignedToEmail: role === "admin" ? owners[kind] || email : email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save appointment");
      toast.success(kind === "ENTRANCE" ? "Entrance exam scheduled" : "Interview scheduled", {
        description: "The assigned person will receive an alert if notifications are enabled.",
      });
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Appointment could not be scheduled");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section aria-label="Entrance and interview scheduling" className="rounded-[24px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><CalendarClock className="size-5" /></span>
        <div>
          <h3 className="text-lg font-black text-slate-900">Exam &amp; interview appointments</h3>
          <p className="text-sm text-slate-500">Schedule an actual date and notify the assigned person.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(["ENTRANCE", "INTERVIEW"] as const).map((kind) => (
          <div key={kind} className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <h4 className="text-sm font-black text-slate-900">{kind === "ENTRANCE" ? "Entrance exam" : "Interview"}</h4>
            <label className="block text-xs font-bold text-slate-700">Date and time
              <input type="datetime-local" aria-label={`${kind} appointment time`} disabled={student.finalAdmission !== "PENDING"}
                value={dates[kind]} onChange={(event) => setDates((prev) => ({ ...prev, [kind]: event.target.value }))}
                className="premium-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm" />
            </label>
            {role === "admin" && <label className="block text-xs font-bold text-slate-700">Assigned staff
              <select aria-label={`${kind} assigned staff`} value={owners[kind] || email}
                onChange={(event) => setOwners((prev) => ({ ...prev, [kind]: event.target.value }))}
                className="premium-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm">
                <option value={email}>Myself</option>
                {assignees.filter((person) => person.email !== email).map((person) => (
                  <option key={person.email} value={person.email}>{person.name}</option>
                ))}
              </select>
            </label>}
            {role === "staff" && <p className="text-xs text-slate-600">Assigned to your account</p>}
            <button type="button" disabled={!dates[kind] || saving !== null || student.finalAdmission !== "PENDING"}
              onClick={() => void save(kind)} className="premium-button h-10 rounded-xl px-4 text-xs font-bold disabled:opacity-50">
              {saving === kind && <Loader2 className="size-4 animate-spin" />} Save appointment
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
