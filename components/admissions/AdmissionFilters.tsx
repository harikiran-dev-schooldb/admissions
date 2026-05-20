// src/components/admissions/AdmissionsFilters.tsx

"use client";

import { Search } from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
}

export default function AdmissionsFilters({ search, setSearch }: Props) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-xl">
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student, parent or mobile..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}
