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
    <div className="space-y-5">
      {/* SEARCH */}

      <div
        className="
          rounded-[28px]
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
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
              h-14
              w-full
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              pl-14
              pr-5
              text-sm
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
          rounded-[28px]
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        {/* HEADER */}

        <div
          className="
            hidden
            grid-cols-[120px_170px_130px_170px_90px_minmax(260px,1fr)_100px]
            gap-2
            border-b
            border-slate-200
            bg-slate-50
            px-4
            py-4
            text-[11px]
            font-bold
            uppercase
            tracking-wider
            text-slate-500
            lg:grid
          "
        >
          <div>Enquiry</div>

          <div>Student</div>

          <div>DOB</div>

          <div>Parent</div>

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
                hover:bg-slate-50/60
              "
            >
              {/* DESKTOP */}

              <div
                className="
                  hidden
                  grid-cols-[120px_170px_130px_170px_90px_minmax(260px,1fr)_100px]
                  gap-2
                  px-4
                  py-4
                  lg:grid
                "
              >
                {/* ENQUIRY */}

                <div>
                  <div className="font-semibold text-slate-800">
                    {student.enquiryNo}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {new Date(student.enquiryDate).toLocaleDateString("en-GB")}
                  </div>
                </div>

                {/* STUDENT */}

                <div>
                  <div className="font-bold text-slate-900">
                    {student.student}
                  </div>
                </div>

                {/* DOB */}

                <div>
                  <div className="font-semibold text-slate-700">
                    {new Date(student.dob).toLocaleDateString("en-GB")}
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

                {/* CLASS */}

                <div>
                  <span
                    className="
                      inline-flex
                      rounded-2xl
                      bg-blue-100
                      px-3
                      py-1.5
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

                <div className="flex items-start gap-2">
                  <button
                    onClick={() => onView(student)}
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-2xl
                      bg-slate-100
                      text-slate-700
                      transition-all
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
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-2xl
                      bg-emerald-100
                      text-emerald-700
                      transition-all
                      hover:bg-emerald-200
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-400">Mobile</div>

                    <div className="font-medium">{student.mobile}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">DOB</div>

                    <div className="font-medium">
                      {new Date(student.dob).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Enquiry</div>

                    <div className="font-medium">{student.enquiryNo}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Age</div>

                    <div className="font-medium">{student.age}</div>
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
