/**
 * Prisma Migrate uses session-level PostgreSQL advisory locks, so it must not
 * run over Neon's transaction pooler. Normal PrismaPg application queries can
 * continue to use DATABASE_URL (pooled) unchanged.
 *
 * Prefer an explicitly configured direct URL. For existing Neon deployments
 * with only a pooled DATABASE_URL, derive the direct endpoint by removing the
 * "-pooler" suffix from the first hostname label. Retain credentials, database,
 * and TLS/query parameters; never print the resulting URL in logs.
 */
export function resolvePrismaMigrationUrl(env: Record<string, string | undefined>): string | undefined {
  const direct = env.DATABASE_URL_UNPOOLED?.trim() || env.DIRECT_URL?.trim();
  if (direct) return direct;

  const pooled = env.DATABASE_URL;
  if (!pooled) return undefined;

  try {
    const url = new URL(pooled);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return pooled;
    if (!url.hostname.endsWith(".neon.tech")) return pooled;

    const labels = url.hostname.split(".");
    if (!labels[0].endsWith("-pooler")) return pooled;

    labels[0] = labels[0].slice(0, -"-pooler".length);
    if (!labels[0]) return pooled;
    url.hostname = labels.join(".");
    return url.toString();
  } catch {
    // Let Prisma report invalid URLs instead of silently inventing an endpoint.
    return pooled;
  }
}
