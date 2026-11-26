"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AcademicYearRecord = { id: string; academicYear: string; startDate: string | null; endDate: string | null; isActive: boolean; createdAt: string; updatedAt: string; admissionsCount?: number; isSuggested?: boolean };

async function loadAcademicYears(signal: AbortSignal) {
  const response = await fetch("/api/academic-years", { cache: "no-store", signal });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Failed to load academic years");
  return (json.data ?? []) as AcademicYearRecord[];
}

export function useAcademicYears() {
  const [academicYears, setAcademicYears] = useState<AcademicYearRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentRequest = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    // Cancel older loads; they must never overwrite the newest academic-year list.
    currentRequest.current?.abort();
    const controller = new AbortController();
    currentRequest.current = controller;
    setLoading(true);
    setError("");
    try {
      const data = await loadAcademicYears(controller.signal);
      if (!controller.signal.aborted) setAcademicYears(data);
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Failed to load academic years");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    currentRequest.current = controller;
    void loadAcademicYears(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setAcademicYears(data); })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Failed to load academic years");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => currentRequest.current?.abort();
  }, []);
  return { academicYears, loading, error, reload };
}
