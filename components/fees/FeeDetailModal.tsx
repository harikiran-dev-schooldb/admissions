"use client";

import type { FeeRecord } from "@/src/generated/prisma/client";

interface Props {
  fee: FeeRecord | null;
  open: boolean;
  onClose: () => void;
}

export default function FeeDetailModal({ fee, open, onClose }: Props) {
  if (!open || !fee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/90 bg-white/92 p-6 shadow-[0_30px_90px_rgba(15,23,42,.24)] backdrop-blur-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Fee Details</h2>
          <button onClick={onClose} className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100">Close</button>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Academic Year</p>
            <p className="font-semibold">{fee.academicYear}</p>
          </div>
          <div>
            <p className="text-slate-500">Class</p>
            <p className="font-semibold">{fee.className}</p>
          </div>
          <div>
            <p className="text-slate-500">Age</p>
            <p className="font-semibold">{fee.age || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">Term Fee</p>
            <p className="text-lg font-bold text-slate-900">₹{fee.termFee.toLocaleString()}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-slate-500">Annual Fees</p>
            <p className="text-xl font-bold text-emerald-700">₹{fee.annualFees.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
