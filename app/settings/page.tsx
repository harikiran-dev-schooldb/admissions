"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Save, Sparkles, Users } from "lucide-react";

import AppSidebar from "@/components/AppSidebar";
import { useAdmissionSettings } from "@/hooks/useAdmissionSettings";
import { useAccess } from "@/hooks/useAccess";
import AccessNotice from "@/components/ui/AccessNotice";

export default function SettingsPage() {
  const { role, canManage, error: accessError } = useAccess();
  const { settings, saveSettings, loading, error: loadError } = useAdmissionSettings();
  const [draftAgeAsOfDate, setDraftAgeAsOfDate] = useState<string | null>(null);
  const ageAsOfDate = draftAgeAsOfDate ?? settings.ageAsOfDate;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function save() {
    if (!canManage) return;
    try {
      setSaving(true);
      setSaveError("");
      setSaved(false);
      await saveSettings({ ageAsOfDate });
      setDraftAgeAsOfDate(null);
      setSaved(true);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
            <div><p className="premium-kicker">Workspace preferences</p><h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Settings</h1></div>
{canManage && <button onClick={save} disabled={!ageAsOfDate || loading || saving} className="premium-button h-11 px-5 text-sm font-bold disabled:opacity-50"><Save className="size-4" />Save changes</button>}
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 xl:p-10">
          <AccessNotice role={role} error={accessError} />
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 max-w-3xl"><p className="premium-kicker flex items-center gap-2"><Sparkles className="size-3.5" />Admissions intelligence</p><h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Set one age rule. Keep every eligibility decision consistent.</h2><p className="mt-3 max-w-2xl text-base leading-7">Choose the date student ages should be measured against. The entire admission team uses this server-side date for new enquiry eligibility calculations.</p></div>
          </section>

          {(loadError || saveError) && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{saveError || loadError}</div>}
          {saved && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="size-4" />Age calculation settings saved.</div>}

          <div className="max-w-3xl">
            <section className="premium-card rounded-[28px] p-6 sm:p-8">
              <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><CalendarClock className="size-5" /></div><div><h3 className="text-xl font-black tracking-tight">Age calculation date</h3><p className="mt-1 text-sm leading-6 text-slate-500">A typical school cutoff is 1 June of the academic year. Change it to match your admission policy.</p></div></div>
              <label className="mt-7 block text-sm font-bold text-slate-700" htmlFor="age-as-of">Calculate every student&apos;s age as of</label>
              <input id="age-as-of" type="date" disabled={!canManage || loading} value={ageAsOfDate} onChange={(event) => { setDraftAgeAsOfDate(event.target.value); setSaved(false); }} className="premium-input mt-2 h-12 w-full rounded-xl px-4 text-sm font-semibold outline-none" />
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm leading-6 text-indigo-800">This affects future calculations in New Admission. Existing saved admission records are not rewritten.</div>
              {!canManage && <p className="mt-3 text-sm font-semibold text-slate-500">Only administrators can change admission settings.</p>}
            </section>
          </div>
          <section className="premium-card max-w-3xl rounded-[28px] p-6 sm:p-8">
            <h3 className="text-xl font-black text-slate-900">Roles and permissions</h3>
            <p className="mt-2 text-sm text-slate-600">Access follows the account you signed in with. Staff can enter enquiries and advance admission stages. Administrators can additionally manage users, student details, academic years, fees and settings.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-indigo-50 p-4"><p className="font-black text-indigo-800">Administrator</p><p className="mt-1 text-indigo-700">View and manage all records</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="font-black text-slate-800">Staff</p><p className="mt-1 text-slate-600">Create enquiries and update admission stages; configuration is read-only</p></div>
            </div>
            {canManage && <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-indigo-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-bold text-slate-800">Manage school access</p><p className="mt-1 text-sm text-slate-600">Invite existing Neon Auth users by email, assign roles and disable access without redeploying.</p></div>
              <Link href="/users" className="premium-button inline-flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-bold"><Users className="size-4" /> Manage users</Link>
            </div>}
          </section>
        </main>
      </div>
    </div>
  );
}
