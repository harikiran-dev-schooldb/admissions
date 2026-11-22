import test from "node:test";
import assert from "node:assert/strict";
import { resolveAccessRole, canAccess } from "../lib/auth/accessPolicy.ts";

test("admins may read and modify records", () => {
  const role = resolveAccessRole("ADMIN@EXAMPLE.COM", "admin@example.com", "staff@example.com");
  assert.equal(role, "admin");
  assert.equal(canAccess(role, "read"), true);
  assert.equal(canAccess(role, "enquiry"), true);
  assert.equal(canAccess(role, "workflow"), true);
  assert.equal(canAccess(role, "admin"), true);
});

test("staff may create enquiries and update admission workflow, but cannot edit master data", () => {
  const role = resolveAccessRole(" Staff@Example.Com ", "admin@example.com", "staff@example.com");
  assert.equal(role, "staff");
  assert.equal(canAccess(role, "read"), true);
  assert.equal(canAccess(role, "enquiry"), true);
  assert.equal(canAccess(role, "workflow"), true);
  assert.equal(canAccess(role, "admin"), false);
});

test("unlisted users and missing administrator configuration are denied", () => {
  assert.equal(resolveAccessRole("unknown@example.com", "admin@example.com", "staff@example.com"), null);
  assert.equal(resolveAccessRole("staff@example.com", "", "staff@example.com"), null);
  assert.equal(resolveAccessRole(null, "admin@example.com", "staff@example.com"), null);
  assert.equal(canAccess(null, "read"), false);
  assert.equal(canAccess(null, "admin"), false);
  assert.equal(canAccess(null, "enquiry"), false);
  assert.equal(canAccess(null, "workflow"), false);
});

test("admins take precedence over duplicate staff entries", () => {
  assert.equal(resolveAccessRole("admin@example.com", " admin@example.com ", "admin@example.com"), "admin");
});

test("do not grant access based on domains or partial matches", () => {
  assert.equal(resolveAccessRole("hacker@school.example", "admin@school.example", "staff@school.example"), null);
  assert.equal(resolveAccessRole("notadmin@school.example", "admin@school.example", undefined), null);
});
