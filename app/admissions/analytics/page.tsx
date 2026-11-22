import { redirect } from "next/navigation";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { getAuthorizedRole } from "@/lib/auth/requireAccess";
import AdmissionsAnalyticsPageClient from "@/components/admissions/AdmissionsAnalyticsPageClient";

/** Analytics includes aggregated admission KPI counts and is admin-only. */
export default async function AdmissionsAnalyticsPage() {
  const { role, error } = await getAuthorizedRole();
  if (error) redirect("/login");
  if (role !== "admin") {
    return (
      <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
        <AppSidebar />
        <main className="mx-auto max-w-4xl p-6 pt-28 lg:ml-72 lg:pt-14">
          <section className="premium-card rounded-[28px] p-8">
            <h1 className="text-2xl font-black text-slate-900">Administrator access required</h1>
            <p className="mt-3 text-sm text-slate-600">Admission analytics and KPI totals are available to administrators only. You can still manage enquiries and their workflow stages.</p>
            <Link className="premium-button mt-6 inline-flex h-11 items-center px-5 text-sm font-bold" href="/admissions">Back to Admissions</Link>
          </section>
        </main>
      </div>
    );
  }
  return <AdmissionsAnalyticsPageClient />;
}
