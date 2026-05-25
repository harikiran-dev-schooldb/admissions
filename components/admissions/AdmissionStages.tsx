"use client";

import {
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

type Props = {
  student: any;
  reload: () => void;
};

const STAGES = [
  {
    key: "application",
    label: "Application",
    icon: FileText,

    completedValues: ["YES", "SUBMITTED"],

    options: [
      {
        label: "YES",
        value: "YES",
      },

      {
        label: "SUBMITTED",
        value: "SUBMITTED",
      },
    ],
  },

  {
    key: "entrance",
    label: "Entrance",
    icon: GraduationCap,

    completedValues: ["PASS", "NOT_REQUIRED"],

    options: [
      {
        label: "NOT STARTED",
        value: "NOT_STARTED",
      },

      {
        label: "PENDING",
        value: "PENDING",
      },

      {
        label: "PASS",
        value: "PASS",
      },

      {
        label: "FAIL",
        value: "FAIL",
      },

      {
        label: "NOT REQUIRED",
        value: "NOT_REQUIRED",
      },
    ],
  },

  {
    key: "interview",
    label: "Interview",
    icon: UserCheck,

    completedValues: ["SELECTED"],

    options: [
      {
        label: "NOT STARTED",
        value: "NOT_STARTED",
      },

      {
        label: "PENDING",
        value: "PENDING",
      },

      {
        label: "SELECTED",
        value: "SELECTED",
      },

      {
        label: "REJECTED",
        value: "REJECTED",
      },
    ],
  },

  {
    key: "admissionGiven",
    label: "Admission",
    icon: ShieldCheck,

    completedValues: ["GIVEN"],

    options: [
      {
        label: "NOT GIVEN",
        value: "NOT_GIVEN",
      },

      {
        label: "GIVEN",
        value: "GIVEN",
      },
    ],
  },

  {
    key: "finalAdmission",
    label: "Final Admission",
    icon: CheckCircle2,

    completedValues: ["ADMITTED"],

    options: [
      {
        label: "PENDING",
        value: "PENDING",
      },

      {
        label: "ADMITTED",
        value: "ADMITTED",
      },

      {
        label: "CANCELLED",
        value: "CANCELLED",
      },
    ],
  },
];

function getCurrentStage(student: any) {
  for (const stage of STAGES) {
    const value = student[stage.key];

    if (!stage.completedValues.includes(value)) {
      return stage;
    }
  }

  return null;
}

export default function AdmissionStages({ student, reload }: Props) {
  async function updateStage(field: string, value: string) {
    try {
      const res = await fetch("/api/admissions/stages", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: student.id,
          field,
          value,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to update");

        return;
      }

      reload();
    } catch (error) {
      console.error(error);

      alert("Something went wrong");
    }
  }

  const currentStage = getCurrentStage(student);

  // ALL COMPLETED
  if (!currentStage) {
    return (
      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          border
          border-emerald-200
          bg-emerald-50
          px-5
          py-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-emerald-100
            "
          >
            <CheckCircle2
              className="
                h-5
                w-5
                text-emerald-700
              "
            />
          </div>

          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-emerald-700
              "
            >
              Current Stage
            </p>

            <h3
              className="
                text-lg
                font-bold
                text-slate-900
              "
            >
              Admission Completed
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const Icon = currentStage.icon;

  const value = student[currentStage.key];

  return (
    <div
      className="
      flex
      flex-wrap
      items-center
      justify-between
      gap-4
      rounded-2xl
      border
      border-slate-200
      bg-white
      px-5
      py-4
      shadow-sm
    "
    >
      {/* LEFT */}
      <div
        className="
        flex
        items-center
        gap-3
      "
      >
        <div
          className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-slate-100
        "
        >
          <Icon
            className="
            h-5
            w-5
            text-slate-600
          "
          />
        </div>

        <div>
          <p
            className="
            text-lg
            font-semibold
            text-slate-900
          "
          >
            {currentStage.label}
          </p>

          <p
            className="
            text-sm
            text-slate-500
          "
          >
            Update admission status
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <select
        value={value}
        onChange={(e) => updateStage(currentStage.key, e.target.value)}
        className="
        min-w-[220px]
        rounded-xl
        border
        border-slate-200
        bg-slate-50
        px-4
        py-3
        text-sm
        font-semibold
        text-slate-800
        outline-none
        transition-all
        focus:border-slate-400
        focus:bg-white
      "
      >
        {currentStage.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
