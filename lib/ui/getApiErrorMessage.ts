/** Surface meaningful server validation errors without exposing raw internals. */
export function getApiErrorMessage(
  response: { error?: unknown; issues?: Record<string, unknown> } | null,
  fallback: string,
): string {
  if (!response) return fallback;
  const messages = response.issues
    ? Object.values(response.issues).flatMap((value) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [])
    : [];
  if (messages.length) return messages.join(" · ");
  return typeof response.error === "string" && response.error.trim() ? response.error : fallback;
}
