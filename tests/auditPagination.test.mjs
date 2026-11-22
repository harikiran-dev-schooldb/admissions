import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AUDIT_PAGE_SIZES, DEFAULT_AUDIT_PAGE_SIZE,
  parseAuditPage, parseAuditPageSize, getAuditPagination, getAuditPageWindow,
} from "../lib/audit/pagination.ts";

const source = (path) => readFileSync(path, "utf8");

test("audit defaults to 10 rows and allows only supported page sizes", () => {
  assert.deepEqual([...AUDIT_PAGE_SIZES], [10, 25, 50, 100]);
  assert.equal(DEFAULT_AUDIT_PAGE_SIZE, 10);
  for (const [input, expected] of [[null, 10], ["10", 10], ["25", 25], ["50", 50], ["100", 100], ["0", 10], ["999", 10], ["abc", 10]]) {
    assert.equal(parseAuditPageSize(input), expected);
  }
});

test("audit page input is validated and extreme page numbers are bounded", () => {
  for (const input of [null, "", "0", "-1", "2.5", "abc", "999999999999999999"]) {
    assert.equal(parseAuditPage(input), 1);
  }
  assert.equal(parseAuditPage("3"), 3);
  assert.equal(parseAuditPage("1000001"), 1_000_000);
});

test("audit page metadata clamps overflow and returns correct result ranges", () => {
  assert.deepEqual(getAuditPagination(0, 40, 10), { total: 0, pages: 1, page: 1, pageSize: 10, skip: 0, start: 0, end: 0 });
  assert.deepEqual(getAuditPagination(23, 2, 10), { total: 23, pages: 3, page: 2, pageSize: 10, skip: 10, start: 11, end: 20 });
  assert.deepEqual(getAuditPagination(23, 99, 10), { total: 23, pages: 3, page: 3, pageSize: 10, skip: 20, start: 21, end: 23 });
});

test("numbered audit page controls remain within the available page range", () => {
  assert.deepEqual(getAuditPageWindow(1, 1), [1]);
  assert.deepEqual(getAuditPageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(getAuditPageWindow(1, 12), [1, 2, 3, 4, 5]);
  assert.deepEqual(getAuditPageWindow(7, 12), [5, 6, 7, 8, 9]);
  assert.deepEqual(getAuditPageWindow(12, 12), [8, 9, 10, 11, 12]);
});

test("audit page requests server pagination with filters and administrator-only access", () => {
  const api = source("app/api/audit-logs/route.ts");
  const ui = source("components/audit/ActivityLogPageClient.tsx");
  assert.ok(api.includes('requireAccess("admin")'));
  assert.ok(api.includes("parseAuditPageSize(url.searchParams.get"));
  assert.ok(api.includes("skip: pagination.skip"));
  assert.ok(api.includes("take: pagination.pageSize"));
  assert.ok(api.includes('orderBy: [{ createdAt: "desc" }, { id: "desc" }]'));
  assert.ok(ui.includes("pageSize: String(pageSize)"));
  assert.ok(ui.includes('aria-label="Audit pagination"'));
  assert.ok(ui.includes('aria-label="Audit result pages"'));
  assert.ok(ui.includes('ariaLabel="Audit rows per page"'));
  assert.ok(ui.includes('aria-current={number === currentPage ? "page" : undefined}'));
  assert.ok(ui.includes('setPage(1)'));
  assert.ok(ui.includes('controller.abort()'));
});
