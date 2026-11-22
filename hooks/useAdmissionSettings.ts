"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMISSION_SETTINGS_EVENT, ADMISSION_SETTINGS_KEY, defaultAdmissionSettings, type AdmissionSettings } from "@/lib/admissionSettings";

function readSettings(): AdmissionSettings {
  if (typeof window === "undefined") return defaultAdmissionSettings;
  try {
    const stored = JSON.parse(window.localStorage.getItem(ADMISSION_SETTINGS_KEY) ?? "{}") as Partial<AdmissionSettings>;
    return { ageAsOfDate: /^\d{4}-\d{2}-\d{2}$/.test(stored.ageAsOfDate ?? "") ? stored.ageAsOfDate! : defaultAdmissionSettings.ageAsOfDate };
  } catch {
    return defaultAdmissionSettings;
  }
}

export function useAdmissionSettings() {
  const [settings, setSettingsState] = useState<AdmissionSettings>(defaultAdmissionSettings);
  useEffect(() => {
    const sync = () => setSettingsState(readSettings());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ADMISSION_SETTINGS_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(ADMISSION_SETTINGS_EVENT, sync); };
  }, []);
  const saveSettings = useCallback((next: AdmissionSettings) => {
    window.localStorage.setItem(ADMISSION_SETTINGS_KEY, JSON.stringify(next));
    setSettingsState(next);
    window.dispatchEvent(new Event(ADMISSION_SETTINGS_EVENT));
  }, []);
  return { settings, saveSettings };
}
