"use client";

interface Props {
  students: any[];
}

const columns = [
  {
    key: "ENQUIRY",
    title: "Enquiries",
  },

  {
    key: "APPLICATION",
    title: "Applications",
  },

  {
    key: "ENTRANCE",
    title: "Entrance",
  },

  {
    key: "INTERVIEW",
    title: "Interview",
  },

  {
    key: "ADMISSION",
    title: "Admission",
  },

  {
    key: "ADMITTED",
    title: "Admitted",
  },
];

function getStudents(students: any[], key: string) {
  switch (key) {
    case "ENQUIRY":
      return students.filter((s) => s.application === "NO");

    case "APPLICATION":
      return students.filter(
        (s) => s.application === "YES" || s.application === "SUBMITTED",
      );

    case "ENTRANCE":
      return students.filter(
        (s) => s.entrance === "PENDING" || s.entrance === "PASS",
      );

    case "INTERVIEW":
      return students.filter(
        (s) => s.interview === "PENDING" || s.interview === "SELECTED",
      );

    case "ADMISSION":
      return students.filter((s) => s.admissionGiven === "GIVEN");

    case "ADMITTED":
      return students.filter((s) => s.finalAdmission === "ADMITTED");

    default:
      return [];
  }
}

export default function PipelineBoard({ students }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-5 min-w-[1400px]">
        {columns.map((column) => {
          const items = getStudents(students, column.key);

          return (
            <div
              key={column.key}
              className="
                min-w-[260px]
                flex-1
                rounded-3xl
                border
                border-slate-200
                bg-white/80
                p-4
                shadow-lg
              "
            >
              {/* HEADER */}

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{column.title}</h3>

                  <p className="text-sm text-slate-500">
                    {items.length} Students
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    bg-blue-100
                    px-3
                    py-1
                    text-sm
                    font-bold
                    text-blue-700
                  "
                >
                  {items.length}
                </div>
              </div>

              {/* CARDS */}

              <div className="space-y-3">
                {items.map((student) => (
                  <div
                    key={student.id}
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-4
                      shadow-sm
                      transition-all
                      hover:-translate-y-1
                      hover:shadow-lg
                    "
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800">
                          {student.student}
                        </h4>

                        <p className="mt-1 text-sm text-slate-500">
                          {student.parent}
                        </p>
                      </div>

                      <div
                        className="
                          rounded-xl
                          bg-slate-100
                          px-2
                          py-1
                          text-xs
                          font-bold
                        "
                      >
                        {student.admClass}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-slate-600">
                        {student.mobile}
                      </div>

                      <div className="mt-2 text-xs text-slate-400">
                        {student.enquiryNo}
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-dashed
                      border-slate-200
                      p-6
                      text-center
                      text-sm
                      text-slate-400
                    "
                  >
                    No students
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
