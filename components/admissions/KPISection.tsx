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

interface Props {
  students: any[];
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
    (s) => s.finalAdmission === "CONFIRMED",
  ).length;

  const cards = [
    {
      title: "Enquiries",
      value: enquiries,
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-100",
    },
    {
      title: "Applications",
      value: applicationsTaken,
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      title: "Submitted",
      value: applicationsSubmitted,
      icon: ClipboardCheck,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Entrance",
      value: entrancePassed,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Interview",
      value: interviewSelected,
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Admitted",
      value: admitted,
      icon: CheckCircle2,
      color: "text-pink-600",
      bg: "bg-pink-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="
              rounded-2xl
              border border-slate-200/70
              bg-white
              px-4 py-3
              shadow-sm
              transition-all
              hover:-translate-y-0.5
              hover:shadow-md
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </h2>
              </div>

              <div
                className={`
                  flex h-10 w-10 items-center justify-center
                  rounded-xl
                  ${card.bg}
                  ${card.color}
                `}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
