// src/components/admissions/KPISection.tsx

"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Users,
  UserCheck,
} from "lucide-react";
import type { AdmissionSummary } from "@/hooks/useAdmissionsDirectory";

interface Props {
  stats: AdmissionSummary;
  loading?: boolean;
}

export default function KPISection({ stats, loading = false }: Props) {
  const enquiries = stats.total;
  const applicationsTaken = stats.applicationsTaken;
  const applicationsSubmitted = stats.applicationSubmitted;
  const entrancePassed = stats.entrancePassed;
  const interviewSelected = stats.interviewSelected;
  const admitted = stats.admitted;

  const cards = [
    {
      title: "Enquiries",
      value: enquiries,
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-100",
      rail: "bg-sky-500",
      wash: "from-sky-50/80",
    },
    {
      title: "Applications",
      value: applicationsTaken,
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
      rail: "bg-indigo-500",
      wash: "from-indigo-50/80",
    },
    {
      title: "Submitted",
      value: applicationsSubmitted,
      icon: ClipboardCheck,
      color: "text-amber-600",
      bg: "bg-amber-100",
      rail: "bg-amber-500",
      wash: "from-amber-50/80",
    },
    {
      title: "Entrance",
      value: entrancePassed,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      rail: "bg-emerald-500",
      wash: "from-emerald-50/80",
    },
    {
      title: "Interview",
      value: interviewSelected,
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-100",
      rail: "bg-purple-500",
      wash: "from-purple-50/80",
    },
    {
      title: "Admitted",
      value: admitted,
      icon: CheckCircle2,
      color: "text-pink-600",
      bg: "bg-pink-100",
      rail: "bg-pink-500",
      wash: "from-pink-50/80",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Admissions funnel">
      {cards.map((card) => {
        const Icon = card.icon;
        const progress = enquiries ? Math.min(100, Math.max(0, Math.round((card.value / enquiries) * 100))) : 0;
        return (
          <div
            key={card.title}
            className={`metric-card min-w-0 rounded-[20px] bg-gradient-to-br ${card.wash} to-white px-3.5 py-4 sm:px-4 ${card.title === "Admitted" ? "border-emerald-200/80 ring-1 ring-emerald-100" : ""}`}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <p className="min-w-0 text-[11px] font-extrabold uppercase tracking-[.07em] text-slate-500 sm:text-xs">{card.title}</p>
              <div className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${card.bg} ${card.color}`} aria-hidden="true">
                <Icon className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-[32px] font-black leading-none tracking-[-.045em] tabular-nums text-slate-950 sm:text-4xl" aria-label={`${card.title}: ${loading ? "Loading" : card.value.toLocaleString("en-IN")}`}>
              {loading ? "…" : card.value.toLocaleString("en-IN")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-label={`${card.title} percentage of enquiries`} aria-valuenow={loading ? undefined : progress} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${card.rail} transition-[width] duration-500`} style={{ width: loading ? "0%" : `${progress}%` }} />
              </div>
              <span className="min-w-9 text-right text-[11px] font-extrabold tabular-nums text-slate-500">{loading ? "…" : `${progress}%`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
