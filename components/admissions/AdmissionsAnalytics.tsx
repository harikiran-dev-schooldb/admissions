"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { TrendingUp, Users, GraduationCap } from "lucide-react";

interface Props {
  students: any[];
}

const COLORS = ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"];

export default function AdmissionsAnalytics({ students }: Props) {
  /*
    FUNNEL
  */

  const funnelData = [
    {
      name: "Enquiries",
      value: students.length,
    },

    {
      name: "Applications",
      value: students.filter((s) => s.application !== "NO").length,
    },

    {
      name: "Entrance",
      value: students.filter((s) => s.entrance === "PASS").length,
    },

    {
      name: "Interview",
      value: students.filter((s) => s.interview === "SELECTED").length,
    },

    {
      name: "Admitted",
      value: students.filter((s) => s.finalAdmission === "ADMITTED").length,
    },
  ];

  /*
    CLASS WISE
  */

  const classMap: Record<string, number> = {};

  students.forEach((s) => {
    classMap[s.admClass] = (classMap[s.admClass] || 0) + 1;
  });

  const classData = Object.entries(classMap).map(([name, value]) => ({
    name,
    value,
  }));

  /*
    CONVERSION
  */

  const admitted = students.filter(
    (s) => s.finalAdmission === "ADMITTED",
  ).length;

  const conversion =
    students.length > 0 ? ((admitted / students.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* TOP CARDS */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-lg
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Conversion Rate
              </p>

              <h2 className="mt-2 text-4xl font-bold text-slate-900">
                {conversion}%
              </h2>
            </div>

            <div
              className="
                rounded-2xl
                bg-green-100
                p-4
                text-green-700
              "
            >
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-lg
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Enquiries
              </p>

              <h2 className="mt-2 text-4xl font-bold text-slate-900">
                {students.length}
              </h2>
            </div>

            <div
              className="
                rounded-2xl
                bg-blue-100
                p-4
                text-blue-700
              "
            >
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-lg
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Admitted</p>

              <h2 className="mt-2 text-4xl font-bold text-slate-900">
                {admitted}
              </h2>
            </div>

            <div
              className="
                rounded-2xl
                bg-purple-100
                p-4
                text-purple-700
              "
            >
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* FUNNEL */}

        <div
          className="
            min-w-0
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-lg
          "
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Admission Funnel
            </h3>

            <p className="text-sm text-slate-500">
              Workflow conversion tracking
            </p>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CLASS WISE */}

        <div
          className="
            min-w-0
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-lg
          "
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Class Wise Enquiries
            </h3>

            <p className="text-sm text-slate-500">Distribution by class</p>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={classData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {classData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
