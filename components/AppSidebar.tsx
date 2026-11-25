"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth/client";
import { useAccess } from "@/hooks/useAccess";
import AccountMenu from "@/components/AccountMenu";
import {
  BarChart3, CalendarRange, ChevronRight, CircleDollarSign, GraduationCap,
  History, LayoutGrid, Loader2, LogOut, MoreHorizontal, Settings2,
  ShieldCheck, UserRound, UserRoundCog, Users, X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Users;
  group: "Workspace" | "Administration";
  adminOnly?: boolean;
};

const nav: NavItem[] = [
  { label: "Admissions", href: "/admissions", icon: Users, group: "Workspace" },
  { label: "Dashboard", href: "/admissions/workspace", icon: LayoutGrid, group: "Workspace", adminOnly: true },
  { label: "Seat & age rules", href: "/admissions/planning", icon: Settings2, group: "Administration", adminOnly: true },
  { label: "Analytics", href: "/admissions/analytics", icon: BarChart3, group: "Workspace", adminOnly: true },
  { label: "Fee Structure", href: "/fees", icon: CircleDollarSign, group: "Workspace" },
  { label: "Academic Years", href: "/academic-years", icon: CalendarRange, group: "Workspace", adminOnly: true },
  { label: "Settings", href: "/settings", icon: Settings2, group: "Administration", adminOnly: true },
  { label: "Users & Roles", href: "/users", icon: UserRoundCog, group: "Administration", adminOnly: true },
  { label: "Operations", href: "/admissions/operations", icon: BarChart3, group: "Administration", adminOnly: true },
  { label: "Recovery", href: "/admissions/recovery", icon: History, group: "Administration", adminOnly: true },
  { label: "Parent inbox", href: "/admissions/public-inbox", icon: Users, group: "Administration", adminOnly: true },
  { label: "Audit Logs", href: "/audit-logs", icon: History, group: "Administration", adminOnly: true },
];

