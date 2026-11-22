"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccess } from "@/hooks/useAccess";
import { BarChart3, CalendarRange, CircleDollarSign, GraduationCap, Search, Settings2, ShieldCheck, UserRoundCog, Users } from "lucide-react";

const nav: Array<{ label: string; href: string; icon: typeof Users; adminOnly?: boolean }> = [
  { label: "Admissions", href: "/admissions", icon: Users },
  { label: "Analytics", href: "/admissions/analytics", icon: BarChart3 },
  { label: "Fee Structure", href: "/fees", icon: CircleDollarSign },
  { label: "Academic Years", href: "/academic-years", icon: CalendarRange },
  { label: "Settings", href: "/settings", icon: Settings2 },
  { label: "Users & Roles", href: "/users", icon: UserRoundCog, adminOnly: true },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { role, loading, error } = useAccess();
  const visibleNav = nav.filter((item) => !item.adminOnly || role === "admin");

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[286px] p-3 lg:block">
        <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50/70 shadow-[0_18px_50px_rgba(15,23,42,.09)]">
          <div className="border-b border-slate-200 p-3">
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-violet-50/65 p-3 shadow-[0_9px_24px_rgba(79,70,229,.09)]">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_7px_18px_rgba(79,70,229,.18)]"><GraduationCap className="size-5" /></div>
              <div className="min-w-0"><p className="text-sm font-extrabold tracking-[-.02em] text-slate-900">SchoolDB Admissions</p><p className="mt-1 text-xs font-semibold uppercase tracking-[.1em] text-slate-400">School workspace</p></div>
            </div>
          </div>

          <div className="px-3 pt-3">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm text-slate-400 transition hover:border-indigo-200 hover:bg-white"><Search className="size-3.5" /><span>Admissions workspace</span></div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
            <div className="space-y-1">
              {visibleNav.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return <Link key={href} href={href} className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${active ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_9px_24px_rgba(79,70,229,.24)] ring-1 ring-indigo-500/20" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>{active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />}<Icon className={`size-[17px] ${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} /><span>{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-white/80" />}</Link>;
              })}
            </div>
          </nav>

          <div className="px-3 pb-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck className="size-4" />Workspace online</div>
              <p className="mt-1.5 text-xs leading-5 text-emerald-700/70">2026–27 admissions operations</p>
              <p className="mt-2 text-xs font-black text-slate-700" aria-live="polite">{loading ? "Verifying role…" : role === "admin" ? "Administrator · Full control" : role === "staff" ? "Staff · Admissions workflow" : error || "Access unavailable"}</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between border-b border-indigo-100/70 bg-white/88 px-4 shadow-[0_8px_30px_rgba(15,23,42,.035)] backdrop-blur-2xl lg:hidden"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md"><GraduationCap className="size-5" /></div><div><p className="font-extrabold tracking-tight text-slate-900">SchoolDB</p><p className="text-xs font-bold uppercase tracking-[.12em] text-indigo-600">Admissions</p></div></div><span className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">{role === "admin" ? "Admin" : role === "staff" ? "Staff · Admissions" : "2026–27"}</span></header>

      <nav className={`fixed inset-x-4 bottom-4 z-40 grid ${role === "admin" ? "grid-cols-6" : "grid-cols-5"} rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,.16)] backdrop-blur-2xl lg:hidden`}>
        {visibleNav.map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} aria-label={label} className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition ${active ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}><Icon className="size-[18px]" /><span>{label === "Fee Structure" ? "Fees" : label === "Academic Years" ? "Years" : label}</span></Link>; })}
      </nav>
    </>
  );
}
