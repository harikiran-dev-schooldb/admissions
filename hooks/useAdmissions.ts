"use client";

import { useCallback, useEffect, useState } from "react";
import type { Admission } from "@/src/generated/prisma/client";

async function fetchAdmissions(academicYear: string, signal: AbortSignal): Promise<Admission[]> {
  const response = await fetch("/api/admissions?academicYear=" + encodeURIComponent(academicYear), {
    cache: "no-store",
    signal,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Failed to load admissions");
  return payload.data ?? [];
}

/** Never display a previous academic year's student list while a new year loads. */
export function useAdmissions(academicYear?: string) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((n) => n + 1), []);
  const key = `${academicYear ?? ""}&refresh=${refresh}`;
  const [result, setResult] = useState<{ key: string; students: Admission[]; error: string }>({
    key: "", students: [], error: "",
  });

  useEffect(() => {
    if (!academicYear) return;
    const controller = new AbortController();
    fetchAdmissions(academicYear, controller.signal)
      .then((students) => { if (!controller.signal.aborted) setResult({ key, students, error: "" }); })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setResult({
          key, students: [], error: caught instanceof Error ? caught.message : "Failed to load admissions",
        });
      });
    return () => controller.abort();
  }, [academicYear, key]);

  const current = Boolean(academicYear) && result.key === key;
  return {
    students: current ? result.students : [],
    loading: Boolean(academicYear) && !current,
    error: current ? result.error : "",
    reload,
  };
}
