"use client";

import { useSharedAccess } from "@/components/auth/AccessProvider";

/** Shared session profile, loaded once in the root app layout rather than per tab. */
export function useAccess() {
  return useSharedAccess();
}
