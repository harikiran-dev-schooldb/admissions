import Link from "next/link";
import { redirect } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { getAuthorizedRole } from "@/lib/auth/requireAccess";
import ActivityLogPageClient from "@/components/audit/ActivityLogPageClient";

/** Never render activity details to an unauthorized session. */
export default async function AuditLogsPage() {
  const { role, error } = await getAuthorizedRole();
  if (error) {
    if (error.status === 401) redirect("/login");
    return (
      <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
        <AppSidebar />
        <main className="mx-auto max-w-4xl p-6 pt-28 lg:ml-72 lg:pt-14">
          <section className="premium-card rounded-[28px] p-8">
            <h1 className="text-2xl font-black text-slate-900">Unable to verify access</h1>
            <p className="mt-3 text-sm text-slate-600">Please check your account permissions.</p>
            <Link href="/admissions" className="premium-button mt-6 inline-flex h-11 items-center px-5 text-sm font-bold">Back to Admissions</Link>
          </section>
        </main>
      </div>
    );
  }
  if (role !== "admin") {
    return (
      <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
        <AppSidebar />
        <main className="mx-auto max-w-4xl p-6 pt-28 lg:ml-72 lg:pt-14">
          <section className="premium-card rounded-[28px] p-8">
            <h1 className="text-2xl font-black text-slate-900">Administrator access required</h1>
            <p className="mt-3 text-sm text-slate-600">Audit history can be viewed by administrators only. Staff changes are still recorded.</p>
            <Link href="/admissions" className="premium-button mt-6 inline-flex h-11 items-center px-5 text-sm font-bold">Back to Admissions</Link>
          </section>
        </main>
      </div>
    );
  }
  return <ActivityLogPageClient />;
}
