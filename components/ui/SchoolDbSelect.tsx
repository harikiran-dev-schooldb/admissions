"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export type SchoolDbSelectOption = {
  label: string;
  value: string;
};

type Props = {
  value?: string;
  onValueChange: (value: string) => void;
  options: readonly SchoolDbSelectOption[];
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
};

export default function SchoolDbSelect({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className = "",
  disabled = false,
}: Props) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={`group flex h-11 w-full min-w-0 items-center justify-between gap-3 whitespace-nowrap rounded-2xl border border-slate-200 bg-white px-3.5 text-left text-sm font-semibold text-slate-800 shadow-[0_2px_7px_rgba(15,23,42,.045)] outline-none transition-colors duration-150 hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-100 data-[state=open]:border-indigo-400 data-[state=open]:bg-indigo-50/60 data-[state=open]:ring-4 data-[state=open]:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none sm:h-10 ${className}`}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="min-w-0 flex-1 truncate text-left" />
        <SelectPrimitive.Icon asChild>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-indigo-500 transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          align="end"
          sideOffset={7}
          collisionPadding={12}
          className="relative z-[100] max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-indigo-100 bg-white p-1 text-slate-900 shadow-[0_18px_48px_rgba(15,23,42,.18)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-slate-500"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex min-h-11 w-full cursor-pointer select-none items-center gap-2 rounded-xl py-2.5 pl-3 pr-9 text-sm font-semibold leading-5 outline-none transition-colors focus:bg-indigo-50 focus:text-indigo-700 data-[state=checked]:bg-indigo-50 data-[state=checked]:text-indigo-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemText><span className="block whitespace-normal break-words">{option.label}</span></SelectPrimitive.ItemText>
                <span className="absolute right-2 flex size-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator><Check className="size-3.5 text-indigo-600" strokeWidth={2.5} /></SelectPrimitive.ItemIndicator>
                </span>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-slate-500"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
