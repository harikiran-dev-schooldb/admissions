"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Admission } from "@/src/generated/prisma/client";
import { DEFAULT_ADMISSION_PAGE_SIZE, type AdmissionPageSize } from "@/lib/admissions/pagination";
import { toAdmissionSearchParams, type AdmissionSearchFilters } from "@/lib/admissions/filterQuery";

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
  yearTotal: number;
  admitted: number;
  applicationsTaken: number;
  applicationSubmitted: number;
  entrancePassed: number;
  interviewSelected: number;
  classOptions: string[];
};

const emptyDirectory: DirectoryPayload = { data: [], total: 0, page: 1, pageSize: DEFAULT_ADMISSION_PAGE_SIZE, totalPages: 1 };
export const emptySummary: AdmissionSummary = {
  total: 0,
  yearTotal: 0,
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
    const query = toAdmissionSearchParams(filters);
    query.set("page", String(filters.page));
    query.set("pageSize", String(filters.pageSize));
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

export function useAdmissionsSummary(filters: AdmissionSearchFilters, enabled: boolean = true) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  const params = useMemo(() => toAdmissionSearchParams(filters).toString(), [
    filters.academicYear, filters.search, filters.classFilter, filters.finalStatusFilter, filters.applicationFilter,
  ]);
  const requestKey = `${params}&r=${refresh}&enabled=${enabled}`;
  const [result, setResult] = useState<{key: string; payload: AdmissionSummary; error: string}>({
    key: "",
    payload: emptySummary,
    error: "",
  });

  useEffect(() => {
    if (!filters.academicYear || !enabled) return;
    const controller = new AbortController();
    fetch(`/api/admissions/stats?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(jsonOrThrow<{data: AdmissionSummary}>)
      .then(({data}) => { if (!controller.signal.aborted) setResult({key: requestKey, payload: data, error: ""}); })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({key: requestKey, payload: emptySummary, error: error instanceof Error ? error.message : "Failed to load totals"});
      });
    return () => controller.abort();
  }, [filters.academicYear, enabled, params, requestKey]);

  const current = Boolean(filters.academicYear) && enabled && result.key === requestKey;
  return {
    summary: current ? result.payload : emptySummary,
    loading: Boolean(filters.academicYear) && enabled && !current,
    error: current ? result.error : "",
    reload,
  };
}


/** Read-only class names for staff; does not call the admin-only KPI endpoint. */
export function useAdmissionClassOptions(academicYear: string, enabled: boolean) {
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => setRefresh((value) => value + 1), []);
  const requestKey = `${academicYear}&refresh=${refresh}&enabled=${enabled}`;
  const [result, setResult] = useState<{ key: string; data: string[]; error: string }>({
    key: "",
    data: [],
    error: "",
  });
  useEffect(() => {
    if (!academicYear || !enabled) return;
    const controller = new AbortController();
    fetch(`/api/admissions/classes?academicYear=${encodeURIComponent(academicYear)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(jsonOrThrow<{data: string[]}>)
      .then(({ data }) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data, error: "" });
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setResult({
          key: requestKey, data: [],
          error: caught instanceof Error ? caught.message : "Failed to load class filters",
        });
      });
    return () => controller.abort();
  }, [academicYear, enabled, requestKey]);

  const current = enabled && !!academicYear && result.key === requestKey;
  return { classOptions: current ? result.data : [], error: current ? result.error : "", reload };
}
