"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Clock3, KeyRound, Loader2, LockKeyhole, Plus, RefreshCw,
  Search, ShieldCheck, ShieldOff, UserRoundCheck, Users,
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useAccess } from "@/hooks/useAccess";
import SchoolDbSelect from "@/components/ui/SchoolDbSelect";

type Role = "ADMIN" | "STAFF";
type Member = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string | null;
};
type Audit = {
  id: string;
  memberEmail: string;
  actorEmail: string;
  action: string;
  beforeRole: Role | null;
  afterRole: Role | null;
  createdAt: string;
};
type Listing = {
  data: Member[];
  page: number;
  pageSize: number;
  total: number;
  bootstrapAdmins: string[];
  legacyStaff: string[];
  currentUserEmail: string;
};

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function UserManagementPage() {
  const { role, loading: accessLoading, error: accessError } = useAccess();
  const canManage = role === "admin";
  const [members, setMembers] = useState<Member[]>([]);
  const [bootstrapAdmins, setBootstrapAdmins] = useState<string[]>([]);
  const [legacyStaff, setLegacyStaff] = useState<string[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("STAFF");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const refreshData = useCallback(() => setRefresh((value) => value + 1), []);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    let disposed = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [listing, history] = await Promise.all([
          fetch(`/api/users?page=${page}&q=${encodeURIComponent(query)}`, { cache: "no-store" }).then(readJson) as Promise<Listing>,
          fetch("/api/users/audit", { cache: "no-store" }).then(readJson) as Promise<{ data: Audit[] }>,
        ]);
        if (disposed) return;
        setMembers(listing.data);
        setBootstrapAdmins(listing.bootstrapAdmins);
        setLegacyStaff(listing.legacyStaff);
        setTotal(listing.total);
        setAudit(history.data);
      } catch (caught) {
        if (!disposed) setError(caught instanceof Error ? caught.message : "Unable to load users");
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void load();
    return () => { disposed = true; };
  }, [canManage, page, query, refresh]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await readJson(await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
      }));
      setNewEmail("");
      setNewRole("STAFF");
      setNotice("Access granted. The person can sign in using that email in Neon Auth.");
      setPage(1);
      refreshData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add user");
    } finally {
      setSaving(false);
    }
  }

  async function updateMember(member: Member, change: { role?: Role; isActive?: boolean }) {
    if (!canManage || busyId) return;
    if (change.role === "ADMIN" && member.role !== "ADMIN" &&
        !window.confirm(`Give ${member.email} administrator access to student data, fees, settings and user management?`)) return;
    if (change.isActive === false &&
        !window.confirm(`Revoke workspace access for ${member.email}? They will lose access on their next API request.`)) return;
    setBusyId(member.id);
    setError("");
    setNotice("");
    try {
      await readJson(await fetch(`/api/users/${encodeURIComponent(member.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      }));
      setNotice(`Access updated for ${member.email}.`);
      refreshData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update user");
    } finally {
      setBusyId("");
    }
  }

  function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  return (
    <div className="premium-page pb-24 pt-18 lg:pb-0 lg:pt-0">
      <AppSidebar />
      <div className="lg:pl-72">
        <header className="premium-topbar sticky top-18 z-30 lg:top-0">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 xl:px-10">
            <div>
              <p className="premium-kicker">Access &amp; security</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-.04em]">User management</h1>
            </div>
            {canManage && <button onClick={refreshData} disabled={loading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-indigo-100 bg-white px-4 text-sm font-bold text-indigo-700 shadow-sm disabled:opacity-50">
              <RefreshCw className="size-4" /> Refresh
            </button>}
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 xl:p-10">
          <section className="premium-hero rounded-[30px] p-6 sm:p-8">
            <div className="relative z-10 flex items-start gap-5">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><ShieldCheck className="size-7" /></div>
              <div>
                <p className="premium-kicker">Administrator controls</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-slate-950">Control access, not just passwords.</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Give staff permission to enter enquiries and update the application workflow. Allow administrators to manage fee structures, academic years, settings and users. All changes are checked by the server.
                </p>
              </div>
            </div>
          </section>

          {accessLoading && <p className="flex items-center gap-2 rounded-xl bg-white p-5 text-sm font-semibold text-slate-500"><Loader2 className="size-4 animate-spin" />Verifying administrator access…</p>}
          {!accessLoading && !canManage && <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800" role="alert">
            <LockKeyhole className="mb-2 size-6" />Only administrators can open User Management. {accessError}
          </section>}

          {canManage && <>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{notice}</p>}

            <div className="grid gap-5 xl:grid-cols-[minmax(340px,.85fr)_minmax(0,1.15fr)]">
              <section className="premium-card rounded-[28px] p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Plus className="size-5" /></div>
                  <div><h3 className="text-xl font-black tracking-tight text-slate-950">Add account</h3><p className="text-sm text-slate-500">Grant access to an email address</p></div>
                </div>
                <form onSubmit={addMember} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="member-email" className="mb-1.5 block text-sm font-bold text-slate-800">Login email</label>
                    <input id="member-email" type="email" required maxLength={254} autoComplete="off" placeholder="staff@school.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className="premium-input h-12 w-full rounded-xl px-4 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-800">Access level</label>
                    <SchoolDbSelect ariaLabel="New account access level" value={newRole} onValueChange={(value) => setNewRole(value as Role)}
                      options={[{ value: "STAFF", label: "Staff — Enquiries & workflow" }, { value: "ADMIN", label: "Administrator — Full access" }]} />
                  </div>
                  <button type="submit" disabled={saving || !newEmail.trim()} className="premium-button h-12 w-full justify-center text-sm font-bold disabled:opacity-50">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} {saving ? "Adding user…" : "Grant access"}
                  </button>
                </form>
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs leading-6 text-indigo-800">
                  <strong>Login is separate.</strong> This page grants a role. The person must also have a Neon Auth login with the exact same email. No password or invitation is sent.
                </div>
              </section>

              <section className="premium-card rounded-[28px] p-6 sm:p-7">
                <div className="flex items-center gap-3"><KeyRound className="size-5 text-indigo-600" />
                  <div><h3 className="text-xl font-black text-slate-950">Protected recovery admins</h3><p className="text-sm text-slate-500">Can't be demoted or disabled here</p></div>
                </div>
                <div className="mt-5 space-y-2">
                  {bootstrapAdmins.map((email) => <div key={email} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                    <span className="min-w-0 break-all text-sm font-bold text-slate-800">{email}</span>
                    <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">Protected Admin</span>
                  </div>)}
                  {loading && <p className="text-sm text-slate-500">Loading accounts…</p>}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">Keep at least one trusted recovery administrator in the Vercel `ADMISSIONS_ADMIN_EMAILS` variable. Other users are managed below without redeploying.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4"><Users className="size-4 text-indigo-600" /><p className="mt-2 text-2xl font-black text-slate-950">{total}</p><p className="mt-1 text-xs font-semibold text-slate-500">Managed accounts</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><ShieldCheck className="size-4 text-indigo-600" /><p className="mt-2 text-2xl font-black text-slate-950">{bootstrapAdmins.length}</p><p className="mt-1 text-xs font-semibold text-slate-500">Recovery admins</p></div>
                </div>
              </section>
            </div>

            <section className="premium-table overflow-hidden rounded-[28px]">
              <div className="flex flex-col gap-4 border-b border-indigo-100/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="text-lg font-black text-slate-950">Managed accounts</h3><p className="mt-1 text-sm text-slate-500">Change roles or revoke access immediately</p></div>
                <form onSubmit={searchUsers} className="flex min-w-0 gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by email" className="premium-input h-11 w-full rounded-xl pl-10 pr-3 text-sm" />
                  </div>
                  <button type="submit" className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700">Search</button>
                </form>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[830px]">
                  <thead className="bg-indigo-50/60"><tr>
                    {["Email", "Role", "Status", "Last changed by", "Actions"].map((label) =>
                      <th key={label} className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}
                  </tr></thead>
                  <tbody>
                    {loading && <tr><td colSpan={5} className="p-10 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading members…</td></tr>}
                    {!loading && members.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-sm font-semibold text-slate-500">No accounts match your search. Use Add account to grant access.</td></tr>}
                    {!loading && members.map((member) => <tr key={member.id} className="border-t border-slate-100 hover:bg-indigo-50/30">
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">{member.email}</td>
                      <td className="px-5 py-4">
                        <select aria-label={`Role for ${member.email}`} value={member.role}
                          disabled={busyId !== "" || !member.isActive}
                          onChange={(event) => void updateMember(member, { role: event.target.value as Role })}
                          className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm font-bold text-indigo-700 disabled:opacity-50">
                          <option value="STAFF">Staff</option><option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-black ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{member.isActive ? "Active" : "Disabled"}</span></td>
                      <td className="px-5 py-4"><p className="max-w-[220px] truncate text-xs font-semibold text-slate-600" title={member.updatedBy ?? ""}>{member.updatedBy ?? "—"}</p><p className="mt-1 text-xs text-slate-400">{new Date(member.updatedAt).toLocaleString("en-IN")}</p></td>
                      <td className="px-5 py-4">
                        <button disabled={busyId !== ""} onClick={() => void updateMember(member, { isActive: !member.isActive })}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50 ${member.isActive ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                          {busyId === member.id ? <Loader2 className="size-4 animate-spin" /> : member.isActive ? <ShieldOff className="size-4" /> : <UserRoundCheck className="size-4" />}
                          {member.isActive ? "Disable access" : "Reactivate"}
                        </button>
                      </td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-indigo-100/70 px-5 py-4">
                <p className="text-sm font-semibold text-slate-500">Page {page} · {total} matching accounts</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold disabled:opacity-40">Previous</button>
                  <button disabled={page * 25 >= total || loading} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold disabled:opacity-40">Next</button>
                </div>
              </div>
            </section>

            {legacyStaff.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-black text-amber-900">Legacy staff access is still enabled</h3>
              <p className="mt-2 text-sm leading-6 text-amber-800">These staff emails are still authorized by the old Vercel environment setting: {legacyStaff.join(", ")}. Add each email above to manage them here, then remove the old `ADMISSIONS_STAFF_EMAILS` variable when finished. Disabling a database entry overrides the legacy list.</p>
            </section>}

            <section className="premium-card rounded-[28px] p-6">
              <div className="flex items-center gap-3"><Clock3 className="size-5 text-indigo-600" /><div><h3 className="text-xl font-black text-slate-900">Recent access changes</h3><p className="text-sm text-slate-500">Latest 30 administrator actions</p></div></div>
              <div className="mt-4 divide-y divide-slate-100">
                {audit.length === 0 && <p className="py-4 text-sm text-slate-500">No changes recorded yet.</p>}
                {audit.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div><p className="font-bold text-slate-800">{entry.memberEmail}</p><p className="mt-0.5 text-xs text-slate-500">{entry.action.replaceAll("_", " ")} by {entry.actorEmail}</p></div>
                  <time className="text-xs font-semibold text-slate-400">{new Date(entry.createdAt).toLocaleString("en-IN")}</time>
                </div>)}
              </div>
            </section>
          </>}
        </main>
      </div>
    </div>
  );
}
