"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Loader2, LogOut, ShieldCheck, UserRound,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAccess } from "@/hooks/useAccess";

export default function AccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { name, email, role, loading, error, clearAccess, notifyAuthChange } = useAccess();
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
      clearAccess();
      notifyAuthChange("logout");
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
    <div className="flex items-center gap-2"><NotificationBell />
    <div ref={menuRef} className="relative z-50 shrink-0">
      <button type="button" aria-label="Open account menu" aria-haspopup="true" aria-expanded={isOpen}
        onClick={() => setIsOpen((opened) => !opened)}
        className={`flex h-11 max-w-[232px] items-center gap-2.5 rounded-[17px] border bg-white px-2.5 pr-3 shadow-[0_4px_18px_rgba(15,23,42,.045)] transition-all hover:border-indigo-200 hover:shadow-[0_7px_24px_rgba(79,70,229,.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${isOpen ? "border-indigo-300 ring-4 ring-indigo-50" : "border-slate-200"}`}>
        <span className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-sm" aria-hidden="true">
          {loading ? <UserRound className="size-4" /> : initials}
          {!loading && role && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-400" />}
        </span>
        <span className={`min-w-0 flex-1 text-left ${compact ? "hidden min-[420px]:block" : "block"}`}>
          <span className="block max-w-[136px] truncate text-xs font-extrabold leading-4 text-slate-900" title={displayName}>{loading ? "Loading…" : displayName}</span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold leading-3.5 text-slate-500">{roleName}</span>
        </span>
        <ChevronDown className={`size-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div role="dialog" aria-label="Your SchoolDB account" className="absolute right-0 top-[calc(100%+8px)] z-[90] w-[min(272px,calc(100vw-24px))] overflow-hidden rounded-[20px] border border-indigo-100 bg-white p-2 shadow-[0_20px_65px_rgba(15,23,42,.16)]">
          <div className="rounded-[15px] bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-sm" aria-hidden="true">{loading ? <UserRound className="size-4" /> : initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold leading-5 text-slate-950" title={displayName}>{loading ? "Loading…" : displayName}</p>
                <p className="truncate text-[11px] font-semibold text-indigo-700">{roleName}</p>
              </div>
            </div>
            {email && <p className="mt-2.5 truncate text-[11px] text-slate-600" title={email}>{email}</p>}
            <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700"><ShieldCheck className="size-3.5" /> Signed in securely</p>
          </div>
          {error && <p role="alert" className="mx-1 mt-2 rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">{error}</p>}
          <div className="mt-1 border-t border-slate-100 pt-1">
            <button type="button" onClick={() => void signOut()} disabled={isSigningOut || loading}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500 disabled:opacity-50">
              {isSigningOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              {isSigningOut ? "Signing out…" : "Logout"}
            </button>
            {logoutError && <p role="alert" className="px-3 pb-2 text-xs font-semibold text-rose-700">{logoutError}</p>}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
