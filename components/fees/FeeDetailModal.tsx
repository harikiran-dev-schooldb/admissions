"use client";

import { useEffect, useRef } from "react";
import { GraduationCap, IndianRupee, X } from "lucide-react";
import type { FeeRecord } from "@/src/generated/prisma/client";

interface Props {
  fee: FeeRecord | null;
  open: boolean;
  onClose: () => void;
}

export default function FeeDetailModal({ fee, open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); previous?.focus(); };
  }, [open, onClose]);

  if (!open || !fee) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 backdrop-blur-[3px] sm:p-6">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-labelledby="fee-detail-title"
        className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-indigo-100 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,.26)] sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><GraduationCap className="size-5" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-indigo-600">SchoolDB fee master</p>
              <h2 id="fee-detail-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">{fee.className} fees</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{fee.academicYear} · Age {fee.age || "—"}</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close fee details"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700">
            <X className="size-5" />
          </button>
        </header>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-indigo-100 bg-indigo-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Term fee</p>
            <p className="mt-3 text-2xl font-black tabular-nums text-indigo-900">₹{fee.termFee.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Annual fee</p>
            <p className="mt-3 text-2xl font-black tabular-nums text-emerald-900">₹{fee.annualFees.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <IndianRupee className="mt-0.5 size-4 shrink-0 text-indigo-600" />
          These are configured fees for the class. They do not indicate student payments, discounts or outstanding balances.
        </p>
        <button type="button" onClick={onClose}
          className="premium-button mt-5 h-11 w-full px-5 text-sm font-bold">Done</button>
      </section>
    </div>
  );
}
