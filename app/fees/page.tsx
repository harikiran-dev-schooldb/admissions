"use client";

import { useMemo, useState } from "react";

import FeesHeader from "@/components/fees/FeesHeader";

import { useFees } from "@/hooks/useFees";
import FeesKPISection from "@/components/fees/FeesKPISection";
import FeesTable from "@/components/fees/FeesTable";
import FeeDetailModal from "@/components/fees/FeeDetailModal";
import NewFeeModal from "@/components/fees/NewFeeModal";

export default function FeesPage() {
  const { fees, loading } = useFees();

  const [search, setSearch] = useState("");

  const [openNew, setOpenNew] = useState(false);

  const [isFullScreen, setIsFullScreen] = useState(false);

  const [selectedFee, setSelectedFee] = useState<any>(null);

  const [open, setOpen] = useState(false);

  const filteredFees = useMemo(() => {
    return fees.filter((f: any) => {
      return `
        ${f.className}
        ${f.academicYear}
        ${f.term}
        ${f.age || ""}
      `
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [fees, search]);

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
        to-emerald-50
        text-slate-900
        ${isFullScreen ? "fixed inset-0 z-50 overflow-auto" : ""}
      `}
    >
      <FeesHeader
        total={fees.length}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        onOpenNew={() => setOpenNew(true)}
      />

      <main className="space-y-6 p-6">
        <FeesKPISection fees={fees} />

        <FeesTable
          fees={filteredFees}
          loading={loading}
          search={search}
          setSearch={setSearch}
          onView={(fee) => {
            setSelectedFee(fee);

            setOpen(true);
          }}
          reload={() => window.location.reload()}
        />

        <FeeDetailModal
          fee={selectedFee}
          open={open}
          onClose={() => setOpen(false)}
        />

        <NewFeeModal
          open={openNew}
          onClose={() => setOpenNew(false)}
          reload={() => window.location.reload()}
        />
      </main>
    </div>
  );
}
