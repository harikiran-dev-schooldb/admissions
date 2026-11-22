import { CheckCircle2, Sparkles, Users } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";

/** Keep the admissions workspace visible while the route is streamed. */
export default function AdmissionsRouteLoading() {
  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72" aria-busy="true">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-9">
            <div>
              <p className="premium-kicker">Workspace / Admissions</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Admission pipeline</h1>
            </div>
            <div className="h-11 w-32 animate-pulse rounded-xl bg-indigo-100" aria-hidden="true" />
          </div>
        </header>
        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="premium-kicker flex items-center gap-2">
                  <Sparkles className="size-4" /> Preparing admission workspace
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                  Every prospective student, clearly in view.
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[Users, CheckCircle2].map((Icon, i) => (
                  <div key={i} className="hero-stat w-36 rounded-2xl p-4" aria-hidden="true">
                    <Icon className="size-4 text-indigo-600" />
                    <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-indigo-100/70" />
                    <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-indigo-100/70" />
                  </div>
                ))}
              </div>
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-4" aria-label="Preparing admission summary">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="premium-panel h-32 animate-pulse rounded-[24px] border border-indigo-100 p-5" aria-hidden="true">
                <div className="h-3 w-24 rounded-full bg-slate-200" />
                <div className="mt-5 h-8 w-16 rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
          <section className="premium-panel rounded-[28px] p-6">
            <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" />
            <div className="mt-6 space-y-3" aria-hidden="true">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </section>
          <p role="status" className="sr-only">Preparing admissions for the selected academic year…</p>
        </main>
      </div>
    </div>
  );
}
