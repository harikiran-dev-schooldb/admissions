"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdmissionAnalyticsGroup } from "@/lib/admissions/analyticsSummary";

type AnalyticsResult = {
  key: string;
  groups: AdmissionAnalyticsGroup[];
  error: string;
};

async function loadAnalytics(academicYear: string, signal: AbortSignal): Promise<AdmissionAnalyticsGroup[]> {
  const response = await fetch("/api/admissions/analytics?academicYear=" + encodeURIComponent(academicYear), {
    cache: "no-store",
    signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load analytics");
  return data.data ?? [];
}

/** Keep only the current year's aggregated counts visible, even during rapid year changes. */
export function useAdmissionAnalytics(academicYear: string) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((n) => n + 1), []);
  const key = `${academicYear}&refresh=${refresh}`;
  const [result, setResult] = useState<AnalyticsResult>({ key: "", groups: [], error: "" });

  useEffect(() => {
    if (!academicYear) return;
    const controller = new AbortController();
    loadAnalytics(academicYear, controller.signal)
      .then((groups) => {
        if (!controller.signal.aborted) setResult({ key, groups, error: "" });
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setResult({
          key, groups: [], error: caught instanceof Error ? caught.message : "Unable to load analytics",
        });
      });
    return () => controller.abort();
  }, [academicYear, key]);

  const current = Boolean(academicYear) && result.key === key;
  return {
    groups: current ? result.groups : [],
    loading: Boolean(academicYear) && !current,
    error: current ? result.error : "",
    reload,
  };
}
