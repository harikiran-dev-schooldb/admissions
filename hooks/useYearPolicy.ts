"use client";
import { useEffect, useState } from "react";
import { ADMISSION_SETTINGS_EVENT } from "@/lib/admissionSettings";
import type { YearPolicy } from "@/lib/admissions/yearPolicy";
export function useYearPolicy(year: string, enabled: boolean) {
  const [revision, setRevision] = useState(0);
  const key = year + "|" + enabled + "|" + revision;
  const [result, setResult] = useState<{ key: string; data: YearPolicy | null; error: string }>({key:"",data:null,error:""});
  useEffect(() => {
    const sync = () => setRevision(v => v+1);
    window.addEventListener(ADMISSION_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(ADMISSION_SETTINGS_EVENT, sync);
  }, []);
  useEffect(() => {
    if (!year || !enabled) return;
    const controller = new AbortController();
    fetch("/api/admissions/year-policy?academicYear=" + encodeURIComponent(year), { cache:"no-store", signal:controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Unable to load eligibility policy"); return body.data.policy as YearPolicy; })
      .then(data => { if (!controller.signal.aborted) setResult({ key, data, error:"" }); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setResult({ key,data:null,error:error instanceof Error ? error.message : "Unable to load eligibility policy" }); });
    return () => controller.abort();
  }, [year, enabled, key]);
  return { policy: result.key === key ? result.data : null, loading: enabled && result.key !== key, error: result.key === key ? result.error : "" };
}
