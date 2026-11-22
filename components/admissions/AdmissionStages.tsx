"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  GraduationCap,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { Admission } from "@/src/generated/prisma/client";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/ui/getApiErrorMessage";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";

type WorkflowField =
  | "application"
  | "entrance"
  | "interview"
  | "admissionGiven"
  | "finalAdmission";

type Stage = {
  key: WorkflowField;
  label: string;
  icon: typeof FileText;
  completedValues: string[];
  options: Array<{ label: string; value: string }>;
};

type Props = {
  student: Admission;
  reload: () => void;
  canManage: boolean;
};

const STAGES: Stage[] = [
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

function getCurrentStage(student: Admission) {
  for (const stage of STAGES) {
    const value = student[stage.key];

    if (!stage.completedValues.includes(value)) {
      return stage;
    }
  }

  return null;
}

export default function AdmissionStages({ student, reload, canManage }: Props) {
  const [saving, setSaving] = useState(false);
  async function updateStage(field: WorkflowField, value: string) {
    if (!canManage || saving || student[field] === value) return;
    setSaving(true);
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
        toast.error("Couldn’t update admission stage", {
          description: getApiErrorMessage(json, "Please check the workflow requirements and try again."),
        });
        return;
      }

      reload();
      toast.success("Admission stage updated", { description: `${student.enquiryNo} · ${field.replaceAll("_", " ")} set to ${value.replaceAll("_", " ")}` });
    } catch (error) {
      console.error(error);
      toast.error("Couldn’t save changes", { description: "Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  const currentStage = getCurrentStage(student);
  const currentIndex = currentStage ? STAGES.findIndex((stage) => stage.key === currentStage.key) : STAGES.length;

  if (!currentStage) {
    return (
      <div className="w-full rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200"><CheckCircle2 className="size-5" /></div>
          <div><p className="text-sm font-black text-slate-900">Admission completed</p><p className="mt-0.5 text-xs font-semibold text-emerald-700">All 5 milestones completed</p></div>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label="All admission stages complete">
          {STAGES.map((stage) => <span key={stage.key} title={stage.label} className="h-1.5 rounded-full bg-emerald-400" />)}
        </div>
      </div>
    );
  }

  const Icon = currentStage.icon;

  const value = student[currentStage.key];

  return (
    <div className="w-full rounded-2xl border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/60 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200"><Icon className="size-4" /></div>
        <div className="min-w-24 flex-1"><p className="truncate text-sm font-black text-slate-900">{currentStage.label}</p><p className="mt-0.5 whitespace-nowrap text-xs font-semibold text-slate-500">Step {currentIndex + 1} of {STAGES.length}</p></div>
         <div className="w-36 shrink-0">{canManage
          ? <SchoolDbSelect ariaLabel={`${currentStage.label} status`} value={value} onValueChange={(nextValue) => void updateStage(currentStage.key, nextValue)} options={currentStage.options} disabled={saving} className="font-bold" />
          : <span className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-slate-700" aria-label={`${currentStage.label} status`}>{currentStage.options.find((option) => option.value === value)?.label ?? value.replaceAll("_", " ")}</span>}</div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`${currentIndex} of ${STAGES.length} admission stages complete`}>
        {STAGES.map((stage, index) => <span key={stage.key} title={stage.label} className={`h-1.5 rounded-full ${index < currentIndex ? "bg-emerald-400" : index === currentIndex ? "bg-indigo-500" : "bg-slate-200"}`} />)}
      </div>
    </div>
  );
}
