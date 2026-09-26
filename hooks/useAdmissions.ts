"use client";

import { useCallback, useEffect, useState } from "react";
import type { Admission } from "@/src/generated/prisma/client";

async function fetchAdmissions(): Promise<Admission[]> {
  const res = await fetch("/api/admissions", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load admissions");
  return json.data ?? [];
}

export function useAdmissions() {
  const [students, setStudents] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setStudents(await fetchAdmissions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdmissions()
      .then((data) => { if (active) setStudents(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Failed to load admissions"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { students, loading, error, reload };
}
