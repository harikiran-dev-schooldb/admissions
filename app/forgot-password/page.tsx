"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, Mail } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export default function ForgotPasswordPage(){
 const [email,setEmail]=useState("");const [loading,setLoading]=useState(false);const [sent,setSent]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");try{const redirectTo=`${window.location.origin}/reset-password`;const {error}=await authClient.requestPasswordReset({email,redirectTo});if(error)throw new Error(error.message||"Unable to send reset email");setSent(true)}catch(err:unknown){setError(err instanceof Error?err.message:"Unable to send reset email")}finally{setLoading(false)}}
 return <main className="flex min-h-screen items-center justify-center p-5">
  <div className="w-full max-w-md">
   <div className="mb-7 flex items-center justify-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg"><GraduationCap/></div><div><p className="font-black">SchoolDB</p><p className="text-xs text-indigo-500">Admissions Console</p></div></div>
   <section className="premium-panel rounded-[32px] p-6 sm:p-9">
    <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"><Mail/></div>
    <h1 className="text-3xl font-black tracking-[-.04em]">Reset your password</h1>
    <p className="mt-2 text-sm leading-6 text-slate-500">Enter your administrator email and we’ll send a secure password reset link.</p>
    {sent?<div className="mt-7"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox and spam folder.</div><Link href="/login" className="premium-button mt-5 h-12 w-full text-sm font-bold"><ArrowLeft className="h-4 w-4"/>Back to login</Link></div>:
    <form onSubmit={submit} className="mt-7 space-y-5">
     <label className="block"><span className="mb-2 block text-sm font-semibold">Email address</span><div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required autoFocus autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@school.edu" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></div></label>
     {error&&<div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
     <button disabled={loading} className="premium-button h-13 w-full px-5 text-sm font-bold disabled:opacity-60">{loading?"Sending…":<>Send reset link <ArrowRight className="h-4 w-4"/></>}</button>
     <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4"/>Back to login</Link>
    </form>}
   </section>
  </div>
 </main>
}
