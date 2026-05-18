"use client";

import AdmissionFilters from "@/src/components/admissions/AdmissionFilters";
import AdmissionsTable from "@/src/components/admissions/AdmissionsTable";
import { useAdmissions } from "@/src/hooks/useAdmissions";
import { useMemo, useState } from "react";

export default function AdmissionsPage() {
  const { students, loading } = useAdmissions();

  const [search, setSearch] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      return `${s.student} ${s.parent} ${s.mobile}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [students, search]);

  if (loading) {
    return <div className="p-10">Loading admissions...</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Admissions Dashboard</h1>
      </div>

      <AdmissionFilters search={search} setSearch={setSearch} />

      <AdmissionsTable students={filteredStudents} />
    </div>
  );
}
