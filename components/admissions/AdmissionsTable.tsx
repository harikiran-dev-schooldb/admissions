"use client";

import { Eye, Phone, Search } from "lucide-react";

import AdmissionStages from "./AdmissionStages";

type Props = {
  students: any[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onView: (student: any) => void;
  reload: () => void;
};

function badgeClass(value: string) {
  switch (value) {
    case "ADMITTED":
    case "PASS":
    case "SELECTED":
      return "bg-emerald-100 text-emerald-700";

    case "PENDING":
      return "bg-amber-100 text-amber-700";

    case "FAIL":
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdmissionTable({
  students,
  loading,
  search,
  setSearch,
  onView,
  reload,
}: Props) {
  return (
    <div className="space-y-6">
      {/* SEARCH */}

      <div
        className="
          rounded-[32px]
          border
          border-slate-200
          bg-white/90
          p-5
          shadow-xl
          shadow-slate-200/40
          backdrop-blur-xl
        "
      >
        <div className="relative">
          <Search
            className="
              absolute
              left-5
              top-1/2
              h-5
              w-5
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, parent or mobile..."
            className="
              h-16
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              pl-14
              pr-5
              text-[15px]
              outline-none
              transition-all
              focus:border-blue-500
              focus:bg-white
              focus:ring-4
              focus:ring-blue-100
            "
          />
        </div>
      </div>

      {/* TABLE */}

      <div
        className="
          overflow-hidden
          rounded-[32px]
          border
          border-slate-200
          bg-white
          shadow-xl
          shadow-slate-200/40
        "
      >
        {/* HEADER */}

        <div
          className="
            hidden
            grid-cols-[140px_220px_220px_170px_120px_1fr_120px]
            gap-4
            border-b
            border-slate-200
            bg-slate-50
            px-6
            py-5
            text-xs
            font-bold
            uppercase
            tracking-wider
            text-slate-500
            lg:grid
          "
        >
          <div>Enquiry</div>

          <div>Student</div>

          <div>Parent</div>

          <div>Mobile</div>

          <div>Class</div>

          <div>Stages</div>

          <div>Actions</div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="p-10 text-center text-slate-500">
            Loading admissions...
          </div>
        )}

        {/* EMPTY */}

        {!loading && students.length === 0 && (
          <div className="p-10 text-center text-slate-500">
            No admissions found
          </div>
        )}

        {/* ROWS */}

        <div className="divide-y divide-slate-100">
          {students.map((student) => (
            <div
              key={student.id}
              className="
                transition-all
                duration-200
                hover:bg-slate-50/70
              "
            >
              {/* DESKTOP */}

              <div
                className="
                  hidden
                  grid-cols-[140px_220px_220px_170px_120px_1fr_120px]
                  gap-4
                  px-6
                  py-6
                  lg:grid
                "
              >
                {/* ENQUIRY */}

                <div>
                  <div className="font-semibold text-slate-800">
                    {student.enquiryNo}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(student.enquiryDate).toLocaleDateString()}
                  </div>
                </div>

                {/* STUDENT */}

                <div>
                  <div className="font-bold text-slate-900">
                    {student.student}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {student.age}
                  </div>
                </div>

                {/* PARENT */}

                <div>
                  <div className="font-semibold text-slate-700">
                    {student.parent}
                  </div>

                  <div className="mt-1 text-sm text-slate-400">Parent</div>
                </div>

                {/* MOBILE */}

                <div>
                  <div className="font-semibold text-slate-700">
                    {student.mobile}
                  </div>
                </div>

                {/* CLASS */}

                <div>
                  <span
                    className="
                      inline-flex
                      rounded-2xl
                      bg-blue-100
                      px-4
                      py-2
                      text-sm
                      font-bold
                      text-blue-700
                    "
                  >
                    {student.admClass}
                  </span>
                </div>

                {/* STAGES */}

                <div>
                  <AdmissionStages student={student} reload={reload} />
                </div>

                {/* ACTIONS */}

                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onView(student)}
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-slate-100
                      text-slate-700
                      transition-all
                      hover:scale-105
                      hover:bg-blue-100
                      hover:text-blue-700
                    "
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  <a
                    href={`https://wa.me/91${student.mobile}`}
                    target="_blank"
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      bg-emerald-100
                      text-emerald-700
                      transition-all
                      hover:scale-105
                    "
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* MOBILE */}

              <div className="space-y-5 p-5 lg:hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {student.student}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {student.parent}
                    </div>
                  </div>

                  <div
                    className="
                      rounded-2xl
                      bg-blue-100
                      px-3
                      py-2
                      text-sm
                      font-bold
                      text-blue-700
                    "
                  >
                    {student.admClass}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Mobile</div>

                    <div className="font-medium">{student.mobile}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Enquiry</div>

                    <div className="font-medium">{student.enquiryNo}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-bold
                      ${badgeClass(student.application)}
                    `}
                  >
                    {student.application}
                  </div>

                  <div
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-bold
                      ${badgeClass(student.entrance)}
                    `}
                  >
                    {student.entrance}
                  </div>

                  <div
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-bold
                      ${badgeClass(student.finalAdmission)}
                    `}
                  >
                    {student.finalAdmission}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => onView(student)}
                    className="
                      flex-1
                      rounded-2xl
                      bg-blue-600
                      px-4
                      py-3
                      font-semibold
                      text-white
                    "
                  >
                    View Details
                  </button>

                  <a
                    href={`https://wa.me/91${student.mobile}`}
                    target="_blank"
                    className="
                      rounded-2xl
                      bg-emerald-600
                      px-5
                      py-3
                      font-semibold
                      text-white
                    "
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
