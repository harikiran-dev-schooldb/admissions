"use client";

interface Props {
  open: boolean;
  onClose: () => void;
  reload: () => void;
}

export default function NewFeeModal({ open, onClose }: Props) {
  if (!open) return null;

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
          max-w-xl
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
            New Fee Structure
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

        <div className="text-sm text-slate-500">
          Form implementation goes here.
        </div>
      </div>
    </div>
  );
}
