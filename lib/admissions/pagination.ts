/** Stable pagination parameters used by Admissions page and API. */
export const ADMISSION_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AdmissionPageSize = typeof ADMISSION_PAGE_SIZES[number];

export function parsePage(value: string | null | undefined): number {
  const parsed = Number(value);
  return value && /^\d+$/.test(value) && Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, 1000000)
    : 1;
}

export function parsePageSize(value: string | null | undefined): AdmissionPageSize {
  const parsed = Number(value);
  return ADMISSION_PAGE_SIZES.find((size) => size === parsed) ?? 25;
}

export function getPagination(total: number, requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(requestedPage, totalPages));
  return {
    page,
    pageSize,
    total,
    totalPages,
    start: total === 0 ? 0 : (page - 1) * pageSize + 1,
    end: total === 0 ? 0 : Math.min(page * pageSize, total),
    skip: (page - 1) * pageSize,
  };
}
