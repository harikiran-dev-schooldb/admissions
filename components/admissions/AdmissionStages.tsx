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

function pillClass(value: string) {
  switch (value) {
    case "YES":
    case "PASS":
    case "SELECTED":
    case "GIVEN":
    case "ADMITTED":
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

    case "NOT_REQUIRED":
      return `
        bg-sky-100
        text-sky-700
        border-sky-200
      `;

    default:
      return `
        bg-slate-100
        text-slate-700
        border-slate-200
      `;
  }
}

function StageSelect({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: any;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          min-w-[170px]
          px-4
          py-3
          rounded-2xl
          text-sm
          font-semibold
          border
          shadow-sm
          backdrop-blur-xl
          appearance-none
          transition-all
          duration-200
          hover:shadow-lg
          hover:-translate-y-0.5
          focus:outline-none
          ${pillClass(value)}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function AdmissionStages({ student, reload }: Props) {
  async function updateStage(field: string, value: string) {
    try {
      const res = await fetch("/api/admissions/stage", {
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

  return (
    <div
      className="
        flex
        flex-wrap
        gap-5
        rounded-3xl
        border
        border-slate-200
        bg-slate-50/80
        p-5
      "
    >
      <StageSelect
        label="Application"
        icon={FileText}
        value={student.application}
        onChange={(value) => updateStage("application", value)}
        options={[
          { label: "YES", value: "YES" },
          {
            label: "SUBMITTED",
            value: "SUBMITTED",
          },
        ]}
      />

      <StageSelect
        label="Entrance"
        icon={GraduationCap}
        value={student.entrance}
        onChange={(value) => updateStage("entrance", value)}
        options={[
          {
            label: "NOT STARTED",
            value: "NOT_STARTED",
          },
          {
            label: "PENDING",
            value: "PENDING",
          },
          { label: "PASS", value: "PASS" },
          { label: "FAIL", value: "FAIL" },
          {
            label: "NOT REQUIRED",
            value: "NOT_REQUIRED",
          },
        ]}
      />

      <StageSelect
        label="Interview"
        icon={UserCheck}
        value={student.interview}
        onChange={(value) => updateStage("interview", value)}
        options={[
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
        ]}
      />

      <StageSelect
        label="Admission Given"
        icon={ShieldCheck}
        value={student.admissionGiven}
        onChange={(value) => updateStage("admissionGiven", value)}
        options={[
          {
            label: "NOT GIVEN",
            value: "NOT_GIVEN",
          },
          {
            label: "GIVEN",
            value: "GIVEN",
          },
        ]}
      />

      <StageSelect
        label="Final Admission"
        icon={CheckCircle2}
        value={student.finalAdmission}
        onChange={(value) => updateStage("finalAdmission", value)}
        options={[
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
        ]}
      />
    </div>
  );
}
