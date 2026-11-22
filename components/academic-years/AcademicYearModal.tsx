"use client";

import { useState } from "react";
import { CalendarRange, Loader2, X } from "lucide-react";
import type { AcademicYearRecord } from "@/hooks/useAcademicYears";
import { getLatestAcademicYear } from "@/lib/academicYears";

type Props = { open: boolean; academicYear?: AcademicYearRecord | null; onClose: () => void; onSaved: () => void };

export default function AcademicYearModal({ open, academicYear, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() => ({ academicYear: academicYear?.academicYear ?? getLatestAcademicYear(), startDate: academicYear?.startDate?.slice(0, 10) ?? "", endDate: academicYear?.endDate?.slice(0, 10) ?? "", isActive: academicYear?.isActive ?? true }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  const editing = Boolean(academicYear);

  async function submit() {
    try {
      setLoading(true); setError("");
      const response = await fetch(editing ? `/api/academic-years/${academicYear!.id}` : "/api/academic-years", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startDate: form.startDate || null, endDate: form.endDate || null }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || `Failed to ${editing ? "update" : "create"} academic year`);
      onSaved(); onClose();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save academic year"); }
    finally { setLoading(false); }
  }

  return <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_90px_rgba(15,23,42,.25)]"><div className="flex items-center justify-between border-b border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-violet-100 px-6 py-5"><div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-white"><CalendarRange className="size-5" /></div><div><h2 className="text-xl font-black text-slate-950">{editing ? "Edit Academic Year" : "New Academic Year"}</h2><p className="mt-1 text-sm text-slate-500">Configure the session and its active status.</p></div></div><button onClick={onClose} aria-label="Close" className="rounded-xl bg-white p-2.5 text-slate-500 shadow-sm"><X className="size-4" /></button></div><div className="space-y-5 p-6">{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}<div><label className="mb-2 block text-sm font-bold text-slate-700">Academic year</label><input value={form.academicYear} onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))} placeholder="2027-28" className="premium-input h-12 w-full rounded-xl px-4 font-semibold outline-none" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-bold text-slate-700">Start date</label><input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="premium-input h-12 w-full rounded-xl px-4 outline-none" /></div><div><label className="mb-2 block text-sm font-bold text-slate-700">End date</label><input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="premium-input h-12 w-full rounded-xl px-4 outline-none" /></div></div><label className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><span><strong className="block text-sm text-slate-900">Active academic year</strong><span className="mt-1 block text-sm text-slate-500">Show this year in operational dropdowns.</span></span><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="size-5 accent-indigo-600" /></label><div className="flex justify-end gap-3 pt-2"><button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Cancel</button><button onClick={submit} disabled={loading} className="premium-button px-5 py-3 text-sm font-bold disabled:opacity-50">{loading && <Loader2 className="size-4 animate-spin" />}{editing ? "Save changes" : "Create year"}</button></div></div></div></div>;
}
