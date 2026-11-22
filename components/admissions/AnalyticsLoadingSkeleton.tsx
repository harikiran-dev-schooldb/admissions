"use client";

export default function AnalyticsLoadingSkeleton({ chartOnly = false }: { chartOnly?: boolean }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading admission analytics" className="space-y-6">
      <span className="sr-only">Loading admission analytics for the selected academic year…</span>
      {!chartOnly && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {["Conversion", "Enquiries", "Admitted"].map((label) => (
            <div key={label} className="metric-card h-[145px] animate-pulse rounded-[24px] p-6" aria-hidden="true">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="mt-6 h-10 w-28 rounded-xl bg-slate-200" />
              <div className="mt-3 h-3 w-36 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {["Admission funnel", "Class-wise enquiries"].map((label) => (
          <div key={label} className="premium-panel min-w-0 rounded-[28px] p-6" aria-hidden="true">
            <div className="h-5 w-44 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-3 w-52 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-6 flex h-[260px] animate-pulse items-end gap-4 rounded-xl bg-slate-50 px-8 pb-8">
              {[48, 73, 58, 92, 67].map((height, i) => (
                <div key={i} style={{ height: `${height}%` }} className="flex-1 rounded-t-xl bg-slate-200/70" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
