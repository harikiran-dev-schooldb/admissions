/** Page controls shared by the admin audit API and activity timeline. */
export const AUDIT_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AuditPageSize = (typeof AUDIT_PAGE_SIZES)[number];
export const DEFAULT_AUDIT_PAGE_SIZE: AuditPageSize = 10;

export function parseAuditPage(raw: string | null | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? Math.min(value, 1_000_000) : 1;
}

export function parseAuditPageSize(raw: string | null | undefined): AuditPageSize {
  const value = Number(raw);
  return AUDIT_PAGE_SIZES.find((size) => size === value) ?? DEFAULT_AUDIT_PAGE_SIZE;
}

export function getAuditPagination(total: number, requestedPage: number, pageSize: AuditPageSize) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(requestedPage, pages));
  return {
    total, pages, page, pageSize,
    skip: (page - 1) * pageSize,
    start: total === 0 ? 0 : (page - 1) * pageSize + 1,
    end: Math.min(total, page * pageSize),
  };
}

/** Fixed-size window avoids hundreds of numbered buttons for large histories. */
export function getAuditPageWindow(page: number, pages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  return Array.from({ length: Math.min(5, pages) }, (_, index) => start + index);
}
