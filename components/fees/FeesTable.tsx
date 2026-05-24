"use client";

import { Eye, Search } from "lucide-react";

interface Props {
  fees: any[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onView: (fee: any) => void;
  reload: () => void;
}

export default function FeesTable({ fees, search, setSearch, onView }: Props) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-xl
      "
    >
      <div className="border-b border-slate-100 p-5">
        <div className="relative max-w-md">
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
              border-slate-200
              bg-slate-50
              py-3
              pl-11
              pr-4
              text-sm
              outline-none
              transition
              focus:border-emerald-500
              focus:bg-white
            "
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Academic Year",
                "Class",
                "Term",
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
                  hover:bg-slate-50
                "
              >
                <td className="px-6 py-5 font-semibold">{fee.academicYear}</td>

                <td className="px-6 py-5">{fee.className}</td>

                <td className="px-6 py-5">Term {fee.term}</td>

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
                      bg-slate-100
                      p-2
                      transition
                      hover:bg-slate-200
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
