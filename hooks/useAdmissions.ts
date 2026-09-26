"use client";

import { useCallback, useEffect, useState } from "react";

export function useAdmissions() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAdmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admissions", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load admissions");
      setStudents(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAdmissions(); }, [loadAdmissions]);

  return { students, loading, error, reload: loadAdmissions };
}
