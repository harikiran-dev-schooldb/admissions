"use client";

type Props = {
  value: string;
  onClick?: () => void;
  disabled?: boolean;
};

export default function StatusPill({ value, onClick, disabled }: Props) {
  const map: Record<string, string> = {
    YES: "bg-green-600 text-white",
    NO: "bg-red-500 text-white",
    PASS: "bg-green-600 text-white",
    FAIL: "bg-red-500 text-white",
    SELECTED: "bg-green-600 text-white",
    REJECTED: "bg-red-500 text-white",
    "NOT STARTED": "bg-gray-300 text-gray-700",
    PENDING: "bg-gray-300 text-gray-700",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        px-3 py-1 text-xs rounded-full font-medium
        ${map[value] || "bg-gray-300 text-gray-700"}
      `}
    >
      {value}
    </button>
  );
}
