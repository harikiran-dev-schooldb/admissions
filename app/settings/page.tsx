"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, GraduationCap, Save, Sparkles } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import { useAdmissionSettings } from "@/hooks/useAdmissionSettings";
import { calculateAge, getEligibleClass } from "@/lib/eligibility";

export default function SettingsPage() {
  const { settings, saveSettings } = useAdmissionSettings();
  const [draftAgeAsOfDate, setDraftAgeAsOfDate] = useState<string | null>(null);
  const ageAsOfDate = draftAgeAsOfDate ?? settings.ageAsOfDate;
  const [dob, setDob] = useState("");
  const [saved, setSaved] = useState(false);
  const age = useMemo(() => calculateAge(dob, ageAsOfDate), [dob, ageAsOfDate]);

  function save() {
    saveSettings({ ageAsOfDate });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
            <div><p className="premium-kicker">Workspace preferences</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Settings</h1></div>
            <button onClick={save} disabled={!ageAsOfDate} className="premium-button h-11 px-5 text-sm font-bold disabled:opacity-50"><Save className="size-4" />Save changes</button>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 max-w-3xl"><p className="premium-kicker flex items-center gap-2"><Sparkles className="size-3.5" />Admissions intelligence</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Set one age rule. Keep every eligibility decision consistent.</h2><p className="mt-3 max-w-2xl text-base leading-7">Choose the date student ages should be measured against. The admission calculator will use this date automatically for every new enquiry.</p></div>
          </section>

          {saved && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="size-4" />Age calculation settings saved.</div>}

          <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
            <section className="premium-card rounded-[28px] p-6 sm:p-8">
              <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><CalendarClock className="size-5" /></div><div><h3 className="text-xl font-black tracking-tight">Age calculation date</h3><p className="mt-1 text-sm leading-6 text-slate-500">A typical school cutoff is 1 June of the academic year. Change it to match your admission policy.</p></div></div>
              <label className="mt-7 block text-sm font-bold text-slate-700" htmlFor="age-as-of">Calculate every student&apos;s age as of</label>
              <input id="age-as-of" type="date" value={ageAsOfDate} onChange={(event) => { setDraftAgeAsOfDate(event.target.value); setSaved(false); }} className="premium-input mt-2 h-12 w-full rounded-xl px-4 text-sm font-semibold outline-none" />
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm leading-6 text-indigo-800">This affects future calculations in New Admission. Existing saved admission records are not rewritten.</div>
            </section>

            <section className="rounded-[28px] border border-violet-200/70 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-[0_20px_55px_rgba(79,70,229,.22)] sm:p-8">
              <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20"><GraduationCap className="size-5" /></div><div><p className="text-xs font-black uppercase tracking-[.16em] text-indigo-100">Live calculator</p><h3 className="mt-1 text-xl font-black">Preview eligibility</h3></div></div>
              <label className="mt-7 block text-sm font-bold text-indigo-50" htmlFor="calculator-dob">Student date of birth</label>
              <input id="calculator-dob" type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-white/95 px-4 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-white/20" />
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Calculated age</p><p className="mt-2 text-lg font-black">{age?.text ?? "—"}</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Eligible class</p><p className="mt-2 text-lg font-black">{age ? getEligibleClass(age.years) : "—"}</p></div></div>
              <p className="mt-4 text-xs font-medium text-indigo-100">Calculated as of {ageAsOfDate ? new Date(`${ageAsOfDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "the selected date"}.</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
