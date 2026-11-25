"use client";
import { useState, type FormEvent } from "react";
import Script from "next/script";
import { calculateAge,getEligibleClass } from "@/lib/eligibility";
import { SCHOOL_CLASSES,eligibleForPolicy,type YearPolicy } from "@/lib/admissions/yearPolicy";
type Props={school:string;academicYear:string;siteKey:string;policy:YearPolicy;fees:{className:string;termFee:number;annualFees:number}[]};
const input="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-400";
export default function PublicEnquiryForm({school,academicYear,siteKey,policy,fees}:Props){
  const [dob,setDob]=useState(""),[className,setClassName]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState(""),[done,setDone]=useState(false);
  const age=dob?calculateAge(dob,policy.ageAsOfDate):null;
  const eligible=age?eligibleForPolicy(age,getEligibleClass(age.years),className,policy.rules):"";
  const fee=fees.find(row=>row.className.trim().toUpperCase()===className);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(saving)return;const data=new FormData(event.currentTarget);setError("");
    const humanToken=String(data.get("cf-turnstile-response")??"");
    if(!humanToken){setError("Complete human verification first.");return;}
    setSaving(true);
    try{
      const response=await fetch("/api/public/enquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({academicYear,student:String(data.get("student")??""),parent:String(data.get("parent")??""),mobile:String(data.get("mobile")??""),dob,admClass:className,consent:data.get("consent")==="on",humanToken})});
      const body=await response.json();if(!response.ok)throw Error(body.error||"Unable to submit");
      setDone(true);
    }catch(caught){setError(caught instanceof Error?caught.message:"Unable to submit");(window as Window&{turnstile?:{reset:()=>void}}).turnstile?.reset();}
    finally{setSaving(false);}
  }
  return <main className="mx-auto min-h-screen max-w-[720px] px-4 py-8 sm:py-12"><header className="premium-hero rounded-[28px] p-6 sm:p-8"><p className="premium-kicker">{school}</p><h1 className="mt-3 text-3xl font-black tracking-tight">Admission enquiry</h1><p className="mt-2 text-sm text-slate-600">Academic year {academicYear} · submit an enquiry for the school admission office.</p></header>
    {done?<section className="premium-panel mt-5 rounded-[24px] p-6"><h2 className="text-xl font-black text-emerald-700">Enquiry received</h2><p className="mt-3 text-sm leading-6">The school will review your request. This is not an application submission, seat reservation or admission confirmation.</p></section>:<form onSubmit={submit} className="premium-panel mt-5 space-y-5 rounded-[24px] p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">Student name<input required name="student" maxLength={120} minLength={2} className={input} autoComplete="off"/></label>
        <label className="block text-sm font-bold">Parent / guardian name<input required name="parent" maxLength={120} minLength={2} className={input} autoComplete="name"/></label>
        <label className="block text-sm font-bold">Parent mobile number<input required name="mobile" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} className={input} autoComplete="tel-national"/></label>
        <label className="block text-sm font-bold">Student date of birth<input required type="date" value={dob} onChange={event=>setDob(event.target.value)} className={input}/></label>
        <label className="block text-sm font-bold sm:col-span-2">Class applied for<select required value={className} onChange={event=>setClassName(event.target.value)} className={input}><option value="">Select a class</option>{SCHOOL_CLASSES.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
      </div>
      {age&&<section className="rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-900"><p>Age as of {policy.ageAsOfDate}: <strong>{age.text}</strong></p><p>Indicative eligible class: <strong>{eligible}</strong></p><p className="mt-1 text-xs">Final eligibility is subject to school verification.</p></section>}
      {fee&&<section className="rounded-xl border border-slate-200 p-4 text-sm"><p className="font-bold">Published fee structure · {className}</p><p className="mt-2">Term fee: ₹{fee.termFee.toLocaleString("en-IN")} · Annual fee: ₹{fee.annualFees.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-slate-500">Confirm amounts with the school; these are not payment instructions.</p></section>}
      <label className="flex items-start gap-3 text-sm leading-6"><input required type="checkbox" name="consent" className="mt-1 size-4"/><span>I am the parent or authorised guardian and consent to the school using these details to assess and respond to this admission enquiry. No documents or identity numbers are requested. Contact the school office to request correction or withdrawal.</span></label>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/>
      <div className="cf-turnstile" data-sitekey={siteKey} data-action="admission_enquiry" data-theme="light" data-size="flexible"/>
      {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      <button type="submit" disabled={saving} className="premium-button w-full px-4 py-3 font-bold disabled:opacity-50">{saving?"Submitting…":"Submit enquiry"}</button>
    </form>}
  </main>;
}
