// Vercel Preview and local builds must never migrate the production database.
// Production checks migration status over a direct Neon connection. If the
// checked-in migrations are all applied, it skips the advisory-lock acquisition.
// Pending or failed status checks fall through to Prisma's safe migrate deploy;
// an unsuccessful deploy still blocks the release.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing; cannot check production database migrations");
    process.exit(1);
  }

  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const runPrisma = (args) => spawnSync(executable, ["--no-install", "prisma", "migrate", ...args], {
    env: process.env,
    stdio: "inherit",
  });

  console.info("Checking Prisma migration status before the production build...");
  const status = runPrisma(["status"]);
  if (status.error) {
    console.error("Cannot execute Prisma migration status", status.error.message);
    process.exit(1);
  }

  if (status.status === 0) {
    console.info("Prisma migration history is up to date; skipping migrate deploy.");
  } else {
    // Status can be nonzero for pending migrations, missing migration history,
    // or a failed migration. Only a successful migrate deploy may proceed.
    console.info("Database migration status needs attention; running migrate deploy...");
    const result = runPrisma(["deploy"]);
    if (result.error || result.status !== 0) {
      console.error("Database migrations failed; stopping deployment");
      process.exit(result.status || 1);
    }
  }
} else {
  console.info("Skipping database migrations for non-production build");
}
