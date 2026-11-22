"use client";

import { ArrowDownWideNarrow, Eye, Search } from "lucide-react";
import type { FeeRecord } from "@/src/generated/prisma/client";

interface Props {
  fees: FeeRecord[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onView: (fee: FeeRecord) => void;
}

export default function FeesTable({ fees, loading, search, setSearch, onView }: Props) {
  return (
    <div
      className="premium-table
        rounded-[28px]
      "
    >
      <div className="flex flex-col gap-3 border-b border-indigo-100/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-lg">
          <Search
            className="
              absolute
              left-4
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fees..."
            className="
              w-full
              rounded-2xl
              border
              border-slate-200/80
              bg-white/80
              py-3
              pl-11
              pr-4
              text-sm
              outline-none
              transition
              focus:border-indigo-400
              focus:bg-white
              focus:ring-4
              focus:ring-indigo-100
            "
          />
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-sm font-bold text-indigo-700">
          <ArrowDownWideNarrow className="size-4" />
          Age: youngest first
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-indigo-50/65">
            <tr>
              {[
                "Age",
                "Class",
                "Term Fee",
                "Annual Fees",
                "Actions",
              ].map((head) => (
                <th
                  key={head}
                  className="
                    px-6
                    py-4
                    text-left
                    text-sm
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-6 py-14 text-center text-sm font-semibold text-slate-500">Loading fee structures…</td></tr>
            )}
            {!loading && fees.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-14 text-center"><p className="font-bold text-slate-700">No fee structures found</p><p className="mt-1 text-sm text-slate-500">Add a fee structure or choose another academic year.</p></td></tr>
            )}
            {!loading && fees.map((fee) => (
              <tr
                key={fee.id}
                className="
                  border-t
                  border-slate-100
                  transition-colors
                  hover:bg-indigo-50/45
                "
              >
                <td className="px-6 py-5">
                  <span className="inline-flex min-w-12 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-black text-indigo-700">{fee.age || "—"}</span>
                </td>

                <td className="px-6 py-5 font-bold text-slate-900">{fee.className}</td>

                <td className="px-6 py-5 font-semibold text-slate-700">₹{fee.termFee.toLocaleString()}</td>

                <td
                  className="
                    px-6
                    py-5
                    font-bold
                    text-emerald-700
                  "
                >
                  ₹{fee.annualFees.toLocaleString()}
                </td>

                <td className="px-6 py-5">
                  <button
                    onClick={() => onView(fee)}
                    aria-label={`View ${fee.className} fee details`}
                    className="
                      rounded-xl
                      bg-indigo-50
                      text-indigo-700
                      p-2
                      transition
                      hover:bg-indigo-100
                    "
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
