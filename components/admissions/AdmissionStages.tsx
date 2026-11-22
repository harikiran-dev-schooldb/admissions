"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  XCircle,
  FileText,
  GraduationCap,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { Admission } from "@/src/generated/prisma/client";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/ui/getApiErrorMessage";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { getAdmissionStageView } from "@/lib/admissionTransitionRules";

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

export default function AdmissionStages({ student, reload, canManage }: Props) {
  const [saving, setSaving] = useState(false);

  async function updateStage(field: WorkflowField, value: string) {
    if (!canManage || saving || student[field] === value) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admissions/stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: student.id, field, value }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error("Couldn’t update admission stage", {
          description: getApiErrorMessage(json, "Please check the workflow requirements and try again."),
        });
        // A 409 can also mean the record was changed elsewhere. Refresh so
        // the dropdown reflects the database rather than stale row data.
        if (res.status === 409 || res.status === 404) reload();
        return;
      }
      reload();
      toast.success(value === "PENDING" && field === "finalAdmission" ? "Enquiry reopened" : "Admission stage updated", {
        description: `${student.enquiryNo} · ${field.replaceAll("_", " ")} → ${value.replaceAll("_", " ")}`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Couldn’t save changes", { description: "Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  const view = getAdmissionStageView(student);
  const isClosed = view.kind !== "active";
  const legacyInconsistent = view.kind === "admitted" && (
    student.application !== "SUBMITTED" ||
    !["PASS", "NOT_REQUIRED"].includes(student.entrance) ||
    student.interview !== "SELECTED" ||
    student.admissionGiven !== "GIVEN"
  );

  if (isClosed) {
    const admitted = view.kind === "admitted";
    return (
      <div className={`w-full rounded-2xl border p-3.5 ${admitted
        ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50"
        : "border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50"}`}>
        <div className="flex items-center gap-3">
          <div className={`grid size-10 shrink-0 place-items-center rounded-xl text-white ${admitted ? "bg-emerald-600" : "bg-rose-600"}`}>
            {admitted ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900">{admitted ? "Admission confirmed" : "Admission cancelled"}</p>
            <p className={`mt-0.5 text-xs font-semibold ${admitted ? "text-emerald-700" : "text-rose-700"}`}>Final decision recorded</p>
          </div>
          {canManage && (
            <button type="button" disabled={saving} onClick={() => void updateStage("finalAdmission", "PENDING")}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
              Reopen
            </button>
          )}
        </div>
        {legacyInconsistent && (
          <p className="mt-2 text-[11px] font-medium leading-4 text-amber-800">
            Imported stage history is incomplete; the saved final decision is shown without modifying the record.
          </p>
        )}
        <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label={admitted ? "Final admission confirmed" : "Admission closed"}>
          {STAGES.map((stage, index) => (
            <span key={stage.key} title={stage.label}
              className={`h-1.5 rounded-full ${admitted ? "bg-emerald-400" : index === 4 ? "bg-rose-500" : "bg-slate-200"}`} />
          ))}
        </div>
      </div>
    );
  }

  const currentStage = STAGES[view.index];
  const Icon = currentStage.icon;
  const value = student[currentStage.key];
  const guidance: Record<WorkflowField, string> = {
    application: "Mark Submitted to continue to entrance verification.",
    entrance: "Record Pass or Not Required to move to interview.",
    interview: "Select the student to review admission approval.",
    admissionGiven: "Mark Given only after the interview is selected.",
    finalAdmission: "Confirm the final admission decision.",
  };

  return (
    <div className="w-full rounded-2xl border border-indigo-100 bg-gradient-to-r from-white to-indigo-50/60 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200">
          <Icon className="size-4" />
        </div>
        <div className="min-w-24 flex-1">
          <p className="truncate text-sm font-black text-slate-900">{currentStage.label}</p>
          <p className="mt-0.5 whitespace-nowrap text-xs font-semibold text-slate-500">Step {view.index + 1} of {STAGES.length}</p>
        </div>
        <div className="w-36 shrink-0">
          {canManage ? (
            <SchoolDbSelect ariaLabel={`${currentStage.label} status`} value={value} disabled={saving}
              onValueChange={(next) => void updateStage(currentStage.key, next)}
              options={currentStage.options} className="font-bold" />
          ) : (
            <span className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-slate-700" aria-label={`${currentStage.label} status`}>
              {currentStage.options.find((option) => option.value === value)?.label ?? value.replaceAll("_", " ")}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`${view.index} of ${STAGES.length} admission stages complete`}>
        {STAGES.map((stage, index) => (
          <span key={stage.key} title={stage.label}
            className={`h-1.5 rounded-full ${index < view.index ? "bg-emerald-400" : index === view.index ? "bg-indigo-500" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">{saving ? "Saving stage…" : guidance[currentStage.key]}</p>
    </div>
  );
}
