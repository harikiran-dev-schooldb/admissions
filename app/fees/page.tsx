"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp, IndianRupee, Plus, Sparkles, X } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import FeeDetailModal from "@/components/fees/FeeDetailModal";
import FeesKPISection from "@/components/fees/FeesKPISection";
import FeesTable from "@/components/fees/FeesTable";
import NewFeeModal from "@/components/fees/NewFeeModal";
import { useFees } from "@/hooks/useFees";
import type { FeeRecord } from "@/src/generated/prisma/client";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AccessNotice from "@/components/ui/AccessNotice";
import { useAccess } from "@/hooks/useAccess";
import { getFeeYearOptions, selectDefaultFeeYear } from "@/lib/fees/selectFeeYear";
import { toast } from "sonner";

export default function FeesPage() {
  const { role, canManage, error: accessError } = useAccess();
  const { fees, loading, error, reload } = useFees();
  const { academicYears: managedAcademicYears, loading: yearsLoading, error: yearsError } = useAcademicYears();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [ageFilter, setAgeFilter] = useState("ALL");
  const [openNew, setOpenNew] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [deletingFee, setDeletingFee] = useState<FeeRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [linkedClass, setLinkedClass] = useState<{ year: string; className: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get("year")?.trim();
    const className = params.get("class")?.trim();
    if (year && /^\d{4}-\d{2}$/.test(year) && className && className.length <= 30) {
      setSelectedAcademicYear(year);
      setClassFilter(className);
      setLinkedClass({ year, className });
    }
  }, []);

  function clearAdmissionContext() {
    setLinkedClass(null);
    setClassFilter("ALL");
    setAgeFilter("ALL");
    window.history.replaceState(window.history.state, "", "/fees");
  }
  // Include archived years and legacy FeeRecord years; never hide historical fees.
  const academicYears = useMemo(() => getFeeYearOptions(managedAcademicYears, fees), [managedAcademicYears, fees]);
  const activeAcademicYears = useMemo(() => managedAcademicYears.filter((year) => year.isActive).map((year) => year.academicYear), [managedAcademicYears]);
  const academicYear = linkedClass && !academicYears.includes(linkedClass.year) ? linkedClass.year : selectDefaultFeeYear(managedAcademicYears, fees, selectedAcademicYear);
  const selectedYearIsActive = activeAcademicYears.includes(academicYear);
  const yearFees = useMemo(() => fees.filter((fee) => fee.academicYear === academicYear), [fees, academicYear]);
  const classOptions = useMemo(() => [...new Set(yearFees.map((fee) => fee.className).filter(Boolean))].sort(), [yearFees]);
  const ageOptions = useMemo(() => [...new Set(yearFees.map((fee) => fee.age).filter((age): age is string => Boolean(age)))].sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b)), [yearFees]);
  const filteredFees = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = yearFees.filter((fee) => {
      const matchesSearch = !query || [fee.className, fee.termFee, fee.annualFees, fee.age].some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesSearch && (classFilter === "ALL" || fee.className.trim().toLowerCase() === classFilter.trim().toLowerCase()) && (ageFilter === "ALL" || fee.age === ageFilter);
    });

    return [...matches].sort((a, b) => {
      const ageA = Number.parseFloat(a.age ?? "");
      const ageB = Number.parseFloat(b.age ?? "");
      const safeAgeA = Number.isFinite(ageA) ? ageA : Number.POSITIVE_INFINITY;
      const safeAgeB = Number.isFinite(ageB) ? ageB : Number.POSITIVE_INFINITY;
      return safeAgeA - safeAgeB || a.className.localeCompare(b.className, undefined, { numeric: true });
    });
  }, [ageFilter, classFilter, search, yearFees]);
  const annualTotal = yearFees.reduce((total, fee) => total + fee.annualFees, 0);

  async function deleteFee() {
    if (!deletingFee) return;
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/fees/${deletingFee.id}`, { method: "DELETE" });
      if (!response.ok) { const json = await response.json(); throw new Error(json.error || "Failed to delete fee structure"); }
      setDeletingFee(null);
      await reload();
      toast.success("Fee structure deleted");
    } catch (caught) {
      toast.error("Couldn’t delete fee structure", { description: caught instanceof Error ? caught.message : "Please try again." });
    } finally { setDeleteLoading(false); }
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10"><div><p className="premium-kicker">Admissions configuration</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Fee structure</h1></div><div className="flex items-center gap-3"><div className="w-36"><SchoolDbSelect ariaLabel="Fee academic year" value={academicYear || undefined} onValueChange={(value) => { setSelectedAcademicYear(value); setLinkedClass(null); setClassFilter("ALL"); setAgeFilter("ALL"); }} options={academicYears.map((year) => ({ label: `${year}${!activeAcademicYears.includes(year) ? " · Archived" : ""}`, value: year }))} placeholder={yearsLoading ? "Loading…" : "No academic years"} disabled={yearsLoading || academicYears.length === 0} className="font-bold" /></div>{canManage && <button onClick={() => setOpenNew(true)} disabled={!academicYear || !selectedYearIsActive} className="premium-button h-11 px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"><Plus className="size-4" /><span className="hidden sm:inline">Add fee</span><span className="sm:hidden">Add</span></button>}<div className="hidden border-l border-slate-200 pl-3 lg:block"><AccountMenu /></div></div></div>
        </header>
        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <AccessNotice role={role} error={accessError} />
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="premium-kicker flex items-center gap-2"><Sparkles className="size-3.5" />Academic fee master</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">Clear fee structures for every admission class.</h2><p className="mt-3 text-base leading-7">Keep term and annual amounts consistent, searchable and ready for the admissions team.</p></div>{canManage && <div className="hero-stat flex items-center gap-4 rounded-2xl p-4"><div className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"><IndianRupee className="size-5" /></div><div><p className="text-sm font-semibold">Annual fee value</p><strong className="mt-1 block text-2xl font-black">₹{annualTotal.toLocaleString("en-IN")}</strong></div></div>}</div>
          </section>
          {(error || yearsError) && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{yearsError || error}</div>}
          {linkedClass && (
            <section className="flex flex-col gap-3 rounded-[22px] border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Admission fee lookup">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white"><IndianRupee className="size-5" /></span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Linked from an admission</p>
                  <h3 className="mt-1 text-base font-black text-slate-900">{linkedClass.className} · {linkedClass.year}</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {loading ? "Checking this class…" : filteredFees.length > 0 ? "The matching class fee is shown below." : "No fee structure is configured for this class and year."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admissions" className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                  <ArrowLeft className="size-4" /> Admissions
                </Link>
                <button type="button" onClick={clearAdmissionContext} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <X className="size-4" /> Show all fees
                </button>
              </div>
            </section>
          )}
          {!canManage && <p className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"><CircleHelp className="size-4 text-indigo-500" /> Fee structures are view-only for staff. Payments and balances are not recorded here.</p>}
          {academicYear && <p className="text-sm font-semibold text-slate-500">Showing {yearFees.length} fee structures for {academicYear}.{!selectedYearIsActive && " Historical academic year — new fees can only be added to an active year."}</p>}
          {canManage && <FeesKPISection fees={yearFees} />}
          <FeesTable canManage={canManage} fees={filteredFees} loading={loading} search={search} setSearch={setSearch} classFilter={classFilter} setClassFilter={setClassFilter} classOptions={classOptions} ageFilter={ageFilter} setAgeFilter={setAgeFilter} ageOptions={ageOptions} onView={(fee) => { setSelectedFee(fee); setOpen(true); }} onEdit={setEditingFee} onDelete={setDeletingFee} />
        </main>
      </div>
      <FeeDetailModal fee={selectedFee} open={open} onClose={() => setOpen(false)} />
      {canManage && <NewFeeModal key={editingFee?.id ?? academicYear} open={openNew || Boolean(editingFee)} onClose={() => { setOpenNew(false); setEditingFee(null); }} reload={reload} defaultAcademicYear={editingFee?.academicYear ?? academicYear} academicYears={editingFee ? [...new Set([editingFee.academicYear, ...activeAcademicYears])] : activeAcademicYears} fee={editingFee} />}
      {canManage && <ConfirmDialog open={Boolean(deletingFee)} title="Delete fee structure?" description={`${deletingFee?.className ?? "This class"} for ${deletingFee?.academicYear ?? academicYear} will be permanently removed.`} loading={deleteLoading} onCancel={() => setDeletingFee(null)} onConfirm={deleteFee} />}
    </div>
  );
}
