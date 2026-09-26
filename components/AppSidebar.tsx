"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleDollarSign, GraduationCap, Users } from "lucide-react";
const nav=[{label:"Admissions",href:"/admissions",icon:Users},{label:"Analytics",href:"/admissions/analytics",icon:BarChart3},{label:"Fee Structure",href:"/fees",icon:CircleDollarSign}];
export default function AppSidebar(){
 const pathname=usePathname();
 return <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#091540] text-white lg:flex lg:flex-col">
  <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#091540]"><GraduationCap className="h-6 w-6"/></div><div><p className="text-lg font-bold">SchoolDB</p><p className="text-xs text-blue-200">Admissions Console</p></div></div>
  <nav className="flex-1 space-y-2 p-4">{nav.map(({label,href,icon:Icon})=>{const active=pathname===href;return <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${active?"bg-white text-[#091540] shadow-lg":"text-blue-100 hover:bg-white/10 hover:text-white"}`}><Icon className="h-5 w-5"/>{label}</Link>})}</nav>
  <div className="m-4 rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-sm font-semibold">2026–27 Admissions</p><p className="mt-1 text-xs leading-5 text-blue-200">One workspace for enquiries, conversion analytics and fee structures.</p></div>
 </aside>
}
