"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, IndianRupee, Loader2 } from "lucide-react";
import type { Admission, FeeRecord } from "@/src/generated/prisma/client";

type Props = { student: Admission; onClose: () => void };

function sameClass(a: string, b: string) {
  return a.trim().toLocaleUpperCase("en-IN") === b.trim().toLocaleUpperCase("en-IN");
}

export default function AdmissionFeePreview({ student, onClose }: Props) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/fees", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load fee structure");
        return body.data as FeeRecord[];
      })
      .then((rows) => { if (!controller.signal.aborted) setFees(rows); })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load fee structure");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const matchingFee = useMemo(
    () => fees.find((fee) => fee.academicYear === student.academicYear && sameClass(fee.className, student.admClass)),
    [fees, student.academicYear, student.admClass],
  );
  const feeUrl = "/fees?" + new URLSearchParams({ year: student.academicYear, class: student.admClass }).toString();

  return (
    <section id="admission-fee-preview" className="rounded-[22px] border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/70 p-4 shadow-sm sm:p-5" aria-live="polite" aria-label="Admission class fee structure">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><IndianRupee className="size-5" /></span>
          <div>
            <h3 className="text-base font-black text-slate-900">Class fee structure</h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{student.admClass} · {student.academicYear}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Hide fees</button>
      </div>
      {loading && <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" />Loading fee structure…</p>}
      {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"><CircleAlert className="size-4 shrink-0" />{error}</p>}
      {!loading && !error && matchingFee && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-indigo-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Term fee</p>
            <p className="mt-2 text-xl font-black tabular-nums text-indigo-800">₹{matchingFee.termFee.toLocaleString("en-IN")}</p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Annual fee</p>
            <p className="mt-2 text-xl font-black tabular-nums text-emerald-700">₹{matchingFee.annualFees.toLocaleString("en-IN")}</p>
          </div>
          <p className="col-span-2 text-xs leading-5 text-slate-500">These are configured class fees, not the student’s payment history or outstanding balance.</p>
        </div>
      )}
      {!loading && !error && !matchingFee && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-900">No fee structure is configured for this class and academic year.</p>
          <p className="mt-1 text-xs text-amber-800">Ask an administrator to add it in Fee Structure. No other year’s fees have been substituted.</p>
        </div>
      )}
      <Link href={feeUrl} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
        Open fee structure <ArrowUpRight className="size-4" />
      </Link>
    </section>
  );
}
