import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input(props: Props) {
  return (
    <input
      {...props}
      className="
        w-full
        border
        rounded-xl
        px-4
        py-3
        outline-none
        focus:ring-2
        focus:ring-sky-500
      "
    />
  );
}
