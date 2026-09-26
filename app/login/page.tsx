"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth/client";

export default function LoginPage(){
 const router=useRouter();const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [show,setShow]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
 async function handleLogin(e:React.FormEvent){e.preventDefault();try{setLoading(true);setError("");const {error}=await authClient.signIn.email({email,password});if(error)throw new Error(error.message||"Failed to sign in");const next=new URLSearchParams(window.location.search).get("next");router.push(next?.startsWith("/")?next:"/admissions");router.refresh()}catch(err:unknown){setError(err instanceof Error?err.message:"Login failed")}finally{setLoading(false)}}
 return <main className="grid min-h-screen bg-[#f6f8fc] lg:grid-cols-[1.05fr_.95fr]">
  <section className="relative hidden overflow-hidden bg-[#091540] p-12 text-white lg:flex lg:flex-col lg:justify-between">
   <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"/><div className="relative flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#091540]"><GraduationCap/></div><div><p className="text-xl font-bold">SchoolDB</p><p className="text-xs text-blue-200">Admissions Console</p></div></div>
   <div className="relative max-w-xl"><p className="mb-5 text-sm font-bold uppercase tracking-[.24em] text-blue-300">Admissions 2026–27</p><h1 className="text-5xl font-bold leading-[1.08] tracking-tight">From first enquiry to confirmed admission, in one workspace.</h1><p className="mt-6 max-w-lg text-base leading-7 text-blue-100">Secure access for the admissions team to manage prospective students, workflow stages, analytics and fee structures.</p></div>
   <p className="relative text-xs text-blue-300">SchoolDB · Admissions Management</p>
  </section>
  <section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md">
   <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#091540] text-white"><GraduationCap/></div><div><p className="font-bold">SchoolDB</p><p className="text-xs text-slate-500">Admissions Console</p></div></div>
   <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-9"><div className="mb-8"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#091540]"><LockKeyhole/></div><h2 className="text-3xl font-bold tracking-tight">Welcome back</h2><p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your admissions administrator account.</p></div>
    <form onSubmit={handleLogin} className="space-y-5">
     <label className="block"><span className="mb-2 block text-sm font-semibold">Email address</span><div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@school.edu" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></div></label>
     <label className="block"><span className="mb-2 flex items-center justify-between text-sm font-semibold"><span>Password</span><Link href="/forgot-password" className="text-xs font-bold text-blue-700 hover:text-blue-900">Forgot password?</Link></span><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required autoComplete="current-password" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
     {error&&<div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
     <button disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#091540] px-5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">{loading?"Signing in…":<>Sign in <ArrowRight className="h-4 w-4"/></>}</button>
    </form>
   </div><p className="mt-5 text-center text-xs text-slate-400">Protected admissions administration area</p>
  </div></section>
 </main>
}
