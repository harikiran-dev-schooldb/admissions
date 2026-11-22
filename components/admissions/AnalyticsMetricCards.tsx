"use client";

import { GraduationCap, TrendingUp, Users } from "lucide-react";
import type { AdmissionAnalyticsSummary } from "@/lib/admissions/analyticsSummary";

export default function AnalyticsMetricCards({ summary }: { summary: AdmissionAnalyticsSummary }) {
  const cards = [
    { title: "Conversion rate", value: `${summary.conversionRate.toFixed(1)}%`, note: "Admitted / total enquiries", icon: TrendingUp, color: "text-emerald-700 bg-emerald-100" },
    { title: "Total enquiries", value: summary.total.toLocaleString("en-IN"), note: "For selected filters", icon: Users, color: "text-indigo-700 bg-indigo-100" },
    { title: "Admitted", value: summary.admitted.toLocaleString("en-IN"), note: "Confirmed admissions", icon: GraduationCap, color: "text-violet-700 bg-violet-100" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Admission analytics summary">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <section key={item.title} className="metric-card flex min-h-[145px] items-center justify-between gap-3 rounded-[24px] p-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">{item.title}</p>
              <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-slate-950 sm:text-4xl">{item.value}</p>
              <p className="mt-2 text-xs text-slate-500">{item.note}</p>
            </div>
            <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${item.color}`}><Icon className="size-6" /></span>
          </section>
        );
      })}
    </div>
  );
}
