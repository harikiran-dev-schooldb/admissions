import type { Prisma } from "@/src/generated/prisma/client";

export type AdmissionSearchFilters = {
  academicYear: string;
  search: string;
  classFilter: string;
  finalStatusFilter: string;
  applicationFilter: string;
};

/** A single query builder for the paginated directory and administrator KPIs. */
export function toAdmissionSearchParams(filters: AdmissionSearchFilters): URLSearchParams {
  const params = new URLSearchParams({ academicYear: filters.academicYear });
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (filters.classFilter !== "ALL") params.set("class", filters.classFilter);
  if (filters.finalStatusFilter !== "ALL") params.set("status", filters.finalStatusFilter);
  if (filters.applicationFilter !== "ALL") params.set("application", filters.applicationFilter);
  return params;
}

/** Apply identical database predicates to directory results and KPI aggregates. */
export function getAdmissionWhere(params: URLSearchParams): Prisma.AdmissionWhereInput {
  const q = params.get("q")?.trim().slice(0, 120);
  const academicYear = params.get("academicYear")?.trim();
  const classFilter = params.get("class")?.trim();
  const finalStatus = params.get("status");
  const appStatus = params.get("application");
  const finalAdmission = (["PENDING", "ADMITTED", "CANCELLED"] as const).find((value) => value === finalStatus);
  const application = (["NO", "YES", "SUBMITTED"] as const).find((value) => value === appStatus);
  return {
    ...(academicYear ? { academicYear } : {}),
    ...(classFilter && classFilter !== "ALL" ? { admClass: classFilter } : {}),
    ...(finalAdmission ? { finalAdmission } : {}),
    ...(application ? { application } : {}),
    ...(q ? { OR: [
      { student: { contains: q, mode: "insensitive" } },
      { parent: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q } },
      { enquiryNo: { contains: q, mode: "insensitive" } },
      { admClass: { contains: q, mode: "insensitive" } },
    ] } : {}),
  };
}
