"use client";

import { useEffect, useState } from "react";
import type { AccessRole } from "@/lib/auth/accessPolicy";

export function useAccess() {
  const [role, setRole] = useState<AccessRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadRole() {
      try {
        const response = await fetch("/api/access", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not verify permissions");
        setRole(data.role === "admin" || data.role === "staff" ? data.role : null);
        setName(typeof data.name === "string" ? data.name : "");
        setEmail(typeof data.email === "string" ? data.email : "");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setRole(null);
        setName("");
        setEmail("");
        setError(caught instanceof Error ? caught.message : "Could not verify permissions");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadRole();
    return () => controller.abort();
  }, []);

  return { role, name, email, canManage: role === "admin", canManageAdmissions: role === "admin" || role === "staff", loading, error };
}
