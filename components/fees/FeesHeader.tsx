"use client";

import Link from "next/link";

import { DollarSign, Maximize2, Minimize2, Plus } from "lucide-react";

interface FeesHeaderProps {
  total: number;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onOpenNew: () => void;
}

export default function FeesHeader({
  total,
  isFullScreen,
  onToggleFullScreen,
  onOpenNew,
}: FeesHeaderProps) {
  return (
    <header
      className="
        sticky
        top-0
        z-40
        border-b
        border-slate-200/70
        bg-white/80
        backdrop-blur-2xl
      "
    >
      <div className="px-6 py-5">
        <div
          className="
            flex
            flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div className="flex items-center gap-4">
            <div
              className="
                rounded-3xl
                bg-gradient-to-br
                from-emerald-600
                to-green-600
                p-4
                shadow-xl
                shadow-emerald-200
              "
            >
              <DollarSign className="h-7 w-7 text-white" />
            </div>

            <div>
              <h1
                className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-slate-900
                "
              >
                Fees Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage school fee structures
              </p>

              <p
                className="
                  mt-2
                  text-xs
                  font-semibold
                  text-emerald-600
                "
              >
                Total Records: {total}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admissions"
              className="
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
              "
            >
              Admissions
            </Link>

            <button
              onClick={onToggleFullScreen}
              className="
                rounded-2xl
                border
                border-white/70
                bg-white/90
                p-4
                shadow-lg
                transition
                hover:scale-105
              "
            >
              {isFullScreen ? (
                <Minimize2 className="h-5 w-5 text-slate-700" />
              ) : (
                <Maximize2 className="h-5 w-5 text-slate-700" />
              )}
            </button>

            <button
              onClick={onOpenNew}
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                bg-emerald-600
                px-6
                py-3
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-emerald-200
                transition-all
                hover:scale-105
                hover:bg-emerald-700
              "
            >
              <Plus className="h-4 w-4" />
              New Fee
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
