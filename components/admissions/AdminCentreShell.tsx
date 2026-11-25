"use client";
import type { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import AccountMenu from "@/components/AccountMenu";
import AccessNotice from "@/components/ui/AccessNotice";
import { useAccess } from "@/hooks/useAccess";
export default function AdminCentreShell({title,children}:{title:string;children:ReactNode}){
  const {role,error,loading}=useAccess();
  return <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0 print:p-0"><div className="print:hidden"><AppSidebar/></div><div className="lg:pl-72 print:pl-0"><header className="premium-topbar sticky top-18 z-30 flex items-center justify-between px-4 py-4 lg:top-0 sm:px-8 print:hidden"><div><p className="premium-kicker">Administration</p><h1 className="text-xl font-black">{title}</h1></div><div className="hidden lg:block"><AccountMenu/></div></header><main className="mx-auto max-w-[1480px] space-y-5 p-3 sm:p-6 xl:p-10 print:p-0"><div className="print:hidden"><AccessNotice role={role} error={error}/></div>{loading&&<p role="status" className="text-sm text-slate-500">Checking access…</p>}{!loading&&role!=="admin"&&!error&&<p className="premium-panel rounded-xl p-4">Administrator access required.</p>}{role==="admin"&&children}</main></div></div>;
}
