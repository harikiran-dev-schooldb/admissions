// src/components/admissions/AdmissionsHeader.tsx

"use client";

import { Maximize2, Minimize2, School } from "lucide-react";

interface AdmissionsHeaderProps {
  total: number;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export default function AdmissionsHeader({
  total,
  isFullScreen,
  onToggleFullScreen,
}: AdmissionsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-2xl">
      <div className="px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 shadow-xl shadow-blue-200">
              <School className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Admissions Dashboard
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Manage enquiries & admission workflow
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleFullScreen}
              className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg transition hover:scale-105 hover:bg-white"
            >
              {isFullScreen ? (
                <Minimize2 className="h-5 w-5 text-slate-700" />
              ) : (
                <Maximize2 className="h-5 w-5 text-slate-700" />
              )}
            </button>

            <button
              className="
    rounded-2xl
    bg-blue-600
    px-5
    py-3
    text-sm
    font-semibold
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
