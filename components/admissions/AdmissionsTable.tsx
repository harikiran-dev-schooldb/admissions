// src/components/admissions/AdmissionsTable.tsx

"use client";

import StatusBadge from "./StatusBadge";

interface Props {
  students: any[];
  onSelect: (student: any) => void;
}

export default function AdmissionsTable({ students, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/90 shadow-2xl shadow-slate-200/50 backdrop-blur-xl">
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xl">
            <tr className="border-b border-slate-200 text-left text-sm font-semibold text-slate-500">
              <th className="px-6 py-5">Enquiry</th>
              <th className="px-6 py-5">Student</th>
              <th className="px-6 py-5">Parent</th>
              <th className="px-6 py-5">Mobile</th>
              <th className="px-6 py-5">Class</th>
              <th className="px-6 py-5">Application</th>
              <th className="px-6 py-5">Entrance</th>
              <th className="px-6 py-5">Interview</th>
              <th className="px-6 py-5">Final</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s: any) => (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className="cursor-pointer border-b border-slate-100 transition-all hover:bg-blue-50/60"
              >
                <td className="px-6 py-5 font-medium text-slate-600">
                  {s.enquiryNo}
                </td>

                <td className="px-6 py-5">
                  <div className="font-bold text-slate-900">{s.student}</div>
                </td>

                <td className="px-6 py-5 text-slate-700">{s.parent}</td>

                <td className="px-6 py-5 text-slate-700">{s.mobile}</td>

                <td className="px-6 py-5">
                  <div className="inline-flex rounded-xl bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    {s.admClass}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <StatusBadge value={s.application} />
                </td>

                <td className="px-6 py-5">
                  <StatusBadge value={s.entrance} />
                </td>

                <td className="px-6 py-5">
                  <StatusBadge value={s.interview} />
                </td>

                <td className="px-6 py-5">
                  <StatusBadge value={s.finalAdmission} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
