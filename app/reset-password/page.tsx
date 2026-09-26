"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, GraduationCap, LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth/client";

function ResetPasswordForm(){
 const params=useSearchParams();const token=params.get("token");const invalid=params.get("error");const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [show,setShow]=useState(false);const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);const [error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setError("");if(!token){setError("This reset link is missing or invalid.");return}if(password.length<8){setError("Password must be at least 8 characters.");return}if(password!==confirm){setError("Passwords do not match.");return}setLoading(true);try{const {error}=await authClient.resetPassword({newPassword:password,token});if(error)throw new Error(error.message||"Unable to reset password");setDone(true)}catch(err:unknown){setError(err instanceof Error?err.message:"Unable to reset password")}finally{setLoading(false)}}
 if(done)return <div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600"/><h1 className="mt-5 text-3xl font-bold">Password updated</h1><p className="mt-2 text-sm text-slate-500">Your new password is ready. You can now sign in to Admissions.</p><Link href="/login" className="mt-7 flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#091540] text-sm font-bold text-white">Continue to login <ArrowRight className="h-4 w-4"/></Link></div>;
 return <><div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#091540]"><LockKeyhole/></div><h1 className="text-3xl font-bold tracking-tight">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-slate-500">Use at least 8 characters. Your password is handled securely by Neon Auth.</p>
  {(invalid||!token)?<div className="mt-7"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">This password reset link is invalid or has expired.</div><Link href="/forgot-password" className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-[#091540] text-sm font-bold text-white">Request a new link</Link></div>:
  <form onSubmit={submit} className="mt-7 space-y-5">
   <label className="block"><span className="mb-2 block text-sm font-semibold">New password</span><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input required minLength={8} autoComplete="new-password" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></label>
   <label className="block"><span className="mb-2 block text-sm font-semibold">Confirm password</span><input required minLength={8} autoComplete="new-password" type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"/></label>
   {error&&<div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
   <button disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#091540] text-sm font-bold text-white disabled:opacity-60">{loading?"Updating…":<>Set new password <ArrowRight className="h-4 w-4"/></>}</button>
  </form>}</>;
}

export default function ResetPasswordPage(){
 return <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] p-5"><div className="w-full max-w-md"><div className="mb-7 flex items-center justify-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#091540] text-white"><GraduationCap/></div><div><p className="font-bold">SchoolDB</p><p className="text-xs text-slate-500">Admissions Console</p></div></div><section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-9"><Suspense fallback={<p className="text-sm text-slate-500">Loading secure reset…</p>}><ResetPasswordForm/></Suspense></section></div></main>
}
