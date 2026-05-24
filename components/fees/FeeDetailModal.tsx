"use client";

interface Props {
  fee: any;
  open: boolean;
  onClose: () => void;
}

export default function FeeDetailModal({ fee, open, onClose }: Props) {
  if (!open || !fee) return null;

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
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-3xl
          bg-white
          p-6
          shadow-2xl
        "
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="
              text-2xl
              font-bold
              text-slate-900
            "
          >
            Fee Details
          </h2>

          <button
            onClick={onClose}
            className="
              rounded-xl
              bg-slate-100
              px-3
              py-2
              text-sm
            "
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500">Academic Year</p>

            <p className="font-semibold">{fee.academicYear}</p>
          </div>

          <div>
            <p className="text-slate-500">Class</p>

            <p className="font-semibold">{fee.className}</p>
          </div>

          <div>
            <p className="text-slate-500">Annual Fees</p>

            <p
              className="
                text-lg
                font-bold
                text-emerald-700
              "
            >
              ₹{fee.annualFees.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
