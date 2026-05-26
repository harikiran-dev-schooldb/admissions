"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  reload: () => void;
}

export default function NewFeeModal({ open, onClose, reload }: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    age: "",
    className: "",
    termFee: "",
    totalFee: "",
  });

  if (!open) return null;

  async function handleSubmit() {
    try {
      setLoading(true);

      const res = await fetch("/api/fees", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,
          termFee: Number(form.termFee),
          totalFee: Number(form.totalFee),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Failed to create fee");

        return;
      }

      reload();

      onClose();

      setForm({
        age: "",
        className: "",
        termFee: "",
        totalFee: "",
      });
    } catch (error) {
      console.error(error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        backdrop-blur-sm
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            px-6
            py-5
          "
        >
          <div>
            <h2
              className="
                text-xl
                font-bold
                text-slate-900
              "
            >
              New Fee Structure
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Create fee details for a class
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              rounded-xl
              bg-slate-100
              px-3
              py-2
              text-sm
              font-medium
              text-slate-700
              transition-all
              hover:bg-slate-200
            "
          >
            Close
          </button>
        </div>

        {/* FORM */}

        <div className="space-y-5 p-6">
          {/* AGE */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-700
              "
            >
              Age
            </label>

            <input
              type="text"
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="Example: 5+"
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-sm
                outline-none
                transition-all
                focus:border-slate-400
                focus:bg-white
              "
            />
          </div>

          {/* CLASS */}

          <div>
            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-slate-700
              "
            >
              Class
            </label>

            <input
              type="text"
              value={form.className}
              onChange={(e) => updateField("className", e.target.value)}
              placeholder="Example: UKG"
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-sm
                outline-none
                transition-all
                focus:border-slate-400
                focus:bg-white
              "
            />
          </div>

          {/* FEES */}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Term Fee
              </label>

              <input
                type="number"
                value={form.termFee}
                onChange={(e) => updateField("termFee", e.target.value)}
                placeholder="15000"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition-all
                  focus:border-slate-400
                  focus:bg-white
                "
              />
            </div>

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-700
                "
              >
                Total Fee
              </label>

              <input
                type="number"
                value={form.totalFee}
                onChange={(e) => updateField("totalFee", e.target.value)}
                placeholder="45000"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition-all
                  focus:border-slate-400
                  focus:bg-white
                "
              />
            </div>
          </div>

          {/* FOOTER */}

          <div
            className="
              flex
              justify-end
              gap-3
              pt-2
            "
          >
            <button
              onClick={onClose}
              className="
                rounded-xl
                border
                border-slate-200
                px-5
                py-3
                text-sm
                font-semibold
                text-slate-700
                transition-all
                hover:bg-slate-50
              "
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="
                rounded-xl
                bg-slate-900
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition-all
                hover:bg-slate-800
                disabled:opacity-50
              "
            >
              {loading ? "Saving..." : "Create Fee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
