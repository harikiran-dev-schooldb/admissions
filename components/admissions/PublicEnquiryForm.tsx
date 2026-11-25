"use client";
import { useState, type FormEvent } from "react";
import Script from "next/script";
import { calculateAge,getEligibleClass } from "@/lib/eligibility";
import { SCHOOL_CLASSES,eligibleForPolicy,type YearPolicy } from "@/lib/admissions/yearPolicy";
import { portalText,localizedAge,type PortalLanguage } from "@/lib/admissions/portalLanguage";
type Props={school:string;academicYear:string;siteKey:string;policy:YearPolicy;fees:{className:string;termFee:number;annualFees:number}[]};
const input="mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base outline-none focus:border-indigo-400";
export default function PublicEnquiryForm({school,academicYear,siteKey,policy,fees}:Props){
  const [lang,setLang]=useState<PortalLanguage>("en"),[dob,setDob]=useState(""),[className,setClassName]=useState(""),[saving,setSaving]=useState(false),[error,setError]=useState<"human"|"failed"|"limit"|"closed"|null>(null),[done,setDone]=useState(false);
  const t=portalText[lang];
  const age=dob?calculateAge(dob,policy.ageAsOfDate):null;
  const eligible=age?eligibleForPolicy(age,getEligibleClass(age.years),className,policy.rules):"";
  const fee=fees.find(row=>row.className.trim().toUpperCase()===className);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(saving)return;const data=new FormData(event.currentTarget);setError(null);
    const humanToken=String(data.get("cf-turnstile-response")??"");
    if(!humanToken){setError("human");return;}
    setSaving(true);
    try{
      const response=await fetch("/api/public/enquiry",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({academicYear,student:String(data.get("student")??""),parent:String(data.get("parent")??""),mobile:String(data.get("mobile")??""),dob,admClass:className,consent:data.get("consent")==="on",humanToken})});
      if(!response.ok){setError(response.status===429?"limit":response.status===503?"closed":"failed");(window as Window&{turnstile?:{reset:()=>void}}).turnstile?.reset();return;}
      setDone(true);
    }catch{setError("failed");(window as Window&{turnstile?:{reset:()=>void}}).turnstile?.reset();}
    finally{setSaving(false);}
  }
  return <main lang={lang} className="mx-auto min-h-screen max-w-[720px] px-4 py-8 sm:py-12"><header className="premium-hero rounded-[28px] p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="premium-kicker">{school}</p><div role="group" aria-label="Language / భాష" className="flex rounded-xl border border-indigo-100 bg-white p-1">{(["en","te"] as const).map(value=><button key={value} type="button" aria-pressed={lang===value} onClick={()=>setLang(value)} className={"rounded-lg px-3 py-2 text-sm font-bold "+(lang===value?"bg-indigo-600 text-white":"text-slate-600")}>{value==="en"?"English":"తెలుగు"}</button>)}</div></div><h1 className="mt-3 text-3xl font-black tracking-tight">{t.title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{t.year} {academicYear} · {t.intro}</p></header>
    {done?<section className="premium-panel mt-5 rounded-[24px] p-6"><h2 className="text-xl font-black text-emerald-700">{t.received}</h2><p className="mt-3 text-sm leading-6">{t.receivedNote}</p></section>:<form onSubmit={submit} className="premium-panel mt-5 space-y-5 rounded-[24px] p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">{t.student}<input required name="student" maxLength={120} minLength={2} className={input} autoComplete="off"/></label>
        <label className="block text-sm font-bold">{t.parent}<input required name="parent" maxLength={120} minLength={2} className={input} autoComplete="name"/></label>
        <label className="block text-sm font-bold">{t.mobile}<input required name="mobile" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} className={input} autoComplete="tel-national"/></label>
        <label className="block text-sm font-bold">{t.dob}<input required type="date" value={dob} onChange={event=>setDob(event.target.value)} className={input}/></label>
        <label className="block text-sm font-bold sm:col-span-2">{t.className}<select required value={className} onChange={event=>setClassName(event.target.value)} className={input}><option value="">{t.selectClass}</option>{SCHOOL_CLASSES.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
      </div>
      {age&&<section className="rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-900"><p>{t.age} {policy.ageAsOfDate}: <strong>{localizedAge(age,lang)}</strong></p><p>{t.eligible}: <strong>{eligible==="NOT ELIGIBLE"?t.notEligible:eligible}</strong></p><p className="mt-1 text-xs">{t.ageNote}</p></section>}
      {fee&&<section className="rounded-xl border border-slate-200 p-4 text-sm"><p className="font-bold">{t.fees} · {className}</p><p className="mt-2">{t.term}: ₹{fee.termFee.toLocaleString("en-IN")} · {t.annual}: ₹{fee.annualFees.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-slate-500">{t.feesNote}</p></section>}
      <label className="flex items-start gap-3 text-sm leading-6"><input required type="checkbox" name="consent" className="mt-1 size-4"/><span>{t.consent}</span></label>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/>
      <div className="cf-turnstile" data-sitekey={siteKey} data-action="admission_enquiry" data-theme="light" data-size="flexible"/>
      {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{t[error]}</p>}
      <button type="submit" disabled={saving} className="premium-button w-full px-4 py-3 font-bold disabled:opacity-50">{saving?t.submitting:t.submit}</button>
    </form>}
  </main>;
}
