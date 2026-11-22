import { BarChart3, Sparkles } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import AnalyticsLoadingSkeleton from "@/components/admissions/AnalyticsLoadingSkeleton";

/** Match the Analytics route while its secure server-side role check completes. */
export default function AnalyticsRouteLoading() {
  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72" aria-busy="true">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 xl:px-10">
            <div>
              <p className="premium-kicker">Admissions intelligence</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">Analytics</h1>
            </div>
            <div className="h-11 w-36 animate-pulse rounded-xl bg-indigo-100" aria-hidden="true" />
          </div>
        </header>

        <main className="mx-auto max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[32px] p-6 sm:p-9">
            <div className="relative z-10 flex items-center gap-5">
              <div className="hero-stat grid size-14 shrink-0 place-items-center rounded-2xl text-indigo-600">
                <BarChart3 className="size-6" />
              </div>
              <div>
                <p className="premium-kicker flex items-center gap-2">
                  <Sparkles className="size-3.5" />
                  Preparing analytics
                </p>
                <h2 className="mt-2 max-w-4xl text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  See where enquiries convert and where they need attention.
                </h2>
              </div>
            </div>
          </section>

          <section className="premium-panel flex flex-wrap items-center justify-between gap-3 rounded-[24px] p-4">
            <div>
              <p className="text-sm font-black text-slate-900">Filter analytics</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Preparing academic-year filters…</p>
            </div>
            <div className="flex gap-2" aria-hidden="true">
              <div className="h-11 w-36 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-11 w-36 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </section>

          <AnalyticsLoadingSkeleton />
        </main>
      </div>
    </div>
  );
}
