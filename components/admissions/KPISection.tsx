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
import type { Admission } from "@/src/generated/prisma/client";

interface Props {
  students: Admission[];
}

export default function KPISection({ students }: Props) {
  const enquiries = students.length;

  const applicationsTaken = students.filter(
    (s) => s.application === "YES",
  ).length;

  const applicationsSubmitted = students.filter(
    (s) => s.application === "SUBMITTED",
  ).length;

  const entrancePassed = students.filter((s) => s.entrance === "PASS").length;

  const interviewSelected = students.filter(
    (s) => s.interview === "SELECTED",
  ).length;

  const admitted = students.filter(
    (s) => s.finalAdmission === "ADMITTED",
  ).length;

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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const progress = enquiries ? Math.round((card.value / enquiries) * 100) : 0;

        return (
          <div
            key={card.title}
            className={`metric-card bg-gradient-to-br ${card.wash} to-white rounded-[22px] px-4 py-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.08em] text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-[-.04em] text-slate-950">
                  {card.value}
                </h2>
              </div>

              <div
                className={`
                  flex h-10 w-10 items-center justify-center
                  rounded-2xl
                  ${card.bg}
                  ${card.color}
                `}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80"><div className={`h-full rounded-full ${card.rail} transition-all duration-500`} style={{ width: `${progress}%` }} /></div>
              <span className="min-w-9 text-right text-xs font-black text-slate-500">{progress}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
