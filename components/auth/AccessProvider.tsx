"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { AccessRole } from "@/lib/auth/accessPolicy";

type Profile = { role: AccessRole; name: string; email: string };
type AccessState = {
  role: AccessRole | null;
  name: string;
  email: string;
  loading: boolean;
  error: string;
};

type AccessContextValue = AccessState & {
  canManage: boolean;
  canManageAdmissions: boolean;
  refreshAccess: () => Promise<AccessRole>;
  clearAccess: () => void;
  notifyAuthChange: (change: "login" | "logout") => void;
};

const emptyAccess: AccessState = { role: null, name: "", email: "", loading: true, error: "" };
const AccessContext = createContext<AccessContextValue | null>(null);
const AUTH_EVENT_KEY = "schooldb:session-event";
const REVALIDATE_MS = 5 * 60 * 1000;

export function AccessProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login" || pathname === "/enquire";
  const [state, setState] = useState<AccessState>(emptyAccess);
  const profileRef = useRef<Profile | null>(null);
  const requestRef = useRef<Promise<AccessRole> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const lastCheckedRef = useRef(0);

  const clearAccess = useCallback(() => {
    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    requestRef.current = null;
    lastCheckedRef.current = 0;
    profileRef.current = null;
    setState({ role: null, name: "", email: "", loading: false, error: "" });
  }, []);

  const refreshAccess = useCallback((): Promise<AccessRole> => {
    // Deduplicate sidebar, account-menu and page requests for the same session.
    if (requestRef.current) return requestRef.current;
    const generation = ++generationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setState((previous) => ({ ...previous, loading: !profileRef.current, error: "" }));

    const request = (async () => {
      try {
        const response = await fetch("/api/access", { cache: "no-store", signal: controller.signal });
        const payload: unknown = await response.json();
        const data = typeof payload === "object" && payload !== null
          ? payload as Record<string, unknown> : {};
        if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not verify permissions");
        if ((data.role !== "admin" && data.role !== "staff") ||
            typeof data.email !== "string" || !data.email.trim()) {
          throw new Error("You do not have access to this workspace");
        }
        const profile: Profile = {
          role: data.role,
          name: typeof data.name === "string" ? data.name : "",
          email: data.email.trim().toLowerCase(),
        };
        if (generation === generationRef.current) {
          profileRef.current = profile;
          setState({ ...profile, loading: false, error: "" });
        }
        return profile.role;
      } catch (caught) {
        if (generation === generationRef.current) {
          profileRef.current = null;
          setState({
            role: null, name: "", email: "", loading: false,
            error: caught instanceof Error ? caught.message : "Could not verify permissions",
          });
        }
        throw caught;
      } finally {
        if (generation === generationRef.current) {
          requestRef.current = null;
          abortRef.current = null;
          lastCheckedRef.current = Date.now();
        }
      }
    })();
    requestRef.current = request;
    return request;
  }, []);

  // Root layout stays mounted across Next.js client-side sidebar navigation.
  // Authentication is resolved only on entering the app or after an explicit session change.
  useEffect(() => {
    if (isLoginPage) {
      if (profileRef.current || requestRef.current) clearAccess();
      return;
    }
    if (!profileRef.current && !requestRef.current) {
      void refreshAccess().catch(() => {});
    }
  }, [isLoginPage, clearAccess, refreshAccess]);

  // Revalidate infrequently after returning from another tab, not on every route change.
  // Server API guards still check the live membership on every protected request.
  useEffect(() => {
    if (isLoginPage) return;
    const checkOnReturn = () => {
      if (document.visibilityState === "visible" && profileRef.current &&
          Date.now() - lastCheckedRef.current >= REVALIDATE_MS) {
        void refreshAccess().catch(() => {});
      }
    };
    window.addEventListener("focus", checkOnReturn);
    document.addEventListener("visibilitychange", checkOnReturn);
    return () => {
      window.removeEventListener("focus", checkOnReturn);
      document.removeEventListener("visibilitychange", checkOnReturn);
    };
  }, [isLoginPage, refreshAccess]);

  // Synchronize sign-out / account switching between tabs without storing roles.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT_KEY || !event.newValue) return;
      const change = event.newValue.split(":")[0];
      clearAccess();
      if (change === "logout") {
        router.replace("/login");
        router.refresh();
      } else if (change === "login" && !isLoginPage) {
        void refreshAccess().catch(() => {});
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearAccess, isLoginPage, refreshAccess, router]);

  const notifyAuthChange = useCallback((change: "login" | "logout") => {
    try {
      window.localStorage.setItem(AUTH_EVENT_KEY, `${change}:${Date.now()}`);
    } catch {
      // Privacy settings may disable storage; server-side authorization still applies.
    }
  }, []);

  const value = useMemo<AccessContextValue>(() => ({
    ...state,
    canManage: state.role === "admin",
    canManageAdmissions: state.role === "admin" || state.role === "staff",
    refreshAccess,
    clearAccess,
    notifyAuthChange,
  }), [state, refreshAccess, clearAccess, notifyAuthChange]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useSharedAccess(): AccessContextValue {
  const value = useContext(AccessContext);
  if (!value) throw new Error("useAccess must be used inside AccessProvider");
  return value;
}
