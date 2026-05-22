"use client";

import { useMemo, useState } from "react";

import AdmissionsHeader from "@/components/admissions/AdmissionsHeader";

import KPISection from "@/components/admissions/KPISection";

import AdmissionsTable from "@/components/admissions/AdmissionsTable";

import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";

import { useAdmissions } from "@/hooks/useAdmissions";
import NewAdmissionModal from "@/components/admissions/NewAdmissionModal";
import PipelineBoard from "@/components/admissions/PipelineBoard";
import AdmissionsAnalytics from "@/components/admissions/AdmissionsAnalytics";

export default function AdmissionsPage() {
  const { students, loading } = useAdmissions();

  const [search, setSearch] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [open, setOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      return `${s.student} ${s.parent} ${s.mobile}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [students, search]);

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-slate-100
          text-slate-900
        "
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`
        min-h-screen
        bg-gradient-to-br
        from-slate-100
        via-slate-50
        to-blue-50
        text-slate-900
        ${isFullScreen ? "fixed inset-0 z-50 overflow-auto" : ""}
      `}
    >
      <AdmissionsHeader
        total={students.length}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      />

      <main className="space-y-6 p-6">
        <div className="flex justify-end">
          <button
            onClick={() => setOpenNew(true)}
            className="
      rounded-2xl
      bg-blue-600
      px-6
      py-3
      text-sm
      font-bold
      text-white
      shadow-lg
      shadow-blue-200
      transition-all
      hover:scale-105
      hover:bg-blue-700
    "
          >
            + New Admission
          </button>
        </div>
        <KPISection students={students} />

        <AdmissionsTable
          students={filteredStudents}
          loading={loading}
          search={search}
          setSearch={setSearch}
          onView={(student) => {
            setSelectedStudent(student);

            setOpen(true);
          }}
          reload={() => window.location.reload()}
        />

        <AdmissionDetailModal
          student={selectedStudent}
          open={open}
          onClose={() => setOpen(false)}
        />

        <NewAdmissionModal
          open={openNew}
          onClose={() => setOpenNew(false)}
          reload={() => window.location.reload()}
        />

        <AdmissionsAnalytics students={students} />
      </main>
    </div>
  );
}
