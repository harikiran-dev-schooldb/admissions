"use client";

import { useCallback, useEffect, useState } from "react";
import { ADMISSION_SETTINGS_EVENT, defaultAdmissionSettings, type AdmissionSettings } from "@/lib/admissionSettings";

async function readSettings(): Promise<AdmissionSettings> {
  const response = await fetch("/api/settings", { cache: "no-store" });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || "Unable to load admission settings");
  return json.data as AdmissionSettings;
}

export function useAdmissionSettings() {
  const [settings, setSettingsState] = useState<AdmissionSettings>(defaultAdmissionSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setError("");
      const value = await readSettings();
      setSettingsState(value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void readSettings()
      .then((value) => { if (!cancelled) setSettingsState(value); })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load settings");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    const sync = () => { void reload(); };
    window.addEventListener(ADMISSION_SETTINGS_EVENT, sync);
    return () => { cancelled = true; window.removeEventListener(ADMISSION_SETTINGS_EVENT, sync); };
  }, [reload]);

  const saveSettings = useCallback(async (next: AdmissionSettings) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Unable to save admission settings");
    setSettingsState(json.data as AdmissionSettings);
    window.dispatchEvent(new Event(ADMISSION_SETTINGS_EVENT));
  }, []);

  return { settings, saveSettings, loading, error, reload };
}
