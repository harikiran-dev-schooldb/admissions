"use client";

import {
  Calendar,
  CheckCircle2,
  GraduationCap,
  Phone,
  User,
  X,
} from "lucide-react";

type Props = {
  student: any | null;
  open: boolean;
  onClose: () => void;
};

function statusClass(value: string) {
  switch (value) {
    case "PASS":
    case "SELECTED":
    case "GIVEN":
    case "ADMITTED":
    case "SUBMITTED":
      return `
        bg-emerald-100
        text-emerald-700
        border-emerald-200
      `;

    case "FAIL":
    case "REJECTED":
    case "CANCELLED":
      return `
        bg-red-100
        text-red-700
        border-red-200
      `;

    case "PENDING":
      return `
        bg-amber-100
        text-amber-700
        border-amber-200
      `;

    default:
      return `
        bg-slate-100
        text-slate-700
        border-slate-200
      `;
  }
}

function StagePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div
        className={`
          inline-flex
          items-center
          justify-center
          min-w-[150px]
          rounded-2xl
          border
          px-4
          py-3
          text-sm
          font-semibold
          shadow-sm
          ${statusClass(value)}
        `}
      >
        {value.replaceAll("_", " ")}
      </div>
    </div>
  );
}

function DetailCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
      "
    >
      {children}
    </div>
  );
}

export default function AdmissionDetailModal({
  student,
  open,
  onClose,
}: Props) {
  if (!open || !student) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        justify-end
        bg-black/40
        backdrop-blur-sm
      "
    >
      <div className="flex-1" onClick={onClose} />

      <div
        className="
          h-full
          w-full
          overflow-y-auto
          bg-gradient-to-br
          from-white
          to-slate-50
          shadow-2xl
          animate-in
          slide-in-from-right
          duration-300
          md:w-[650px]
        "
      >
        {/* HEADER */}

        <div
          className="
            sticky
            top-0
            z-20
            flex
            items-center
            justify-between
            border-b
            border-slate-200/70
            bg-white/90
            px-7
            py-5
            backdrop-blur-xl
          "
        >
          <div>
            <h2
              className="
                text-3xl
                font-black
                tracking-tight
                text-slate-900
              "
            >
              {student.student}
            </h2>

            <p className="mt-1 text-sm text-slate-500">{student.enquiryNo}</p>
          </div>

          <button
            onClick={onClose}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-slate-100
              transition-all
              hover:bg-slate-200
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENT */}

        <div className="space-y-6 p-7">
          {/* STUDENT INFO */}

          <DetailCard>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Student Information
                </h3>

                <p className="text-sm text-slate-500">
                  Admission enquiry details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <div className="text-sm text-slate-500">Parent</div>

                <div className="mt-1 font-semibold">{student.parent}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Mobile</div>

                <div className="mt-1 font-semibold">{student.mobile}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Class</div>

                <div className="mt-1 font-semibold">{student.admClass}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500">DOB</div>

                <div className="mt-1 font-semibold">{student.dob}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Age</div>

                <div className="mt-1 font-semibold">{student.age}</div>
              </div>

              <div>
                <div className="text-sm text-slate-500">Eligible Class</div>

                <div className="mt-1 font-semibold">
                  {student.eligibleClass}
                </div>
              </div>
            </div>
          </DetailCard>

          {/* WORKFLOW */}

          <DetailCard>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Admission Workflow
                </h3>

                <p className="text-sm text-slate-500">
                  Current admission stages
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <StagePill label="Application" value={student.application} />

              <StagePill label="Entrance" value={student.entrance} />

              <StagePill label="Interview" value={student.interview} />

              <StagePill
                label="Admission Given"
                value={student.admissionGiven}
              />

              <StagePill
                label="Final Admission"
                value={student.finalAdmission}
              />
            </div>
          </DetailCard>

          {/* TIMELINE */}

          <DetailCard>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Timeline</h3>

                <p className="text-sm text-slate-500">Activity history</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold">Enquiry Created</div>

                <div className="mt-1 text-sm text-slate-500">
                  {new Date(student.enquiryDate).toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold">Last Updated</div>

                <div className="mt-1 text-sm text-slate-500">
                  {new Date(student.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </DetailCard>

          {/* ACTIONS */}

          <DetailCard>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-3 text-pink-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Quick Actions
                </h3>

                <p className="text-sm text-slate-500">Fast access actions</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
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
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                "
              >
                WhatsApp Parent
              </a>

              <button
                className="
                  rounded-2xl
                  bg-sky-600
                  px-5
                  py-3
                  font-semibold
                  text-white
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                "
              >
                View Fees
              </button>

              <button
                className="
                  rounded-2xl
                  bg-purple-600
                  px-5
                  py-3
                  font-semibold
                  text-white
                  shadow-lg
                  transition-all
                  duration-200
                  hover:scale-105
                "
              >
                Export Details
              </button>
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
