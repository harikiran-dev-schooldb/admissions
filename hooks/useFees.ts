"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeeRecord } from "@/src/generated/prisma/client";
import type { FeeYearRecord } from "@/lib/fees/selectFeeYear";

type FeeResult = { key: string; data: FeeRecord[]; error: string };

async function loadFees(academicYear: string, signal: AbortSignal): Promise<FeeRecord[]> {
  const url = "/api/fees?academicYear=" + encodeURIComponent(academicYear);
  const response = await fetch(url, { cache: "no-store", signal });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Failed to load fee structures");
  return payload.data ?? [];
}

/** Wait for academic-year resolution, then request only that year's fees. */
export function useFees(academicYear: string) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((n) => n + 1), []);
  const key = `${academicYear}&refresh=${refresh}`;
  const [result, setResult] = useState<FeeResult>({ key: "", data: [], error: "" });

  useEffect(() => {
    if (!academicYear) return;
    const controller = new AbortController();
    loadFees(academicYear, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult({ key, data, error: "" }); })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setResult({
          key, data: [], error: caught instanceof Error ? caught.message : "Failed to load fees",
        });
      });
    return () => controller.abort();
  }, [academicYear, key]);

  const current = Boolean(academicYear) && result.key === key;
  return {
    fees: current ? result.data : [],
    loading: Boolean(academicYear) && !current,
    error: current ? result.error : "",
    reload,
  };
}

/** Fetch only distinct historical year names for the year dropdown. */
export function useFeeYears() {
  const [years, setYears] = useState<FeeYearRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/fees?yearsOnly=true", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load historical fee years");
        return payload.data as FeeYearRecord[];
      })
      .then((data) => { if (!controller.signal.aborted) setYears(data); })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load historical fee years");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return { feeYears: years, feeYearsLoading: loading, feeYearsError: error };
}
