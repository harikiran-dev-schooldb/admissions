"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Admission } from "@/src/generated/prisma/client";
import type { AdmissionPageSize } from "@/lib/admissions/pagination";

export type AdmissionDirectoryFilters = {
  academicYear: string;
  page: number;
  pageSize: AdmissionPageSize;
  search: string;
  classFilter: string;
  finalStatusFilter: string;
  applicationFilter: string;
};

type DirectoryPayload = {
  data: Admission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdmissionSummary = {
  total: number;
  admitted: number;
  applicationsTaken: number;
  applicationSubmitted: number;
  entrancePassed: number;
  interviewSelected: number;
  classOptions: string[];
};

const emptyDirectory: DirectoryPayload = { data: [], total: 0, page: 1, pageSize: 25, totalPages: 1 };
export const emptySummary: AdmissionSummary = {
  total: 0,
  admitted: 0,
  applicationsTaken: 0,
  applicationSubmitted: 0,
  entrancePassed: 0,
  interviewSelected: 0,
  classOptions: [],
};

async function jsonOrThrow<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load admissions");
  return result as T;
}

export function useAdmissionsDirectory(filters: AdmissionDirectoryFilters) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  const params = useMemo(() => {
    const query = new URLSearchParams({
      academicYear: filters.academicYear,
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    });
    if (filters.search.trim()) query.set("q", filters.search.trim());
    if (filters.classFilter !== "ALL") query.set("class", filters.classFilter);
    if (filters.finalStatusFilter !== "ALL") query.set("status", filters.finalStatusFilter);
    if (filters.applicationFilter !== "ALL") query.set("application", filters.applicationFilter);
    return query.toString();
  }, [filters.academicYear, filters.page, filters.pageSize, filters.search, filters.classFilter, filters.finalStatusFilter, filters.applicationFilter]);
  const requestKey = `${params}&r=${refresh}`;

  const [result, setResult] = useState<{ key: string; payload: DirectoryPayload; error: string }>({
    key: "",
    payload: emptyDirectory,
    error: "",
  });

  useEffect(() => {
    if (!filters.academicYear) return;
    const controller = new AbortController();
    fetch(`/api/admissions?${params}`, { cache: "no-store", signal: controller.signal })
      .then(jsonOrThrow<DirectoryPayload>)
      .then((payload) => { if (!controller.signal.aborted) setResult({ key: requestKey, payload, error: "" }); })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, payload: emptyDirectory, error: error instanceof Error ? error.message : "Failed to load admissions" });
      });
    return () => controller.abort();
  }, [filters.academicYear, params, requestKey]);

  const current = !!filters.academicYear && result.key === requestKey;
  const payload = current ? result.payload : emptyDirectory;
  return {
    students: payload.data,
    total: payload.total,
    page: payload.page,
    totalPages: payload.totalPages,
    loading: Boolean(filters.academicYear) && !current,
    error: current ? result.error : "",
    reload,
  };
}

export function useAdmissionsSummary(academicYear: string) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  const requestKey = `${academicYear}&r=${refresh}`;
  const [result, setResult] = useState<{key: string; payload: AdmissionSummary; error: string}>({
    key: "",
    payload: emptySummary,
    error: "",
  });

  useEffect(() => {
    if (!academicYear) return;
    const controller = new AbortController();
    fetch(`/api/admissions/stats?academicYear=${encodeURIComponent(academicYear)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(jsonOrThrow<{data: AdmissionSummary}>)
      .then(({data}) => { if (!controller.signal.aborted) setResult({key: requestKey, payload: data, error: ""}); })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({key: requestKey, payload: emptySummary, error: error instanceof Error ? error.message : "Failed to load totals"});
      });
    return () => controller.abort();
  }, [academicYear, requestKey]);

  const current = Boolean(academicYear) && result.key === requestKey;
  return {
    summary: current ? result.payload : emptySummary,
    loading: Boolean(academicYear) && !current,
    error: current ? result.error : "",
    reload,
  };
}
