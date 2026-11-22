"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, ChevronDown, History, Loader2, LogOut, Settings2,
  ShieldCheck, UserRound, UserRoundCog,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useAccess } from "@/hooks/useAccess";

/**
 * An account dropdown shared by every Admissions page and the mobile navbar.
 * Identity and role always come from the server-verified /api/access endpoint.
 */
export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { name, email, role, loading, error } = useAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onOutsideClick);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("pointerdown", onOutsideClick);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [isOpen]);

  const displayName = name.trim() || email.split("@")[0] || "Your account";
  const roleName = role === "admin" ? "Administrator" : role === "staff" ? "Staff" : "Access pending";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1)).join("").toUpperCase();

  async function signOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setLogoutError("");
    try {
      const { error: logoutFailure } = await authClient.signOut();
      if (logoutFailure) throw new Error(logoutFailure.message || "Unable to sign out");
      setIsOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (caught) {
      setLogoutError(caught instanceof Error ? caught.message : "Unable to sign out");
      setIsOpen(true);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Open account menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-12 max-w-[245px] items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 text-left shadow-[0_8px_24px_rgba(30,41,59,.05)] transition hover:border-indigo-200 hover:bg-indigo-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-extrabold text-white" aria-hidden="true">
          {loading ? <UserRound className="size-4" /> : initials}
        </span>
        <span className={`min-w-0 flex-1 ${compact ? "hidden min-[420px]:block" : "block"}`}>
          <span className="block max-w-[146px] truncate text-sm font-extrabold leading-5 text-slate-900" title={displayName}>{loading ? "Loading…" : displayName}</span>
          <span className="block truncate text-[11px] font-semibold leading-4 text-slate-500">{roleName}</span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+9px)] z-50 w-[min(325px,calc(100vw-24px))] overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,.20)]">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.15em] text-indigo-600">Signed-in account</p>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 font-extrabold text-white" aria-hidden="true">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900" title={displayName}>{displayName}</p>
                <p className="text-xs font-semibold text-indigo-700">{roleName}</p>
              </div>
            </div>
            {email && <p className="mt-3 break-all text-xs text-slate-600">{email}</p>}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <ShieldCheck className="size-3.5" /> Verified workspace role
            </div>
          </div>

          {error && <p role="alert" className="mx-2 mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p>}
          <div className="space-y-1 px-1 py-2">
            <Link href="/settings" onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
              <Settings2 className="size-4" /> Settings
            </Link>
            {role === "admin" && (
              <Link href="/users" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
                <UserRoundCog className="size-4" /> Users &amp; roles
              </Link>
            )}
            {role === "admin" && (
              <Link href="/audit-logs" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
                <History className="size-4" /> Audit logs
              </Link>
            )}
          </div>
          <div className="border-t border-slate-100 p-1">
            <button type="button" disabled={isSigningOut || loading}
              onClick={() => void signOut()}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
              {isSigningOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {isSigningOut ? "Signing out…" : "Logout"}
            </button>
            {logoutError && <p role="alert" className="px-3 pb-1 text-xs font-semibold text-red-700">{logoutError}</p>}
          </div>
          <p className="flex items-center gap-1.5 px-4 pb-2 text-[11px] font-medium text-slate-400"><CheckCircle2 className="size-3.5" /> SchoolDB Admissions</p>
        </div>
      )}
    </div>
  );
}
