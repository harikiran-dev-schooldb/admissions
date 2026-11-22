"use client";

import { useEffect, useId, useRef } from "react";
import { AlertTriangle, Loader2, ShieldCheck, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  loading?: boolean;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
};

/** In-app, keyboard accessible replacement for native window.confirm. */
export default function ConfirmDialog({
  open, title, description, loading = false,
  confirmLabel = "Delete", tone = "danger", onCancel, onConfirm,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const destructive = tone === "danger";
  const Icon = destructive ? AlertTriangle : ShieldCheck;
  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-md">
      <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
        className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/90 bg-white shadow-[0_36px_110px_rgba(15,23,42,.32)]">
        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/60 p-6 sm:p-7">
          <button type="button" onClick={onCancel} disabled={loading} aria-label="Close confirmation"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:opacity-50"><X className="size-4" /></button>
          <div className={`grid size-14 place-items-center rounded-2xl ring-1 ${destructive ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-indigo-50 text-indigo-700 ring-indigo-100"}`}>
            <Icon className="size-6" />
          </div>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.18em] text-indigo-600">SchoolDB confirmation</p>
          <h2 id={titleId} className="mt-2 pr-6 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-3 bg-white px-6 py-5">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className={`inline-flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50 ${destructive ? "bg-rose-600 shadow-rose-100 hover:bg-rose-700" : "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700"}`}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
