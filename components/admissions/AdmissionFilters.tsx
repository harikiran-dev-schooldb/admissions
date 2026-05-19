"use client";

type Props = {
  search: string;
  setSearch: (v: string) => void;
};

export default function AdmissionFilters({ search, setSearch }: Props) {
  return (
    <div className="flex gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search admissions"
        className="border rounded-lg px-3 py-2 w-full"
      />
    </div>
  );
}
