import test from "node:test";
import assert from "node:assert/strict";
import { resolvePrismaMigrationUrl } from "../lib/database/migrationUrl.ts";

const pooled = "postgresql://school:pa%40ss@ep-example-name-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";
const unpooled = "postgresql://school:pa%40ss@ep-example-name.c-7.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require";

test("Prisma migrations use Neon direct host without changing database credentials or TLS settings", () => {
  assert.equal(resolvePrismaMigrationUrl({ DATABASE_URL: pooled }), unpooled);
});

test("explicit unpooled URL takes priority over derived Neon host", () => {
  assert.equal(resolvePrismaMigrationUrl({ DATABASE_URL: pooled, DATABASE_URL_UNPOOLED: "postgresql://direct/db" }), "postgresql://direct/db");
  assert.equal(resolvePrismaMigrationUrl({ DATABASE_URL: pooled, DIRECT_URL: "postgresql://other/db" }), "postgresql://other/db");
});

test("non-Neon, already-direct, and invalid URLs are not rewritten", () => {
  for (const connection of [
    "postgresql://user:pass@localhost:5432/admissions",
    "postgresql://user:pass@db.example.com:5432/app",
    unpooled,
    "not-a-connection-url",
  ]) {
    assert.equal(resolvePrismaMigrationUrl({ DATABASE_URL: connection }), connection);
  }
  assert.equal(resolvePrismaMigrationUrl({}), undefined);
});
