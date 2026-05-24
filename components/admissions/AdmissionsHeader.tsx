// src/components/admissions/AdmissionsHeader.tsx

"use client";

import { Currency, School } from "lucide-react";
import Link from "next/link";
import { BarChart3, Home } from "lucide-react";

interface AdmissionsHeaderProps {
  total: number;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onOpenNew: () => void;
}

export default function AdmissionsHeader({
  total,
  isFullScreen,
  onToggleFullScreen,
  onOpenNew,
}: AdmissionsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl">
      <div className="px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-xl shadow-blue-200">
              <Currency className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Admissions Dashboard
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Manage enquiries & admission workflow
              </p>

              <p className="mt-2 text-xs font-semibold text-blue-600">
                Total Admissions: {total}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <Link
              href="/admissions"
              className="
    flex
    items-center
    gap-2
    rounded-2xl
    border
    border-slate-200
    bg-white
    px-5
    py-3
    text-sm
    font-semibold
    text-slate-700
    shadow-sm
    transition-all
    hover:scale-105
    hover:bg-slate-50
  "
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/fees"
              className="
    flex
    items-center
    gap-2
    rounded-2xl
    border
    border-slate-200
    bg-white
    px-5
    py-3
    text-sm
    font-semibold
    text-slate-700
    shadow-sm
    transition-all
    hover:scale-105
    hover:bg-slate-50
  "
            >
              <Home className="h-4 w-4" />
              Fees
            </Link>

            <Link
              href="/admissions/analytics"
              className="
    flex
    items-center
    gap-2
    rounded-2xl
    border
    border-slate-200
    bg-white
    px-5
    py-3
    text-sm
    font-semibold
    text-slate-700
    shadow-sm
    transition-all
    hover:scale-105
    hover:bg-slate-50
  "
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>

            <button
              onClick={onOpenNew}
              className="
                rounded-2xl
                bg-blue-600
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-blue-200
                transition-all
                hover:scale-105
                hover:bg-blue-700
              "
            >
              + New Enquiry
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
