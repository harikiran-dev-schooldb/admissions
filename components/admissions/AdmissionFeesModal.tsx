"use client";

import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedClass: string;
};

const fees = [
  { age: 3, className: "PRE KG", termFee: 6500, totalFee: 26000 },
  { age: 4, className: "LKG", termFee: 7250, totalFee: 29000 },
  { age: 5, className: "UKG", termFee: 7250, totalFee: 29000 },
  { age: 6, className: "I", termFee: 8400, totalFee: 33600 },
  { age: 7, className: "II", termFee: 8400, totalFee: 33600 },
  { age: 8, className: "III", termFee: 8700, totalFee: 34800 },
  { age: 9, className: "IV", termFee: 8700, totalFee: 34800 },
  { age: 10, className: "V", termFee: 9000, totalFee: 36000 },
  { age: 11, className: "VI", termFee: 9000, totalFee: 36000 },
  { age: 12, className: "VII", termFee: 9400, totalFee: 37600 },
  { age: 13, className: "VIII", termFee: 11600, totalFee: 46400 },
  { age: 14, className: "IX", termFee: 12300, totalFee: 49200 },
  { age: 15, className: "X", termFee: 12300, totalFee: 49200 },
];

export default function AdmissionFeesModal({
  open,
  onClose,
  selectedClass,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-[60]
        flex
        items-center
        justify-center
        bg-black/50
        backdrop-blur-sm
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-5xl
          overflow-hidden
          rounded-[32px]
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
            bg-gradient-to-r
            from-blue-600
            to-blue-500
            px-8
            py-6
            text-white
          "
        >
          <div>
            <h2 className="text-3xl font-black">Fee Structure</h2>

            <p className="mt-1 text-sm text-blue-100">
              Admission enquiry saved successfully
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-white/20
              hover:bg-white/30
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TABLE */}

        <div className="p-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-blue-500 text-white">
                  <th className="px-6 py-4 text-center text-lg font-bold">
                    Age
                  </th>

                  <th className="px-6 py-4 text-center text-lg font-bold">
                    Class
                  </th>

                  <th className="px-6 py-4 text-center text-lg font-bold">
                    Term Fee
                  </th>

                  <th className="px-6 py-4 text-center text-lg font-bold">
                    Total Fee
                  </th>
                </tr>
              </thead>

              <tbody>
                {fees.map((fee, index) => {
                  const active = fee.className === selectedClass;

                  return (
                    <tr
                      key={fee.className}
                      className={`
                        border-b
                        border-slate-100
                        text-center
                        transition-all

                        ${
                          active
                            ? "bg-yellow-100 font-bold text-yellow-900"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50"
                        }
                      `}
                    >
                      <td className="px-6 py-5 text-lg">{fee.age}</td>

                      <td className="px-6 py-5 text-lg">{fee.className}</td>

                      <td className="px-6 py-5 text-lg font-semibold">
                        ₹ {fee.termFee.toLocaleString()}
                      </td>

                      <td className="px-6 py-5 text-lg font-bold">
                        ₹ {fee.totalFee.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="
                rounded-2xl
                bg-blue-600
                px-8
                py-4
                text-lg
                font-bold
                text-white
                shadow-lg
                shadow-blue-200
                transition-all
                hover:scale-105
                hover:bg-blue-700
              "
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
