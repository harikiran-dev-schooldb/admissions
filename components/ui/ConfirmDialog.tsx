"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";

type Props = { open: boolean; title: string; description: string; loading?: boolean; confirmLabel?: string; onCancel: () => void; onConfirm: () => void };

export default function ConfirmDialog({ open, title, description, loading = false, confirmLabel = "Delete", onCancel, onConfirm }: Props) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_30px_90px_rgba(15,23,42,.25)]"><div className="flex items-start justify-between gap-4 p-6"><div className="flex gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100"><AlertTriangle className="size-5" /></div><div><h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div></div><button onClick={onCancel} aria-label="Close confirmation" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button></div><div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4"><button onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button><button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-200 disabled:opacity-50">{loading && <Loader2 className="size-4 animate-spin" />}{confirmLabel}</button></div></div></div>;
}
