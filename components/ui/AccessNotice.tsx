"use client";

import { Eye, ShieldAlert } from "lucide-react";
import type { AccessRole } from "@/lib/auth/accessPolicy";

export default function AccessNotice({ role, error }: { role: AccessRole | null; error?: string }) {
  if (error) {
    return <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><ShieldAlert className="size-4 shrink-0" />{error}</div>;
  }
  if (role !== "staff") return null;
  return <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm font-semibold text-indigo-800"><Eye className="size-5 shrink-0" /><span>Staff view-only mode. You can view records and reports, but only administrators can create, edit, delete, or change admission stages.</span></div>;
}
