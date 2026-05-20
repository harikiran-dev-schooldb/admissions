// app/admissions/page.tsx

"use client";

import { useMemo, useState } from "react";

import AdmissionsHeader from "@/components/admissions/AdmissionsHeader";
import KPISection from "@/components/admissions/KPISection";

import AdmissionsTable from "@/components/admissions/AdmissionsTable";

import { useAdmissions } from "@/hooks/useAdmissions";
import AdmissionsFilters from "@/components/admissions/AdmissionFilters";

export default function AdmissionsPage() {
  const { students, loading } = useAdmissions();

  const [search, setSearch] = useState("");

  const [isFullScreen, setIsFullScreen] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      return `${s.student} ${s.parent} ${s.mobile}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [students, search]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-900 ${
        isFullScreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <AdmissionsHeader
        total={students.length}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      />

      <main className="space-y-6 p-6">
        <KPISection students={students} />

        <AdmissionsFilters search={search} setSearch={setSearch} />

        <AdmissionsTable
          students={filteredStudents}
          onSelect={(student) => {
            console.log(student);
          }}
        />
      </main>
    </div>
  );
}
