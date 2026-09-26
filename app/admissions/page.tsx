"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, CircleDollarSign, GraduationCap, LayoutDashboard, Menu, Plus, Search, Users, X } from "lucide-react";
import KPISection from "@/components/admissions/KPISection";
import AdmissionsTable from "@/components/admissions/AdmissionsTable";
import AdmissionDetailModal from "@/components/admissions/AdmissionDetailModal";
import NewAdmissionModal from "@/components/admissions/NewAdmissionModal";
import { useAdmissions } from "@/hooks/useAdmissions";

const nav = [
  { label: "Admissions", href: "/admissions", icon: Users, active: true },
  { label: "Analytics", href: "/admissions/analytics", icon: BarChart3 },
  { label: "Fee Structure", href: "/fees", icon: CircleDollarSign },
];

export default function AdmissionsPage() {
  const { students, loading, error, reload } = useAdmissions();
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s: any) =>
      [s.student, s.parent, s.mobile, s.enquiryNo, s.admClass].some((value) =>
        String(value ?? "").toLowerCase().includes(q),
      ),
    );
  }, [students, search]);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 border-r border-white/10 bg-[#091540] text-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#091540]"><GraduationCap className="h-6 w-6" /></div>
          <div><p className="text-lg font-bold tracking-tight">SchoolDB</p><p className="text-xs text-blue-200">Admissions Console</p></div>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {nav.map(({ label, href, icon: Icon, active }) => (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${active ? "bg-white text-[#091540] shadow-lg" : "text-blue-100 hover:bg-white/10 hover:text-white"}`}>
              <Icon className="h-5 w-5" />{label}
            </Link>
          ))}
        </nav>
        <div className="m-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold">Admission cycle</p>
          <p className="mt-1 text-xs leading-5 text-blue-200">Track every enquiry from first contact through final admission.</p>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-50 bg-[#091540] p-6 text-white lg:hidden">
        <div className="mb-8 flex items-center justify-between"><span className="text-xl font-bold">SchoolDB</span><button onClick={() => setMobileNav(false)}><X /></button></div>
        <nav className="space-y-2">{nav.map(({label,href,icon:Icon}) => <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 font-semibold"><Icon className="h-5 w-5"/>{label}</Link>)}</nav>
      </div>}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 xl:px-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileNav(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden"><Menu className="h-5 w-5"/></button>
              <div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Admissions</h1><p className="hidden text-sm text-slate-500 sm:block">Enquiries, eligibility and admission workflow</p></div>
            </div>
            <button onClick={() => setOpenNew(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#091540] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 sm:px-5"><Plus className="h-4 w-4"/>New enquiry</button>
          </div>
        </header>

        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="overflow-hidden rounded-[32px] bg-[#091540] p-6 text-white shadow-xl shadow-slate-200 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">2026–27 ADMISSION DESK</span><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">A clear view of every prospective student.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Move enquiries through application, entrance, interview and confirmation without losing the parent conversation.</p></div>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="text-xs text-blue-200">Total enquiries</p><p className="mt-1 text-2xl font-bold">{students.length}</p></div>
                <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="text-xs text-blue-200">Admitted</p><p className="mt-1 text-2xl font-bold">{students.filter((s:any)=>s.finalAdmission==="ADMITTED").length}</p></div>
              </div>
            </div>
          </section>

          <KPISection students={students} />

          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div><h3 className="text-lg font-bold">Admission pipeline</h3><p className="text-sm text-slate-500">{filteredStudents.length} records shown</p></div>
              <div className="relative w-full md:max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search enquiry, student, parent, mobile or class" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></div>
            </div>
          </section>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

          <AdmissionsTable students={filteredStudents} loading={loading} search={search} setSearch={setSearch} onView={(student)=>{setSelectedStudent(student);setOpenDetail(true);}} reload={reload} />
        </main>
      </div>

      <AdmissionDetailModal student={selectedStudent} open={openDetail} onClose={() => setOpenDetail(false)} />
      <NewAdmissionModal open={openNew} onClose={() => setOpenNew(false)} reload={reload} />
    </div>
  );
}
