import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({ children, className = "", ...props }: Props) {
  return (
    <button
      {...props}
      className={`
        px-4 py-2 rounded-xl
        font-medium
        transition-all
        bg-sky-600
        text-white
        hover:opacity-90
        disabled:opacity-50
        ${className}
      `}
    >
      {children}
    </button>
  );
}
