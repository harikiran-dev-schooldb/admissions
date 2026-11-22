"use client";

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import type { AdmissionAnalyticsSummary } from "@/lib/admissions/analyticsSummary";

const COLORS = ["#4f46e5", "#7c3aed", "#10b981", "#f59e0b", "#0ea5e9", "#ec4899"];

export default function AdmissionsAnalytics({ summary }: { summary: AdmissionAnalyticsSummary }) {
  const { funnelData, classData } = summary;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="premium-panel min-w-0 rounded-[28px] p-5 sm:p-6" aria-label="Admission funnel chart">
        <div className="mb-6">
          <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Admission funnel</h3>
          <p className="mt-1 text-sm text-slate-500">Workflow progress across the selected cohort</p>
        </div>
        <div className="h-[285px] sm:h-[320px]">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={funnelData} margin={{ top: 10, right: 12, left: -18, bottom: 10 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => Number(value).toLocaleString("en-IN")} />
              <Bar dataKey="value" name="Enquiries" radius={[8, 8, 0, 0]} fill="#4f46e5" maxBarSize={62} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="premium-panel min-w-0 rounded-[28px] p-5 sm:p-6" aria-label="Class distribution chart">
        <div className="mb-6">
          <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Class-wise enquiries</h3>
          <p className="mt-1 text-sm text-slate-500">Students grouped by applied class</p>
        </div>
        <div className="h-[285px] sm:h-[320px]">
          <ResponsiveContainer width="99%" height="100%">
            <PieChart>
              <Pie data={classData} dataKey="value" nameKey="name"
                innerRadius={45} outerRadius={105} paddingAngle={2} label={classData.length <= 6}>
                {classData.map((item, index) => (
                  <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value).toLocaleString("en-IN")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {classData.length > 6 && (
          <p className="mt-1 text-center text-xs font-medium text-slate-500">Hover or tap chart segments to see each class.</p>
        )}
      </section>
    </div>
  );
}
