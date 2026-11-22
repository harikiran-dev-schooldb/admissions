"use client";

import { useCallback, useEffect, useState } from "react";

export type AcademicYearRecord = { id: string; academicYear: string; startDate: string | null; endDate: string | null; isActive: boolean; createdAt: string; updatedAt: string; admissionsCount?: number };

async function loadAcademicYears() {
  const response = await fetch("/api/academic-years", { cache: "no-store" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Failed to load academic years");
  return (json.data ?? []) as AcademicYearRecord[];
}

export function useAcademicYears() {
  const [academicYears, setAcademicYears] = useState<AcademicYearRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try { setLoading(true); setError(""); setAcademicYears(await loadAcademicYears()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Failed to load academic years"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    loadAcademicYears()
      .then((data) => { if (active) setAcademicYears(data); })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Failed to load academic years"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { academicYears, loading, error, reload };
}
