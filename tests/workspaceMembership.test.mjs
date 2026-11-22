import test from "node:test";
import assert from "node:assert/strict";
import { resolveAccessRole, canAccess, normalizeEmail, isBootstrapAdmin } from "../lib/auth/accessPolicy.ts";

test("bootstrap admin always has full rights, even if database role is disabled", () => {
  const role = resolveAccessRole("OWNER@EXAMPLE.COM", "owner@example.com", "", { role: "STAFF", isActive: false });
  assert.equal(role, "admin");
  assert.equal(canAccess(role, "admin"), true);
  assert.equal(isBootstrapAdmin(" owner@example.com ", "owner@example.com"), true);
});

test("admin can grant staff and additional admin access through stored membership", () => {
  assert.equal(resolveAccessRole("new@school.com", "owner@school.com", "", { role: "STAFF", isActive: true }), "staff");
  assert.equal(resolveAccessRole("new@school.com", "owner@school.com", "", { role: "ADMIN", isActive: true }), "admin");
});

test("deactivation revokes even a legacy environment staff grant", () => {
  const role = resolveAccessRole("staff@school.com", "owner@school.com", "staff@school.com", { role: "STAFF", isActive: false });
  assert.equal(role, null);
  assert.equal(canAccess(role, "read"), false);
  assert.equal(canAccess(role, "enquiry"), false);
  assert.equal(canAccess(role, "workflow"), false);
});

test("existing legacy staff can sign in before migration to database roles", () => {
  assert.equal(resolveAccessRole("STAFF@SCHOOL.COM", "owner@school.com", "staff@school.com"), "staff");
});

test("unknown and empty admin configuration always fail closed", () => {
  assert.equal(resolveAccessRole("admin@example.com", "", "admin@example.com", {role:"ADMIN",isActive:true}), null);
  assert.equal(resolveAccessRole("nobody@school.com", "owner@school.com", ""), null);
  assert.equal(normalizeEmail("  Test@School.com  "), "test@school.com");
});

test("only admin role may mutate master data", () => {
  for (const level of ["read","enquiry","workflow"]) assert.equal(canAccess("staff", level), true);
  assert.equal(canAccess("staff", "admin"), false);
});
