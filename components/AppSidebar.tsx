"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleDollarSign, GraduationCap, Users } from "lucide-react";
const nav=[{label:"Admissions",href:"/admissions",icon:Users},{label:"Analytics",href:"/admissions/analytics",icon:BarChart3},{label:"Fee Structure",href:"/fees",icon:CircleDollarSign}];
export default function AppSidebar(){
 const pathname=usePathname();
 return <>
  <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-indigo-100/80 bg-white/82 text-slate-900 shadow-[16px_0_50px_rgba(79,70,229,0.06)] backdrop-blur-2xl lg:flex lg:flex-col">
   <div className="flex h-24 items-center gap-3 border-b border-indigo-100/70 px-6"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 text-white shadow-[0_12px_28px_rgba(79,70,229,.28)]"><GraduationCap className="h-6 w-6"/></div><div><p className="text-lg font-black tracking-tight">SchoolDB</p><p className="text-[11px] font-bold uppercase tracking-[.16em] text-indigo-500">Admissions</p></div></div>
   <nav className="flex-1 space-y-2 p-4">{nav.map(({label,href,icon:Icon})=>{const active=pathname===href;return <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${active?"bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_12px_26px_rgba(79,70,229,.22)]":"text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"}`}><Icon className="h-5 w-5"/>{label}{active&&<span className="ml-auto size-1.5 rounded-full bg-white"/>}</Link>})}</nav>
   <div className="m-4 rounded-[24px] border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-sm"><p className="text-sm font-bold text-slate-900">2026–27 Admissions</p><p className="mt-1 text-xs leading-5 text-slate-500">Enquiries, analytics and fee structures in one secure workspace.</p><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600"><span className="size-2 rounded-full bg-emerald-500"/>Workspace online</div></div>
  </aside>
  <header className="fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between border-b border-indigo-100/70 bg-white/88 px-4 backdrop-blur-2xl lg:hidden"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg"><GraduationCap className="size-5"/></div><div><p className="font-black tracking-tight">SchoolDB</p><p className="text-[10px] font-bold uppercase tracking-[.14em] text-indigo-500">Admissions</p></div></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">2026–27</span></header>
  <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-3 rounded-[24px] border border-white/90 bg-white/88 p-2 shadow-[0_18px_50px_rgba(15,23,42,.18)] backdrop-blur-2xl lg:hidden">{nav.map(({label,href,icon:Icon})=>{const active=pathname===href;return <Link key={href} href={href} aria-label={label} className={`flex h-12 items-center justify-center rounded-2xl transition ${active?"bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg":"text-slate-500"}`}><Icon className="size-5"/></Link>})}</nav>
 </>
}
