"use client";

import { useCallback, useEffect, useState } from "react";
import type { Admission } from "@/src/generated/prisma/client";

async function fetchAdmissions(academicYear?: string): Promise<Admission[]> {
  const params = new URLSearchParams();
  if (academicYear) params.set("academicYear", academicYear);
  const query = params.toString();
  const res = await fetch(`/api/admissions${query ? `?${query}` : ""}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load admissions");
  return json.data ?? [];
}

export function useAdmissions(academicYear?: string) {
  const [students, setStudents] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setStudents(await fetchAdmissions(academicYear));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admissions");
    } finally {
      setLoading(false);
    }
  }, [academicYear]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchAdmissions(academicYear)
      .then((data) => { if (active) setStudents(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Failed to load admissions"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [academicYear]);

  return { students, loading, error, reload };
}
