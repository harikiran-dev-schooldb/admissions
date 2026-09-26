"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  reload: () => void;
}

const initialForm = {
  academicYear: "2026-27",
  age: "",
  className: "",
  termFee: "",
  annualFees: "",
};

export default function NewFeeModal({ open, onClose, reload }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);

  if (!open) return null;

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: form.academicYear,
          age: form.age || null,
          className: form.className,
          termFee: Number(form.termFee),
          annualFees: Number(form.annualFees),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to create fee");
        return;
      }

      setForm(initialForm);
      reload();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">New Fee Structure</h2>
            <p className="mt-1 text-sm text-slate-500">Create fee details for an academic year and class.</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
            Close
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Academic Year</label>
            <select
              value={form.academicYear}
              onChange={(e) => updateField("academicYear", e.target.value)}
              className={inputClass}
            >
              {["2023-24", "2024-25", "2025-26", "2026-27"].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Age</label>
              <input
                type="text"
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="Example: 5"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Class</label>
              <input
                type="text"
                value={form.className}
                onChange={(e) => updateField("className", e.target.value)}
                placeholder="Example: UKG"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Term Fee</label>
              <input
                type="number"
                min="0"
                value={form.termFee}
                onChange={(e) => updateField("termFee", e.target.value)}
                placeholder="7250"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Annual Fee</label>
              <input
                type="number"
                min="0"
                value={form.annualFees}
                onChange={(e) => updateField("annualFees", e.target.value)}
                placeholder="29000"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {loading ? "Saving..." : "Create Fee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
