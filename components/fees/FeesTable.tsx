"use client";

import { Eye, Search } from "lucide-react";
import type { FeeRecord } from "@/src/generated/prisma/client";

interface Props {
  fees: FeeRecord[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onView: (fee: FeeRecord) => void;
  reload: () => void;
}

export default function FeesTable({ fees, search, setSearch, onView }: Props) {
  return (
    <div
      className="
        rounded-[28px]
        border
        border-white/90
        bg-white/82
        shadow-[0_22px_60px_rgba(79,70,229,.08)]
        backdrop-blur-xl
      "
    >
      <div className="border-b border-indigo-100/70 p-5">
        <div className="relative max-w-lg">
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-indigo-50/65">
            <tr>
              {[
                "Academic Year",
                "Class",
                "Term Fee",
                "Annual Fees",
                "Age",
                "Actions",
              ].map((head) => (
                <th
                  key={head}
                  className="
                    px-6
                    py-4
                    text-left
                    text-xs
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
            {fees.map((fee) => (
              <tr
                key={fee.id}
                className="
                  border-t
                  border-slate-100
                  transition-colors
                  hover:bg-indigo-50/45
                "
              >
                <td className="px-6 py-5 font-semibold">{fee.academicYear}</td>

                <td className="px-6 py-5">{fee.className}</td>

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

                <td className="px-6 py-5">{fee.age || "-"}</td>

                <td className="px-6 py-5">
                  <button
                    onClick={() => onView(fee)}
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
