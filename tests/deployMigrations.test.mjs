import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("production checks migration status and never bypasses pending or failed migrations", { skip: process.platform === "win32" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "admissions-prisma-status-"));
  const binary = join(directory, "npx");
  const callsFile = join(directory, "calls.txt");
  writeFileSync(binary, String.raw`#!/bin/sh
printf '%s\n' "$4" >> "$MIGRATION_CALLS_FILE"
if [ "$4" = "status" ]; then exit "${MOCK_STATUS_EXIT:-0}"; fi
if [ "$4" = "deploy" ]; then exit "${MOCK_DEPLOY_EXIT:-0}"; fi
exit 2
`);
  chmodSync(binary, 0o755);

  const execute = (environment) => {
    writeFileSync(callsFile, "");
    const result = spawnSync(process.execPath, ["scripts/deploy-migrations.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: directory + ":" + process.env.PATH,
        MIGRATION_CALLS_FILE: callsFile,
        DATABASE_URL: "postgresql://test:test@localhost/test",
        ...environment,
      },
    });
    return { code: result.status, calls: readFileSync(callsFile, "utf8").trim().split("\n").filter(Boolean), stderr: result.stderr };
  };

  try {
    const upToDate = execute({ VERCEL_ENV: "production", MOCK_STATUS_EXIT: "0" });
    assert.equal(upToDate.code, 0, upToDate.stderr);
    assert.deepEqual(upToDate.calls, ["status"]);

    const pending = execute({ VERCEL_ENV: "production", MOCK_STATUS_EXIT: "1", MOCK_DEPLOY_EXIT: "0" });
    assert.equal(pending.code, 0, pending.stderr);
    assert.deepEqual(pending.calls, ["status", "deploy"]);

    const failed = execute({ VERCEL_ENV: "production", MOCK_STATUS_EXIT: "1", MOCK_DEPLOY_EXIT: "1" });
    assert.notEqual(failed.code, 0);
    assert.deepEqual(failed.calls, ["status", "deploy"]);

    const preview = execute({ VERCEL_ENV: "preview", MOCK_STATUS_EXIT: "1" });
    assert.equal(preview.code, 0, preview.stderr);
    assert.deepEqual(preview.calls, []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
