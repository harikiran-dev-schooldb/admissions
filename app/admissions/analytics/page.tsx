"use client";

import dynamic from "next/dynamic";

import AdmissionsHeader from "@/components/admissions/AdmissionsHeader";

import { useAdmissions } from "@/hooks/useAdmissions";

const AdmissionsAnalytics = dynamic(
  () => import("@/components/admissions/AdmissionsAnalytics"),
  {
    ssr: false,
  },
);

export default function AdmissionsAnalyticsPage() {
  const { students, loading } = useAdmissions();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        Loading analytics...
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-100
        via-slate-50
        to-blue-50
      "
    >
      <AdmissionsHeader
        total={students.length}
        isFullScreen={false}
        onToggleFullScreen={() => {}}
        onOpenNew={() => {}}
      />

      <main className="p-6">
        <AdmissionsAnalytics students={students} />
      </main>
    </div>
  );
}