// Server markup remains identical during hydration; the navigation can portal after hydration.
const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function isActiveRoute(href: string, pathname: string) {
  return pathname === href || (href !== "/admissions" && pathname.startsWith(href + "/"));
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
      className={`group flex h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition-all duration-200 ${active
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_10px_26px_rgba(79,70,229,.23)]"
        : "text-slate-600 hover:bg-indigo-50/80 hover:text-indigo-700"}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${active ? "bg-white/20" : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-indigo-600"}`}>
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{item.label}</span>
      {active ? <span className="size-1.5 rounded-full bg-white" /> : <ChevronRight className="size-3.5 text-slate-300 opacity-0 transition group-hover:opacity-100" />}
    </Link>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, name, email, loading, error, clearAccess, notifyAuthChange } = useAccess();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileNavReady = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
  const moreRef = useRef<HTMLDivElement>(null);

  // Portaling to body avoids mobile Safari treating fixed bars as part of a scrolling page.
  const visibleNav = nav.filter((item) => !item.adminOnly || role === "admin");
  const visibleGroups = (["Workspace", "Administration"] as const).filter((group) => visibleNav.some((item) => item.group === group));
  const mobilePrimary = visibleNav.slice(0, 4);
  const mobileSecondary = visibleNav.filter((item) => !mobilePrimary.some((primary) => primary.href === item.href));
  const mobileNavColumns = mobileSecondary.length > 0 ? "grid-cols-5" : mobilePrimary.length === 2 ? "grid-cols-2" : mobilePrimary.length === 3 ? "grid-cols-3" : "grid-cols-4";
  const displayName = name.trim() || email.split("@")[0] || "Signed-in user";
  const roleLabel = role === "admin" ? "Administrator" : role === "staff" ? "Staff" : "Verifying access";
  const avatarInitials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !moreRef.current?.contains(event.target)) setMoreOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMoreOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onEscape);
    };
  }, [moreOpen]);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const { error: logoutError } = await authClient.signOut();
      if (logoutError) throw new Error(logoutError.message || "Could not sign out");
      clearAccess();
      notifyAuthChange("logout");
      router.replace("/login");
      router.refresh();
    } catch (caught) {
      setSignOutError(caught instanceof Error ? caught.message : "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 p-3 lg:block">
        <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-indigo-100/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,.075)]">
          <div className="border-b border-slate-100 px-5 pb-5 pt-6">
            <Link href="/admissions" className="flex items-center gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-[17px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-[0_10px_20px_rgba(99,102,241,.25)]">
                <GraduationCap className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-black tracking-[-.035em] text-slate-950">SchoolDB</span>
                <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[.12em] text-indigo-600">Admissions workspace</span>
              </span>
            </Link>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/65 px-3 py-2.5 text-xs font-semibold text-indigo-800">
              <LayoutGrid className="size-4 text-indigo-500" />
              <span>School operations</span>
              <span className="ml-auto size-2 rounded-full bg-emerald-500" aria-label="Workspace active" />
            </div>
          </div>

          <nav aria-label="Workspace navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {visibleGroups.map((group) => (
              <div key={group}>
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">
                  {group === "Workspace" ? "Manage" : "Administration"}
                </p>
                <div className="space-y-1">
                  {visibleNav.filter((item) => item.group === group).map((item) =>
                    <NavLink key={item.href} item={item} active={isActiveRoute(item.href, pathname)} />)}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-100 bg-gradient-to-b from-white to-indigo-50/45 p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-white p-3 shadow-sm">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">
                {loading ? <UserRound className="size-5" /> : avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900" title={displayName}>{loading ? "Loading profile…" : displayName}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-indigo-600">{roleLabel}</p>
              </div>
              <button type="button" aria-label="Logout" title="Logout" onClick={() => void handleLogout()} disabled={signingOut || loading}
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              </button>
            </div>
            <p className="sr-only">{signingOut ? "Signing out…" : "Logout"}</p>
            {signOutError && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{signOutError}</p>}
            {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <ShieldCheck className="size-3.5 text-emerald-600" /> Secure school workspace
            </p>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-18 items-center justify-between gap-3 border-b border-indigo-100 bg-white/95 px-4 shadow-[0_8px_30px_rgba(15,23,42,.06)] backdrop-blur-2xl lg:hidden">
        <Link href="/admissions" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md"><GraduationCap className="size-5" /></span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black tracking-tight text-slate-900">SchoolDB</span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-600">Admissions</span>
          </span>
        </Link>
        <AccountMenu compact />
      </header>
      {signOutError && <div role="alert" className="fixed inset-x-3 top-20 z-50 rounded-xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 lg:hidden">{signOutError}</div>}

      {mobileNavReady && createPortal(
      <div ref={moreRef} className="lg:hidden">
        {mobileSecondary.length > 0 && moreOpen && (
          <div style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }} className="fixed inset-x-4 bottom-24 z-50 rounded-[23px] border border-indigo-100 bg-white p-2 shadow-[0_20px_70px_rgba(15,23,42,.22)]">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-slate-400">More destinations</p>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close more navigation" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="size-4" /></button>
            </div>
            {mobileSecondary.map((item) =>
              <NavLink key={item.href} item={item} active={isActiveRoute(item.href, pathname)} onNavigate={() => setMoreOpen(false)} />)}
          </div>
        )}
        <nav aria-label="Mobile navigation" style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }} className={`fixed inset-x-3 bottom-3 z-40 grid ${mobileNavColumns} gap-1 rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,.16)] backdrop-blur-2xl`}>
          {mobilePrimary.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.href, pathname);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label}
                className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[15px] text-[10px] font-bold transition ${active ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md" : "text-slate-500 hover:bg-indigo-50"}`}>
                <Icon className="size-[18px]" />
                <span className="w-full truncate text-center">{item.label === "Fee Structure" ? "Fees" : item.label === "Academic Years" ? "Years" : item.label}</span>
              </Link>
            );
          })}
          {mobileSecondary.length > 0 && <button type="button" onClick={() => setMoreOpen((value) => !value)} aria-label="More navigation" aria-expanded={moreOpen}
            className={`flex h-14 flex-col items-center justify-center gap-1 rounded-[15px] text-[10px] font-bold transition ${moreOpen || mobileSecondary.some((item)=>isActiveRoute(item.href,pathname)) ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-indigo-50"}`}>
            <MoreHorizontal className="size-[19px]" />
            More
          </button>}
        </nav>
      </div>,
      document.body,
      )}
    </>
  );
}
