"use client";

import {
  CheckCircle2,
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

    completedValues: ["SUBMITTED"],

    options: [
      {
        label: "NO",
        value: "NO",
      },

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

  // COMPLETED
  if (!currentStage) {
    return (
      <div
        className="
          inline-flex
          items-center
          gap-3
          rounded-2xl
          border
          border-emerald-200
          bg-emerald-50
          px-4
          py-3
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
              text-base
              font-semibold
              text-slate-900
            "
          >
            Admission Completed
          </p>

          <p
            className="
              text-xs
              text-emerald-700
            "
          >
            Student admitted
          </p>
        </div>
      </div>
    );
  }

  const Icon = currentStage.icon;

  const value = student[currentStage.key];

  return (
    <div
      className="
      inline-flex
      items-center
      gap-2
      rounded-2xl
      border
      border-slate-200
      bg-white
      px-3
      py-2.5
      shadow-sm
    "
    >
      <div
        className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-xl
        bg-slate-100
      "
      >
        <Icon
          className="
          h-4
          w-4
          text-slate-600
        "
        />
      </div>

      <div className="min-w-0">
        <p
          className="
          text-sm
          font-semibold
          text-slate-900
          leading-none
        "
        >
          {currentStage.label}
        </p>

        <p
          className="
          mt-1
          text-[11px]
          text-slate-500
          leading-none
        "
        >
          Update status
        </p>
      </div>

      <select
        value={value}
        onChange={(e) => updateStage(currentStage.key, e.target.value)}
        className="
        w-[120px]
        rounded-lg
        border
        border-slate-200
        bg-slate-50
        px-2.5
        py-2
        text-sm
        font-semibold
        text-slate-800
        outline-none
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
