"use client";

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
      return "bg-green-100 text-green-700";

    case "FAIL":
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-100 text-red-700";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function StagePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </div>

      <div
        className={`
          inline-flex
          px-3
          py-2
          rounded-full
          text-sm
          font-medium
          ${statusClass(value)}
        `}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdmissionDetailModal({
  student,
  open,
  onClose,
}: Props) {
  if (!open || !student) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/40
        flex
        justify-end
      "
    >
      {/* BACKDROP */}

      <div className="flex-1" onClick={onClose} />

      {/* DRAWER */}

      <div
        className="
          w-full
          md:w-[550px]
          h-full
          bg-white
          overflow-y-auto
          shadow-2xl
        "
      >
        {/* HEADER */}

        <div
          className="
            sticky
            top-0
            bg-white
            border-b
            px-6
            py-5
            flex
            items-center
            justify-between
            z-10
          "
        >
          <div>
            <h2 className="text-2xl font-bold">{student.student}</h2>

            <p className="text-gray-500 mt-1">{student.enquiryNo}</p>
          </div>

          <button
            onClick={onClose}
            className="
              w-10
              h-10
              rounded-full
              bg-gray-100
              hover:bg-gray-200
            "
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}

        <div className="p-6 space-y-8">
          {/* BASIC DETAILS */}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Student Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Parent</div>

                <div className="font-medium">{student.parent}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Mobile</div>

                <div className="font-medium">{student.mobile}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Class</div>

                <div className="font-medium">{student.admClass}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">DOB</div>

                <div className="font-medium">{student.dob}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Age</div>

                <div className="font-medium">{student.age}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Eligible Class</div>

                <div className="font-medium">{student.eligibleClass}</div>
              </div>
            </div>
          </div>

          {/* WORKFLOW */}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Admission Workflow</h3>

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* TIMELINE */}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>

            <div
              className="
                border
                rounded-xl
                divide-y
              "
            >
              <div className="p-4">
                <div className="font-medium">Enquiry Created</div>

                <div className="text-sm text-gray-500 mt-1">
                  {new Date(student.enquiryDate).toLocaleString()}
                </div>
              </div>

              <div className="p-4">
                <div className="font-medium">Last Updated</div>

                <div className="text-sm text-gray-500 mt-1">
                  {new Date(student.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>

            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/91${student.mobile}`}
                target="_blank"
                className="
                  px-5
                  py-3
                  rounded-xl
                  bg-green-600
                  text-white
                  font-medium
                "
              >
                WhatsApp Parent
              </a>

              <button
                className="
                  px-5
                  py-3
                  rounded-xl
                  bg-sky-600
                  text-white
                  font-medium
                "
              >
                View Fees
              </button>

              <button
                className="
                  px-5
                  py-3
                  rounded-xl
                  bg-purple-600
                  text-white
                  font-medium
                "
              >
                Export Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
