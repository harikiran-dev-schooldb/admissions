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
};

export default function SchoolDbSelect({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  className = "",
}: Props) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-base font-normal text-slate-900 shadow-sm outline-none transition-all duration-200 hover:border-indigo-300 focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-100 data-[state=open]:border-indigo-400 data-[state=open]:ring-4 data-[state=open]:ring-indigo-100 sm:h-10 sm:text-sm ${className}`}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform duration-200" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="relative z-[100] max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-slate-200/80 bg-white text-slate-900 shadow-[0_20px_50px_rgb(15_23_42_/_0.16)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-slate-500"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex w-full cursor-default select-none items-center gap-2 rounded-lg py-2 pl-2.5 pr-8 text-sm font-medium outline-none transition-colors focus:bg-indigo-50 focus:text-indigo-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
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
