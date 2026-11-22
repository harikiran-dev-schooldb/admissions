// Vercel Preview and ordinary local builds must never migrate a production DB.
// Only production deployments run the checked-in, idempotent Prisma migrations.
// Prisma exits nonzero if a migration cannot be applied; then Vercel will not
// publish a build that depends on missing database tables.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing; cannot migrate the production database");
    process.exit(1);
  }
  console.info("Applying Prisma migrations before the production build...");
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["--no-install", "prisma", "migrate", "deploy"], {
    env: process.env,
    stdio: "inherit",
  });
  if (result.error || result.status !== 0) {
    console.error("Database migrations failed; stopping deployment");
    process.exit(result.status || 1);
  }
} else {
  console.info("Skipping database migrations for non-production build");
}
