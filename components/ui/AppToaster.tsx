"use client";

import { Toaster } from "sonner";

/** Consistent, accessible, nonblocking notices; no native window.alert dialogs. */
export default function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      visibleToasts={4}
      duration={5000}
      gap={12}
      toastOptions={{
        className: "!rounded-2xl !border !border-slate-200 !shadow-[0_18px_50px_rgba(15,23,42,.14)]",
        style: { padding: "16px", fontSize: "14px", fontWeight: 600 },
      }}
    />
  );
}
