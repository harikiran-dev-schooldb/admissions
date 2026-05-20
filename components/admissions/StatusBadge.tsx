// src/components/admissions/StatusBadge.tsx

interface Props {
  value: string;
}

export default function StatusBadge({ value }: Props) {
  const styles: Record<string, string> = {
    PASS: "bg-emerald-100 text-emerald-700",
    FAIL: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    SELECTED: "bg-sky-100 text-sky-700",
    REJECTED: "bg-rose-100 text-rose-700",
    CONFIRMED: "bg-purple-100 text-purple-700",
    TAKEN: "bg-indigo-100 text-indigo-700",
    SUBMITTED: "bg-cyan-100 text-cyan-700",
    NOT_STARTED: "bg-slate-100 text-slate-600",
  };

  return (
    <div
      className={`inline-flex rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        styles[value] || "bg-slate-100 text-slate-700"
      }`}
    >
      {value.replaceAll("_", " ")}
    </div>
  );
}
